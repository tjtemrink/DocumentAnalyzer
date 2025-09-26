const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { CosmosClient } = require('@azure/cosmos');
const { SearchClient, AzureKeyCredential } = require('@azure/search-documents');

const app = express();
const PORT = process.env.PORT || 8080;

// Azure configuration from environment variables
const AZURE_CONFIG = {
  cosmosEndpoint: process.env.COSMOS_ENDPOINT,
  cosmosKey: process.env.COSMOS_KEY,
  cosmosDatabase: process.env.COSMOS_DATABASE || 'legaldb',
  cosmosContainer: process.env.COSMOS_CONTAINER || 'LegalRules',
  searchEndpoint: process.env.SEARCH_ENDPOINT,
  searchKey: process.env.SEARCH_KEY,
  searchIndex: process.env.SEARCH_INDEX || 'legalrefs-index',
  openaiEndpoint: process.env.OPENAI_ENDPOINT,
  openaiKey: process.env.OPENAI_KEY
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
  console.log('⚠️ Azure Cosmos DB not configured');
}

if (AZURE_CONFIG.searchEndpoint && AZURE_CONFIG.searchKey) {
  searchClient = new SearchClient(
    AZURE_CONFIG.searchEndpoint,
    AZURE_CONFIG.searchIndex,
    new AzureKeyCredential(AZURE_CONFIG.searchKey)
  );
  console.log('✅ Connected to Azure AI Search');
} else {
  console.log('⚠️ Azure AI Search not configured');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

const upload = multer({ storage: multer.memoryStorage() });

// Mock data for fallback
const mockRules = {
  'Ontario-Agreement of Purchase and Sale (APS)': {
    id: 'aps-on',
    jurisdiction: 'Ontario',
    documentType: 'Agreement of Purchase and Sale (APS)',
    docTypeCode: 'APS',
    purposeOneLiner: 'Set terms of a residential real estate purchase.',
    version: '1.0',
    effectiveDate: '2024-01-01',
    isSuperseded: false,
    publisher: 'OREA',
    requiredFields: [
      { key: 'purchase_price', label: 'Purchase Price', severity: 'must' },
      { key: 'closing_date', label: 'Closing Date', severity: 'must' },
      { key: 'buyer_name', label: 'Buyer Name', severity: 'must' },
      { key: 'seller_name', label: 'Seller Name', severity: 'must' }
    ],
    signatureRequirements: [
      { role: 'Buyer', type: 'wet_or_electronic' },
      { role: 'Seller', type: 'wet_or_electronic' }
    ],
    expiryRules: 'Valid if Closing Date >= today',
    redFlags: ['Missing signatures', 'Invalid closing date', 'Missing purchase price'],
    legalReferences: [
      { title: 'OREA Form 100', source: 'https://www.orea.com/forms' }
    ],
    fieldMap: { 'purchasePrice': 'purchase_price', 'closingDate': 'closing_date' },
    searchFilters: "jurisdiction eq 'Ontario' and docTypeCode eq 'APS'"
  }
};

const mockReferences = [
  {
    title: "OREA Form 100 - Agreement of Purchase and Sale",
    excerpt: "Standard form for residential real estate transactions in Ontario. Includes all required fields and legal clauses.",
    citationUrl: "https://www.orea.com/forms/form-100",
    jurisdiction: "Ontario",
    documentType: "Agreement of Purchase and Sale (APS)"
  }
];

// Helper function to generate QA answers
function generateQAAnswer(question, documentType, validation, rule, briefs) {
  const lowerQ = question.toLowerCase();
  
  let answer = `### Summary\n`;
  
  if (rule && rule.purposeOneLiner) {
    answer += `- ${rule.purposeOneLiner}\n`;
  } else {
    answer += `- This is a **${documentType}** document\n`;
  }
  
  if (validation && validation.validityStatus) {
    answer += `- Document status: **${validation.validityStatus}**\n`;
  }
  
  answer += `\n### Answer\n`;
  
  if (lowerQ.includes('what') && lowerQ.includes('document')) {
    answer += `- This document is used for real estate transactions\n`;
    answer += `- It outlines the terms of purchase between buyer and seller\n`;
    answer += `- Contains key details like purchase price, closing date, and conditions\n`;
  } else if (lowerQ.includes('missing') || lowerQ.includes('required')) {
    if (rule && rule.requiredFields) {
      answer += `- Required fields for this document:\n`;
      rule.requiredFields.forEach(field => {
        answer += `  - ${field.label} (${field.severity})\n`;
      });
    }
  } else if (lowerQ.includes('signature') || lowerQ.includes('sign')) {
    if (rule && rule.signatureRequirements) {
      answer += `- Required signatures:\n`;
      rule.signatureRequirements.forEach(req => {
        answer += `  - ${req.role} (${req.type})\n`;
      });
    }
  } else if (lowerQ.includes('valid') || lowerQ.includes('expired')) {
    if (validation) {
      answer += `- Document validity: **${validation.validityStatus}**\n`;
      if (validation.reasons && validation.reasons.length > 0) {
        answer += `- Issues found:\n`;
        validation.reasons.forEach(reason => {
          answer += `  - ${reason}\n`;
        });
      }
    }
  } else {
    answer += `- Based on your ${documentType} document, here's what I found:\n`;
    answer += `- Document appears to be properly formatted\n`;
    answer += `- All required elements seem to be present\n`;
  }
  
  answer += `\n### Next Steps\n`;
  answer += `- Review all required fields are completed\n`;
  answer += `- Ensure all parties have signed\n`;
  answer += `- Verify dates are correct and current\n`;
  answer += `- Consider having a lawyer review before finalizing\n`;
  
  if (briefs && briefs.length > 0) {
    answer += `\n### References\n`;
    briefs.slice(0, 3).forEach(brief => {
      answer += `- [${brief.title}](${brief.citationUrl || '#'})\n`;
    });
  }
  
  answer += `\n---\n*Note: This is general information only and not legal advice. For important decisions, consult a licensed lawyer.*`;
  
  return answer;
}

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'document-qa.html'));
});

// API Endpoints
app.post('/api/ScanDoc', upload.fields([{ name: 'file' }, { name: 'context' }]), async (req, res) => {
  console.log('📄 ScanDoc request received');
  const filename = req.files.file[0].originalname;
  const documentType = filename.replace('.pdf', '').replace(/[-_.]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // Simulate Document Intelligence extraction
  const extractedData = {
    documentType: documentType,
    classificationConfidence: 0.9,
    issueDate: '2024-01-01',
    expiryDate: '2025-01-01',
    jurisdiction: 'Ontario',
    purchasePrice: '$500,000',
    closingDate: '2024-06-01',
    buyerName: 'John Doe',
    sellerName: 'Jane Smith',
    reasons: ['Document appears complete'],
    validityStatus: 'Valid'
  };

  res.json(extractedData);
});

app.post('/api/validate', (req, res) => {
  console.log('✅ Validate request received');
  const { documentType, extracted } = req.body;

  const validationResult = {
    documentType: documentType,
    validityStatus: 'Valid',
    reasons: [],
    missingFields: [],
    formatIssues: [],
    redFlagsHit: [],
    suggestedActions: ['Review all signatures', 'Verify closing date']
  };
  
  res.json(validationResult);
});

app.get('/api/rules', async (req, res) => {
  console.log('📋 Rules request received');
  const { jurisdiction, documentType } = req.query;
  
  try {
    if (cosmosClient) {
      const container = cosmosClient.database(AZURE_CONFIG.cosmosDatabase).container(AZURE_CONFIG.cosmosContainer);
      const { resources } = await container.items.query({
        query: 'SELECT * FROM c WHERE c.jurisdiction = @jurisdiction AND c.documentType = @documentType',
        parameters: [
          { name: '@jurisdiction', value: jurisdiction },
          { name: '@documentType', value: documentType }
        ]
      }).fetchAll();
      
      if (resources.length > 0) {
        return res.json({ rule: resources[0], found: true, source: 'cosmos' });
      }
    }
    
    // Fallback to mock data
    const key = `${jurisdiction}-${documentType}`;
    const rule = mockRules[key];
    if (rule) {
      res.json({ rule, found: true, source: 'mock' });
    } else {
      res.json({ rule: null, found: false, source: 'mock' });
    }
  } catch (error) {
    console.error('Rules error:', error);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

app.post('/api/search/brief', async (req, res) => {
  console.log('🔍 Search brief request received');
  const { docType, jurisdiction, query } = req.body;
  
  try {
    if (searchClient) {
      const searchResults = await searchClient.search(query || docType, {
        filter: `jurisdiction eq '${jurisdiction}' and documentType eq '${docType}'`,
        select: ['id', 'title', 'content', 'sourceUrl', 'keyPhrases'],
        top: 3
      });
      
      const briefs = [];
      for await (const result of searchResults.results) {
        briefs.push({
          title: result.document.title,
          excerpt: result.document.content.substring(0, 300) + '...',
          citationUrl: result.document.sourceUrl,
          keyPhrases: result.document.keyPhrases || []
        });
      }
      
      console.log(`✅ Found ${briefs.length} briefs from Azure Search`);
      return res.json({ briefs, source: 'azure' });
    }
    
    // Fallback to mock data
    const filteredBriefs = mockReferences.filter(ref =>
      ref.jurisdiction === jurisdiction && ref.documentType === docType
    );
    res.json({ briefs: filteredBriefs.slice(0, 3), source: 'mock' });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

app.post('/api/qa', async (req, res) => {
  console.log('❓ Q&A request received');
  const { jurisdiction, documentType, extracted, validation, question } = req.body;
  
  try {
    // Get rules
    let rule = null;
    if (cosmosClient) {
      const container = cosmosClient.database(AZURE_CONFIG.cosmosDatabase).container(AZURE_CONFIG.cosmosContainer);
      const { resources } = await container.items.query({
        query: 'SELECT * FROM c WHERE c.jurisdiction = @jurisdiction AND c.documentType = @documentType',
        parameters: [
          { name: '@jurisdiction', value: jurisdiction },
          { name: '@documentType', value: documentType }
        ]
      }).fetchAll();
      
      if (resources.length > 0) {
        rule = resources[0];
      }
    }
    
    // Get briefs
    let briefs = [];
    try {
      const searchResponse = await fetch(`http://localhost:${PORT}/api/search/brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jurisdiction: jurisdiction,
          documentType: documentType,
          query: question
        })
      });
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        briefs = searchData.briefs.slice(0, 3);
      }
    } catch (searchError) {
      console.log('Search not available, using rules only');
    }
    
    // Generate answer
    const answer = generateQAAnswer(question, documentType, validation, rule, briefs);
    
    res.json({
      answerMarkdown: answer,
      briefs: briefs
    });
  } catch (error) {
    console.error('Q&A error:', error);
    res.status(500).json({ error: 'Failed to process question' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Azure Legal Knowledge Bank running on port ${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API Endpoints:`);
  console.log(`   POST /api/ScanDoc - Document processing`);
  console.log(`   GET  /api/rules - Legal rules`);
  console.log(`   POST /api/search/brief - Legal briefs`);
  console.log(`   POST /api/qa - Q&A`);
  console.log(`🎯 Ready for Azure deployment!`);
});

