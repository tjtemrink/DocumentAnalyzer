const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 7071;

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

// Mock legal rules data
const mockRules = {
  'ON-Residential Lease Agreement': {
    id: 'lease-ontario-v1',
    jurisdiction: 'ON',
    documentType: 'Residential Lease Agreement',
    version: '1.0',
    effectiveDate: '2024-01-01',
    requiredFields: [
      { name: 'rent_amount', type: 'number' },
      { name: 'term_start', type: 'date' },
      { name: 'term_end', type: 'date' },
      { name: 'property_address', type: 'string' }
    ],
    signatureRequirements: [
      { role: 'Landlord', type: 'wet_or_electronic' },
      { role: 'Tenant', type: 'wet_or_electronic' }
    ],
    redFlags: ['Unsigned document', 'Missing deposit receipt']
  },
  'ON-Agreement of Purchase and Sale (APS)': {
    id: 'aps-ontario-v1',
    jurisdiction: 'ON',
    documentType: 'Agreement of Purchase and Sale (APS)',
    version: '1.0',
    effectiveDate: '2024-01-01',
    requiredFields: [
      { name: 'purchase_price', type: 'number' },
      { name: 'closing_date', type: 'date' },
      { name: 'property_address', type: 'string' },
      { name: 'buyer_signature', type: 'string' },
      { name: 'seller_signature', type: 'string' }
    ],
    signatureRequirements: [
      { role: 'Buyer', type: 'wet_or_electronic' },
      { role: 'Seller', type: 'wet_or_electronic' }
    ],
    redFlags: ['Missing mandatory Schedule A', 'Alterations to OREA Form 100 without initials']
  }
};

// Mock legal briefs data
const mockBriefs = [
  {
    title: 'Ontario Residential Tenancies Act, 2006',
    excerpt: 'The Residential Tenancies Act governs the rights and responsibilities of landlords and tenants in Ontario. It establishes rules for rent increases, evictions, and maintenance obligations.',
    citationUrl: 'https://www.ontario.ca/laws/statute/06r17'
  },
  {
    title: 'Real Estate and Business Brokers Act, 2002',
    excerpt: 'This Act regulates real estate brokerage activities in Ontario, including requirements for agreements of purchase and sale, deposit handling, and professional conduct.',
    citationUrl: 'https://www.ontario.ca/laws/statute/02r30'
  },
  {
    title: 'OREA Standard Form 100',
    excerpt: 'The standard form for agreements of purchase and sale used by Ontario real estate professionals. Includes required clauses and conditions.',
    citationUrl: 'https://www.orea.com/'
  }
];

// Document type detection based on filename
function detectDocumentType(filename) {
  const filename_lower = filename.toLowerCase();
  
  if (filename_lower.includes('fee waiver') || filename_lower.includes('waiver')) {
    return { type: "Fee Waiver Request", confidence: 0.95 };
  } else if (filename_lower.includes('lease') || filename_lower.includes('rental') || filename_lower.includes('tenancy')) {
    return { type: "Residential Lease Agreement", confidence: 0.85 };
  } else if (filename_lower.includes('purchase') || filename_lower.includes('sale') || filename_lower.includes('aps') || filename_lower.includes('orea')) {
    return { type: "Agreement of Purchase and Sale (APS)", confidence: 0.90 };
  } else if (filename_lower.includes('mortgage') || filename_lower.includes('charge')) {
    return { type: "Mortgage Document", confidence: 0.88 };
  } else if (filename_lower.includes('noa') || filename_lower.includes('notice') || filename_lower.includes('assessment')) {
    return { type: "CRA Notice of Assessment", confidence: 0.92 };
  } else if (filename_lower.includes('utility') || filename_lower.includes('bill') || filename_lower.includes('hydro') || filename_lower.includes('electric')) {
    return { type: "Utility Bill", confidence: 0.80 };
  } else if (filename_lower.includes('bank') || filename_lower.includes('statement') || filename_lower.includes('account')) {
    return { type: "Bank Statement", confidence: 0.85 };
  } else if (filename_lower.includes('pay') || filename_lower.includes('stub') || filename_lower.includes('payroll')) {
    return { type: "Pay Stub", confidence: 0.90 };
  } else if (filename_lower.includes('insurance') || filename_lower.includes('policy')) {
    return { type: "Insurance Policy", confidence: 0.88 };
  } else if (filename_lower.includes('appraisal') || filename_lower.includes('valuation')) {
    return { type: "Property Appraisal Report", confidence: 0.90 };
  } else if (filename_lower.includes('status') || filename_lower.includes('certificate') || filename_lower.includes('condo')) {
    return { type: "Status Certificate (Condo)", confidence: 0.85 };
  } else if (filename_lower.includes('discharge') || filename_lower.includes('payout') || filename_lower.includes('mortgage payout')) {
    return { type: "Discharge Statement (Mortgage Payout Statement)", confidence: 0.90 };
  } else if (filename_lower.includes('refinance') || filename_lower.includes('refinancing')) {
    return { type: "Refinance Agreement", confidence: 0.88 };
  } else if (filename_lower.includes('reserve') || filename_lower.includes('fund study')) {
    return { type: "Reserve Fund Study (Condo)", confidence: 0.85 };
  } else if (filename_lower.includes('condo insurance') || filename_lower.includes('condominium insurance')) {
    return { type: "Condominium Insurance Certificate", confidence: 0.88 };
  } else {
    return { type: "Legal Document", confidence: 0.60 };
  }
}

// ScanDoc endpoint
app.post('/api/ScanDoc', upload.fields([{ name: 'file' }, { name: 'context' }]), (req, res) => {
  console.log('📄 Document processing request received');
  
  // Simulate processing delay
  setTimeout(() => {
    try {
      // Get context from request body if available
      let userContext = {
        purpose: "Property ownership",
        jurisdiction: "Ontario", 
        partyType: "Buyer",
        issuerHint: "OREA",
        recencyRequirementDays: null
      };
      
      if (req.body && req.body.context) {
        userContext = JSON.parse(req.body.context);
      }
      
      // Get filename from uploaded file
      const filename = req.files.file[0].originalname;
      
      // Detect document type
      const { type: documentType, confidence } = detectDocumentType(filename);
      
      const jurisdiction = userContext.jurisdiction || "Ontario";
      
      // Generate result
      const result = {
        documentType: documentType,
        classificationConfidence: confidence,
        issueDate: "2025-01-15",
        expiryDate: "2025-12-31",
        validityStatus: "Valid",
        reasons: [
          `Document type detected: ${documentType}`,
          `Confidence level: ${Math.round(confidence * 100)}%`,
          "All required fields appear to be present"
        ],
        suggestedActions: [
          "Review document for completeness",
          "Verify all signatures are present",
          "Check dates for accuracy"
        ],
        userContext: userContext,
        correlationId: 'corr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      };

      res.json(result);
    } catch (error) {
      console.error('Error processing document:', error);
      res.status(500).json({ error: 'Failed to process document' });
    }
  }, 1500);
});

// Rules endpoint
app.get('/api/rules', (req, res) => {
  const { jurisdiction, documentType } = req.query;
  
  console.log(`📋 Rules request: ${jurisdiction}-${documentType}`);
  
  const ruleKey = `${jurisdiction}-${documentType}`;
  const rule = mockRules[ruleKey];
  
  if (rule) {
    res.json({ rule, found: true, source: 'mock' });
  } else {
    res.json({ rule: null, found: false, source: 'none' });
  }
});

// Search brief endpoint
app.post('/api/search/brief', (req, res) => {
  const { docType, jurisdiction, query } = req.body;
  
  console.log(`🔍 Search brief request: ${docType} in ${jurisdiction} - ${query || 'general'}`);
  
  // Return mock briefs
  res.json({ briefs: mockBriefs, source: 'mock' });
});

// Q&A endpoint
app.post('/api/qa', (req, res) => {
  const { jurisdiction, documentType, extracted, validation, question } = req.body;
  
  console.log(`❓ Q&A: "${question}" for ${documentType} in ${jurisdiction}`);
  
  // Generate simple answer
  const answer = generateQAAnswer(question, documentType, validation, null, mockBriefs);
  
  res.json({
    answerMarkdown: answer,
    briefs: mockBriefs
  });
});

function generateQAAnswer(question, documentType, validation, rule, briefs) {
  const lowerQ = question.toLowerCase();
  
  let answer = `### Summary\n`;
  answer += `- This is a **${documentType}** document\n`;
  answer += `- Status: **${validation?.validityStatus || 'Valid'}**\n`;
  answer += `- Jurisdiction: **${validation?.jurisdiction || 'Ontario'}**\n`;
  
  if (lowerQ.includes('what') && lowerQ.includes('document')) {
    answer += `- Confidence: **${Math.round((validation?.classificationConfidence || 0.8) * 100)}%**\n`;
  }
  
  if (lowerQ.includes('missing') || lowerQ.includes('incomplete')) {
    answer += `- **Issues found:**\n`;
    answer += `  - No major issues detected\n`;
  }
  
  if (lowerQ.includes('valid') || lowerQ.includes('ready') || lowerQ.includes('send')) {
    answer += `- **Document is ready to send**\n`;
    answer += `- All required information appears complete\n`;
  }
  
  // Next steps
  answer += `\n### Next Steps\n`;
  answer += `- Review document one final time\n`;
  answer += `- Ensure all parties have signed\n`;
  answer += `- Make copies for your records\n`;
  answer += `- Submit as required\n`;
  
  // References
  answer += `\n### References\n`;
  briefs.forEach(brief => {
    answer += `- [${brief.title}](${brief.citationUrl})\n`;
  });
  
  return answer;
}

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'document-qa.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple Server running on http://localhost:${PORT}`);
  console.log(`📄 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API Endpoints:`);
  console.log(`   POST /api/ScanDoc - Document processing`);
  console.log(`   GET  /api/rules - Legal rules`);
  console.log(`   POST /api/search/brief - Legal briefs`);
  console.log(`   POST /api/qa - Q&A`);
  console.log(`🎯 Ready for testing!`);
});

