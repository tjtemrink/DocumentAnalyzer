const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const axios = require('axios');

// Azure SDK imports
let CosmosClient, SearchClient;
try {
  CosmosClient = require('@azure/cosmos').CosmosClient;
  SearchClient = require('@azure/search-documents').SearchClient;
} catch (error) {
  console.log('⚠️ Azure SDK packages not installed, using mock responses');
}

const app = express();
const PORT = process.env.PORT || 7071;

// Azure configuration from environment variables
const AZURE_CONFIG = {
  cosmosEndpoint: process.env.COSMOS_ENDPOINT || '',
  cosmosKey: process.env.COSMOS_KEY || '',
  cosmosDatabase: process.env.COSMOS_DATABASE || 'legaldb',
  cosmosContainer: process.env.COSMOS_CONTAINER || 'LegalRules',
  searchEndpoint: process.env.SEARCH_ENDPOINT || '',
  searchKey: process.env.SEARCH_KEY || '',
  searchIndex: process.env.SEARCH_INDEX || 'legalrefs-index',
  documentIntelligenceEndpoint: process.env.DOCUMENT_INTELLIGENCE_ENDPOINT || 'https://eastus.api.cognitive.microsoft.com/',
  documentIntelligenceKey: process.env.DOCUMENT_INTELLIGENCE_KEY || '',
  openaiEndpoint: process.env.OPENAI_ENDPOINT || 'https://eastus.api.cognitive.microsoft.com/',
  openaiKey: process.env.OPENAI_KEY || '',
  openaiApiVersion: '2024-02-15-preview'
};

// Initialize Azure clients
let cosmosClient, searchClient;

if (AZURE_CONFIG.cosmosEndpoint && AZURE_CONFIG.cosmosKey) {
  cosmosClient = new CosmosClient({
    endpoint: AZURE_CONFIG.cosmosEndpoint,
    key: AZURE_CONFIG.cosmosKey
  });
  console.log('✅ Connected to Azure Cosmos DB');
} else {
  console.log('⚠️ Azure Cosmos DB not configured, using mock responses');
}

if (AZURE_CONFIG.searchEndpoint && AZURE_CONFIG.searchKey) {
  searchClient = new SearchClient(
    AZURE_CONFIG.searchEndpoint,
    AZURE_CONFIG.searchIndex,
    { apiKey: AZURE_CONFIG.searchKey }
  );
  console.log('✅ Connected to Azure AI Search');
} else {
  console.log('⚠️ Azure AI Search not configured, using mock responses');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Document Analyzer Class with 3 Core Functions
class DocumentAnalyzer {
  constructor() {
    this.documentTypes = {
      'Agreement of Purchase and Sale (APS)': {
        requiredFields: ['purchasePrice', 'closingDate', 'buyerName', 'sellerName', 'propertyAddress', 'depositAmount'],
        optionalFields: ['irrevocableDate', 'scheduleA', 'financingCondition', 'inspectionCondition'],
        validityRules: {
          maxAge: 365,
          requiredSignatures: ['buyer', 'seller'],
          minDepositPercent: 5
        }
      },
      'Residential Lease Agreement': {
        requiredFields: ['rentAmount', 'leaseStartDate', 'leaseEndDate', 'tenantName', 'landlordName', 'propertyAddress'],
        optionalFields: ['securityDeposit', 'utilities', 'pets', 'maintenance'],
        validityRules: {
          maxAge: 365,
          requiredSignatures: ['tenant', 'landlord'],
          minLeaseTerm: 30
        }
      },
      'Landlord and Tenant Board Form': {
        requiredFields: ['formNumber', 'tenantName', 'landlordName', 'propertyAddress', 'issueDate'],
        optionalFields: ['hearingDate', 'reason', 'amount'],
        validityRules: {
          maxAge: 30,
          requiredSignatures: ['applicant'],
          validFormNumbers: ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N9', 'N10', 'N11', 'N12', 'N13', 'N14', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
        }
      },
      'Mortgage Statement': {
        requiredFields: ['accountNumber', 'statementDate', 'principalBalance', 'interestRate', 'paymentAmount'],
        optionalFields: ['maturityDate', 'propertyAddress', 'lenderName'],
        validityRules: {
          maxAge: 90,
          requiredSignatures: [],
          minBalance: 0
        }
      },
      'Notice of Assessment (CRA)': {
        requiredFields: ['taxYear', 'assessmentDate', 'totalIncome', 'taxOwed', 'refundAmount'],
        optionalFields: ['sin', 'filingDate'],
        validityRules: {
          maxAge: 1095,
          requiredSignatures: [],
          validTaxYears: [2021, 2022, 2023, 2024]
        }
      }
    };
  }

  // Function 1: Check if user fields are filled within the document
  async checkFieldCompleteness(documentText, documentType) {
    try {
      console.log(`🔍 Checking field completeness for ${documentType}...`);
      
      const docConfig = this.documentTypes[documentType] || this.documentTypes['Agreement of Purchase and Sale (APS)'];
      const requiredFields = docConfig.requiredFields;
      const optionalFields = docConfig.optionalFields;
      
      const fieldStatus = {
        required: {},
        optional: {},
        completeness: {
          score: 0,
          status: 'Incomplete',
          missingRequired: [],
          presentRequired: [],
          missingOptional: [],
          presentOptional: []
        }
      };
      
      // Check required fields
      for (const field of requiredFields) {
        const isPresent = this.isFieldPresent(documentText, field);
        fieldStatus.required[field] = {
          present: isPresent,
          value: isPresent ? this.extractFieldValue(documentText, field) : null,
          confidence: isPresent ? this.calculateFieldConfidence(documentText, field) : 0
        };
        
        if (isPresent) {
          fieldStatus.completeness.presentRequired.push(field);
        } else {
          fieldStatus.completeness.missingRequired.push(field);
        }
      }
      
      // Check optional fields
      for (const field of optionalFields) {
        const isPresent = this.isFieldPresent(documentText, field);
        fieldStatus.optional[field] = {
          present: isPresent,
          value: isPresent ? this.extractFieldValue(documentText, field) : null,
          confidence: isPresent ? this.calculateFieldConfidence(documentText, field) : 0
        };
        
        if (isPresent) {
          fieldStatus.completeness.presentOptional.push(field);
        } else {
          fieldStatus.completeness.missingOptional.push(field);
        }
      }
      
      // Calculate completeness score
      const requiredPresent = fieldStatus.completeness.presentRequired.length;
      const totalRequired = requiredFields.length;
      const optionalPresent = fieldStatus.completeness.presentOptional.length;
      const totalOptional = optionalFields.length;
      
      fieldStatus.completeness.score = Math.round(
        (requiredPresent / totalRequired) * 80 + 
        (optionalPresent / totalOptional) * 20
      );
      
      if (fieldStatus.completeness.score >= 90) {
        fieldStatus.completeness.status = 'Complete';
      } else if (fieldStatus.completeness.score >= 70) {
        fieldStatus.completeness.status = 'Mostly Complete';
      } else if (fieldStatus.completeness.score >= 50) {
        fieldStatus.completeness.status = 'Partially Complete';
      } else {
        fieldStatus.completeness.status = 'Incomplete';
      }
      
      console.log(`✅ Field completeness check complete: ${fieldStatus.completeness.status} (${fieldStatus.completeness.score}%)`);
      return fieldStatus;
      
    } catch (error) {
      console.error('❌ Error checking field completeness:', error);
      throw error;
    }
  }

  // Function 2: Identify what kind of document it is
  async identifyDocumentType(documentText, filename) {
    try {
      console.log(`🔍 Identifying document type for ${filename}...`);
      
      // Use Azure OpenAI if available
      if (AZURE_CONFIG.openaiKey) {
        const response = await axios.post(
          `${AZURE_CONFIG.openaiEndpoint}openai/deployments/gpt-4/chat/completions?api-version=${AZURE_CONFIG.openaiApiVersion}`,
          {
            messages: [
              {
                role: "system",
                content: `You are a legal document classification expert. Analyze the document and classify it into EXACTLY one of these categories:
                
                - Agreement of Purchase and Sale (APS)
                - Residential Lease Agreement
                - Landlord and Tenant Board Form
                - Mortgage Statement
                - Notice of Assessment (CRA)
                - Mortgage Discharge Statement
                - Status Certificate
                - Reserve Fund Study
                - Property Insurance
                - Property Appraisal
                - Other Legal Document
                
                Return JSON format:
                {
                  "documentType": "Exact category name",
                  "confidence": 0.95,
                  "jurisdiction": "Ontario",
                  "subType": "Specific form or variant",
                  "keyIndicators": ["indicator1", "indicator2"],
                  "extractedData": {
                    "formNumber": "N4",
                    "parties": ["Landlord", "Tenant"],
                    "amounts": ["$2000"],
                    "dates": ["2024-01-15"],
                    "addresses": ["123 Main St, Toronto, ON"]
                  }
                }`
              },
              {
                role: "user",
                content: `Classify this document:\n\nFilename: ${filename}\n\nText: ${documentText.substring(0, 2000)}`
              }
            ],
            max_tokens: 1000,
            temperature: 0.1
          },
          {
            headers: {
              'api-key': AZURE_CONFIG.openaiKey,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const classification = JSON.parse(response.data.choices[0].message.content);
        console.log(`✅ Document identified as: ${classification.documentType} (${Math.round(classification.confidence * 100)}% confidence)`);
        return classification;
      } else {
        // Fallback to filename-based detection
        return this.detectDocumentTypeFromFilename(filename);
      }
      
    } catch (error) {
      console.error('❌ Error identifying document type:', error);
      return this.detectDocumentTypeFromFilename(filename);
    }
  }

  // Function 3: Check if document is valid or expired
  async checkDocumentValidity(documentText, documentType, extractedData) {
    try {
      console.log(`🔍 Checking validity for ${documentType}...`);
      
      const docConfig = this.documentTypes[documentType] || this.documentTypes['Agreement of Purchase and Sale (APS)'];
      const validityRules = docConfig.validityRules;
      
      const validityCheck = {
        status: 'Valid',
        score: 100,
        issues: [],
        warnings: [],
        expiryInfo: {
          isExpired: false,
          expiryDate: null,
          daysUntilExpiry: null,
          ageInDays: null
        },
        signatureCheck: {
          required: validityRules.requiredSignatures || [],
          present: [],
          missing: [],
          valid: true
        },
        fieldValidation: {
          valid: true,
          errors: []
        }
      };
      
      // Check document age/expiry
      const issueDate = this.extractDate(documentText, 'issueDate') || 
                      this.extractDate(documentText, 'date') || 
                      this.extractDate(documentText, 'created');
      
      if (issueDate) {
        const ageInDays = Math.floor((new Date() - new Date(issueDate)) / (1000 * 60 * 60 * 24));
        validityCheck.expiryInfo.ageInDays = ageInDays;
        validityCheck.expiryInfo.daysUntilExpiry = (validityRules.maxAge || 365) - ageInDays;
        
        if (ageInDays > (validityRules.maxAge || 365)) {
          validityCheck.status = 'Expired';
          validityCheck.expiryInfo.isExpired = true;
          validityCheck.issues.push(`Document is ${ageInDays} days old, exceeds maximum age of ${validityRules.maxAge || 365} days`);
          validityCheck.score -= 30;
        } else if (ageInDays > (validityRules.maxAge || 365) * 0.8) {
          validityCheck.warnings.push(`Document is ${ageInDays} days old, approaching expiry`);
          validityCheck.score -= 10;
        }
      } else {
        validityCheck.warnings.push('No issue date found, cannot determine document age');
        validityCheck.score -= 5;
      }
      
      // Check signatures
      for (const requiredSig of validityRules.requiredSignatures || []) {
        const hasSignature = this.checkSignature(documentText, requiredSig);
        if (hasSignature) {
          validityCheck.signatureCheck.present.push(requiredSig);
        } else {
          validityCheck.signatureCheck.missing.push(requiredSig);
          validityCheck.signatureCheck.valid = false;
          validityCheck.issues.push(`Missing required signature: ${requiredSig}`);
          validityCheck.score -= 20;
        }
      }
      
      // Check specific field validations
      if (documentType === 'Agreement of Purchase and Sale (APS)') {
        const depositAmount = this.extractAmount(documentText, 'deposit');
        const purchasePrice = this.extractAmount(documentText, 'purchasePrice');
        
        if (depositAmount && purchasePrice) {
          const depositPercent = (depositAmount / purchasePrice) * 100;
          if (depositPercent < (validityRules.minDepositPercent || 5)) {
            validityCheck.issues.push(`Deposit amount (${depositPercent.toFixed(1)}%) is below minimum required (${validityRules.minDepositPercent || 5}%)`);
            validityCheck.score -= 15;
          }
        }
      }
      
      // Check form numbers for LTB forms
      if (documentType === 'Landlord and Tenant Board Form') {
        const formNumber = this.extractFormNumber(documentText);
        if (formNumber && validityRules.validFormNumbers) {
          if (!validityRules.validFormNumbers.includes(formNumber)) {
            validityCheck.issues.push(`Invalid form number: ${formNumber}`);
            validityCheck.score -= 25;
          }
        }
      }
      
      // Determine final status
      if (validityCheck.score < 50) {
        validityCheck.status = 'Invalid';
      } else if (validityCheck.score < 80) {
        validityCheck.status = 'Potentially Invalid';
      } else if (validityCheck.issues.length > 0) {
        validityCheck.status = 'Valid with Issues';
      }
      
      console.log(`✅ Validity check complete: ${validityCheck.status} (${validityCheck.score}%)`);
      return validityCheck;
      
    } catch (error) {
      console.error('❌ Error checking document validity:', error);
      throw error;
    }
  }

  // Helper methods
  isFieldPresent(text, fieldName) {
    const patterns = {
      purchasePrice: /\$[\d,]+|purchase\s*price|price\s*of\s*purchase/i,
      closingDate: /closing\s*date|closing\s*on|closes\s*on/i,
      buyerName: /buyer|purchaser|purchasing\s*party/i,
      sellerName: /seller|vendor|selling\s*party/i,
      propertyAddress: /address|property\s*located|located\s*at/i,
      depositAmount: /deposit|down\s*payment|earnest\s*money/i,
      rentAmount: /rent|rental\s*amount|monthly\s*rent/i,
      leaseStartDate: /lease\s*start|commencing|beginning/i,
      leaseEndDate: /lease\s*end|expiring|terminating/i,
      tenantName: /tenant|lessee|renting\s*party/i,
      landlordName: /landlord|lessor|rental\s*property\s*owner/i,
      formNumber: /form\s*[nNtT]\d+|^[nNtT]\d+/,
      issueDate: /issue\s*date|dated|created\s*on/i,
      statementDate: /statement\s*date|as\s*of|period\s*ending/i,
      taxYear: /tax\s*year|year\s*ending|filing\s*year/i
    };
    
    const pattern = patterns[fieldName];
    return pattern ? pattern.test(text) : false;
  }

  extractFieldValue(text, fieldName) {
    const patterns = {
      purchasePrice: /\$([\d,]+)/,
      depositAmount: /deposit[:\s]*\$?([\d,]+)/i,
      rentAmount: /rent[:\s]*\$?([\d,]+)/i,
      formNumber: /form\s*([nNtT]\d+)|^([nNtT]\d+)/i,
      issueDate: /(issue\s*date|dated)[:\s]*([\d\/\-]+)/i,
      closingDate: /(closing\s*date|closes\s*on)[:\s]*([\d\/\-]+)/i
    };
    
    const pattern = patterns[fieldName];
    if (pattern) {
      const match = text.match(pattern);
      return match ? match[1] || match[2] : null;
    }
    return null;
  }

  calculateFieldConfidence(text, fieldName) {
    const isPresent = this.isFieldPresent(text, fieldName);
    if (!isPresent) return 0;
    
    const value = this.extractFieldValue(text, fieldName);
    if (value) return 0.9;
    return 0.7;
  }

  extractDate(text, fieldName) {
    const patterns = {
      issueDate: /(issue\s*date|dated)[:\s]*([\d\/\-]+)/i,
      closingDate: /(closing\s*date|closes\s*on)[:\s]*([\d\/\-]+)/i,
      date: /(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/g
    };
    
    const pattern = patterns[fieldName] || patterns.date;
    const match = text.match(pattern);
    return match ? match[2] || match[1] : null;
  }

  extractAmount(text, fieldName) {
    const patterns = {
      deposit: /deposit[:\s]*\$?([\d,]+)/i,
      purchasePrice: /\$([\d,]+)/,
      rent: /rent[:\s]*\$?([\d,]+)/i
    };
    
    const pattern = patterns[fieldName];
    if (pattern) {
      const match = text.match(pattern);
      return match ? parseFloat(match[1].replace(/,/g, '')) : null;
    }
    return null;
  }

  extractFormNumber(text) {
    const match = text.match(/form\s*([nNtT]\d+)|^([nNtT]\d+)/i);
    return match ? (match[1] || match[2]).toUpperCase() : null;
  }

  checkSignature(text, signatureType) {
    const patterns = {
      buyer: /buyer\s*signature|signed\s*by\s*buyer/i,
      seller: /seller\s*signature|signed\s*by\s*seller/i,
      tenant: /tenant\s*signature|signed\s*by\s*tenant/i,
      landlord: /landlord\s*signature|signed\s*by\s*landlord/i,
      applicant: /applicant\s*signature|signed\s*by\s*applicant/i
    };
    
    const pattern = patterns[signatureType.toLowerCase()];
    return pattern ? pattern.test(text) : false;
  }

  detectDocumentTypeFromFilename(filename) {
    const filename_lower = filename.toLowerCase();
    
    if (filename_lower.includes('fee waiver') || filename_lower.includes('waiver')) {
      return { documentType: "Fee Waiver Request", confidence: 0.95, jurisdiction: "Ontario" };
    } else if (filename_lower.includes('lease') || filename_lower.includes('rental') || filename_lower.includes('tenancy')) {
      return { documentType: "Residential Lease Agreement", confidence: 0.85, jurisdiction: "Ontario" };
    } else if (filename_lower.includes('purchase') || filename_lower.includes('sale') || filename_lower.includes('aps') || filename_lower.includes('orea')) {
      return { documentType: "Agreement of Purchase and Sale (APS)", confidence: 0.90, jurisdiction: "Ontario" };
    } else if (filename_lower.includes('mortgage') || filename_lower.includes('charge')) {
      return { documentType: "Mortgage Document", confidence: 0.88, jurisdiction: "Ontario" };
    } else if (filename_lower.includes('noa') || filename_lower.includes('notice') || filename_lower.includes('assessment')) {
      return { documentType: "Notice of Assessment (CRA)", confidence: 0.92, jurisdiction: "Ontario" };
    } else {
      return { documentType: "Legal Document", confidence: 0.60, jurisdiction: "Ontario" };
    }
  }
}

// Initialize analyzer
const analyzer = new DocumentAnalyzer();

// Document Intelligence analysis
async function analyzeDocumentWithAI(fileBuffer, filename) {
  try {
    if (!AZURE_CONFIG.documentIntelligenceKey) {
      // Return mock data if no key
      return {
        analyzeResult: {
          pages: [{
            words: [
              { content: "Agreement" },
              { content: "of" },
              { content: "Purchase" },
              { content: "and" },
              { content: "Sale" },
              { content: "Property" },
              { content: "Address:" },
              { content: "123" },
              { content: "Main" },
              { content: "Street" },
              { content: "Toronto," },
              { content: "ON" },
              { content: "Purchase" },
              { content: "Price:" },
              { content: "$750,000" },
              { content: "Closing" },
              { content: "Date:" },
              { content: "2024-06-15" }
            ]
          }]
        }
      };
    }

    const response = await axios.post(
      `${AZURE_CONFIG.documentIntelligenceEndpoint}formrecognizer/documentModels/prebuilt-layout:analyze?api-version=2023-07-31`,
      fileBuffer,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_CONFIG.documentIntelligenceKey,
          'Content-Type': 'application/octet-stream'
        }
      }
    );
    
    const operationId = response.headers['operation-location'].split('/').pop();
    
    // Poll for results
    let result;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await axios.get(
        `${AZURE_CONFIG.documentIntelligenceEndpoint}formrecognizer/documentModels/prebuilt-layout/analyzeResults/${operationId}?api-version=2023-07-31`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': AZURE_CONFIG.documentIntelligenceKey
          }
        }
      );
      
      if (statusResponse.data.status === 'succeeded') {
        result = statusResponse.data;
        break;
      } else if (statusResponse.data.status === 'failed') {
        throw new Error('Document analysis failed');
      }
      
      attempts++;
    }
    
    if (!result) {
      throw new Error('Document analysis timed out');
    }
    
    return result;
  } catch (error) {
    console.error('Document analysis error:', error.message);
    throw error;
  }
}

// Extract text from analysis result
function extractTextFromAnalysis(analysisResult) {
  let text = '';
  
  if (analysisResult.analyzeResult && analysisResult.analyzeResult.pages) {
    analysisResult.analyzeResult.pages.forEach(page => {
      if (page.words) {
        page.words.forEach(word => {
          text += word.content + ' ';
        });
      }
    });
  }
  
  return text.trim();
}

// Main document analysis endpoint with 3 core functions
app.post('/api/ScanDoc', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log(`📄 Processing file: ${file.originalname} (${file.size} bytes)`);
    
    // Step 1: Analyze document with Document Intelligence
    const analysisResult = await analyzeDocumentWithAI(file.buffer, file.originalname);
    const documentText = extractTextFromAnalysis(analysisResult);
    
    // Step 2: Identify document type (Core Function 2)
    const classification = await analyzer.identifyDocumentType(documentText, file.originalname);
    
    // Step 3: Check field completeness (Core Function 1)
    const fieldCompleteness = await analyzer.checkFieldCompleteness(documentText, classification.documentType);
    
    // Step 4: Check document validity (Core Function 3)
    const validityCheck = await analyzer.checkDocumentValidity(documentText, classification.documentType, classification.extractedData);
    
    // Combine all results
    const result = {
      // Core 3 functions results
      documentType: classification.documentType,
      classificationConfidence: classification.confidence,
      fieldCompleteness: fieldCompleteness,
      validityCheck: validityCheck,
      
      // Additional data
      jurisdiction: classification.jurisdiction || "Ontario",
      issueDate: validityCheck.expiryInfo.ageInDays ? new Date(Date.now() - (validityCheck.expiryInfo.ageInDays * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] : null,
      expiryDate: validityCheck.expiryInfo.daysUntilExpiry ? new Date(Date.now() + (validityCheck.expiryInfo.daysUntilExpiry * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] : null,
      validityStatus: validityCheck.status,
      reasons: [
        `Document type: ${classification.documentType}`,
        `Completeness: ${fieldCompleteness.completeness.status} (${fieldCompleteness.completeness.score}%)`,
        `Validity: ${validityCheck.status} (${validityCheck.score}%)`,
        validityCheck.issues.length > 0 ? `Issues: ${validityCheck.issues.join(', ')}` : 'No issues found'
      ],
      suggestedActions: [
        fieldCompleteness.completeness.missingRequired.length > 0 ? `Complete missing fields: ${fieldCompleteness.completeness.missingRequired.join(', ')}` : 'All required fields present',
        validityCheck.signatureCheck.missing.length > 0 ? `Add missing signatures: ${validityCheck.signatureCheck.missing.join(', ')}` : 'All required signatures present',
        validityCheck.issues.length > 0 ? 'Address validity issues' : 'Document appears valid'
      ],
      correlationId: `doc_${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}`,
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ Document analysis complete: ${classification.documentType} - ${fieldCompleteness.completeness.status} - ${validityCheck.status}`);
    res.json(result);
    
  } catch (error) {
    console.error('❌ ScanDoc error:', error);
    res.status(500).json({ 
      error: 'Document analysis failed', 
      details: error.message 
    });
  }
});

// Q&A endpoint
app.post('/api/qa', async (req, res) => {
  const { question, documentType, extractedData } = req.body;
  
  console.log(`❓ Q&A: "${question}" for ${documentType}`);
  
  try {
    let answer = `### Document Analysis Summary\n\n`;
    answer += `**Document Type:** ${documentType}\n\n`;
    
    if (extractedData && extractedData.fieldCompleteness) {
      answer += `**Completeness:** ${extractedData.fieldCompleteness.completeness.status} (${extractedData.fieldCompleteness.completeness.score}%)\n`;
      if (extractedData.fieldCompleteness.completeness.missingRequired.length > 0) {
        answer += `**Missing Required Fields:** ${extractedData.fieldCompleteness.completeness.missingRequired.join(', ')}\n`;
      }
    }
    
    if (extractedData && extractedData.validityCheck) {
      answer += `**Validity Status:** ${extractedData.validityCheck.status} (${extractedData.validityCheck.score}%)\n`;
      if (extractedData.validityCheck.issues.length > 0) {
        answer += `**Issues:** ${extractedData.validityCheck.issues.join(', ')}\n`;
      }
    }
    
    answer += `\n### Answer\n\n`;
    
    if (question.toLowerCase().includes('what') && question.toLowerCase().includes('document')) {
      answer += `This is a **${documentType}** document. `;
      if (extractedData && extractedData.fieldCompleteness) {
        answer += `The document is ${extractedData.fieldCompleteness.completeness.status.toLowerCase()} with a completeness score of ${extractedData.fieldCompleteness.completeness.score}%. `;
      }
      if (extractedData && extractedData.validityCheck) {
        answer += `The validity status is ${extractedData.validityCheck.status.toLowerCase()}.`;
      }
    } else if (question.toLowerCase().includes('missing') || question.toLowerCase().includes('incomplete')) {
      if (extractedData && extractedData.fieldCompleteness && extractedData.fieldCompleteness.completeness.missingRequired.length > 0) {
        answer += `The following required fields are missing: ${extractedData.fieldCompleteness.completeness.missingRequired.join(', ')}. `;
      } else {
        answer += `No missing required fields detected. `;
      }
      if (extractedData && extractedData.validityCheck && extractedData.validityCheck.issues.length > 0) {
        answer += `However, there are validity issues: ${extractedData.validityCheck.issues.join(', ')}.`;
      }
    } else if (question.toLowerCase().includes('valid') || question.toLowerCase().includes('ready')) {
      if (extractedData && extractedData.validityCheck) {
        answer += `The document validity status is **${extractedData.validityCheck.status}** with a score of ${extractedData.validityCheck.score}%. `;
        if (extractedData.validityCheck.issues.length === 0) {
          answer += `The document appears to be ready for use.`;
        } else {
          answer += `Please address the following issues: ${extractedData.validityCheck.issues.join(', ')}.`;
        }
      }
    } else {
      answer += `Based on the document analysis, I can provide information about the document type, completeness, and validity. Please ask specific questions about what you need to know.`;
    }
    
    answer += `\n\n### Next Steps\n\n`;
    if (extractedData && extractedData.fieldCompleteness && extractedData.fieldCompleteness.completeness.missingRequired.length > 0) {
      answer += `- Complete the missing required fields: ${extractedData.fieldCompleteness.completeness.missingRequired.join(', ')}\n`;
    }
    if (extractedData && extractedData.validityCheck && extractedData.validityCheck.issues.length > 0) {
      answer += `- Address the validity issues: ${extractedData.validityCheck.issues.join(', ')}\n`;
    }
    answer += `- Review the document one final time\n`;
    answer += `- Ensure all parties have signed if required\n`;
    answer += `- Make copies for your records\n`;
    
    res.json({
      answerMarkdown: answer,
      timestamp: new Date().toISOString(),
      documentType: documentType
    });
    
  } catch (error) {
    console.error('Q&A error:', error);
    res.status(500).json({ error: 'Failed to process question' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Document Analyzer with 3 Core Functions',
    functions: {
      fieldCompleteness: 'Active',
      documentTypeIdentification: 'Active',
      validityExpiryCheck: 'Active'
    }
  });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Document Analyzer with 3 Core Functions running on port ${PORT}`);
  console.log(`📋 Core Functions:`);
  console.log(`  1. Field Completeness Check`);
  console.log(`  2. Document Type Identification`);
  console.log(`  3. Validity/Expiry Check`);
  console.log(`🌐 Frontend: https://stphilerdocscan.z9.web.core.windows.net/`);
  console.log(`🎯 Ready for production!`);
});

module.exports = app;
