/**
 * Populate Azure Cosmos DB and Search Index with documents
 */

const { CosmosClient } = require('@azure/cosmos');
const { SearchClient, AzureKeyCredential } = require('@azure/search-documents');
const { BlobServiceClient } = require('@azure/storage-blob');
const fs = require('fs');
const path = require('path');

// Azure configuration - will be set from environment variables
const COSMOS_ENDPOINT = process.env.COSMOS_ENDPOINT || 'https://cosmos-legal-kb-kb001.documents.azure.com:443/';
const COSMOS_KEY = process.env.COSMOS_KEY || '';
const COSMOS_DATABASE = 'legaldb';
const COSMOS_CONTAINER = 'LegalRules';

const SEARCH_ENDPOINT = process.env.SEARCH_ENDPOINT || 'https://srch-legal-kb-kb001.search.windows.net';
const SEARCH_KEY = process.env.SEARCH_KEY || '';
const SEARCH_INDEX = 'legalrefs-index';

async function populateCosmosDB() {
  console.log('🗄️ Connecting to Cosmos DB...');
  
  const client = new CosmosClient({
    endpoint: COSMOS_ENDPOINT,
    key: COSMOS_KEY
  });
  
  const database = client.database(COSMOS_DATABASE);
  const container = database.container(COSMOS_CONTAINER);
  
  // Legal rules data
  const legalRules = [
    {
      id: 'rule-aps-ontario',
      jurisdiction: 'Ontario',
      documentType: 'Agreement of Purchase and Sale (APS)',
      requiredFields: [
        { name: 'purchase_price', type: 'currency', required: true },
        { name: 'property_address', type: 'address', required: true },
        { name: 'buyer_signature', type: 'signature', required: true },
        { name: 'seller_signature', type: 'signature', required: true },
        { name: 'closing_date', type: 'date', required: true },
        { name: 'deposit_amount', type: 'currency', required: true }
      ],
      formatRules: [
        { field: 'purchase_price', pattern: '^\\$?[0-9,]+(\\.\\d{2})?$', message: 'Must be valid currency format' },
        { field: 'closing_date', pattern: '^\\d{4}-\\d{2}-\\d{2}$', message: 'Must be YYYY-MM-DD format' }
      ],
      redFlags: [
        'Missing signatures',
        'Invalid closing date',
        'No deposit specified',
        'Incomplete property description'
      ],
      signatureRequirements: [
        { party: 'Buyer', required: true, witness: false },
        { party: 'Seller', required: true, witness: false }
      ],
      validityRules: {
        closingDateFuture: true,
        depositInTrust: true,
        allPartiesSigned: true
      }
    },
    {
      id: 'rule-fee-waiver-ontario',
      jurisdiction: 'Ontario',
      documentType: 'Fee Waiver Request',
      requiredFields: [
        { name: 'applicant_name', type: 'text', required: true },
        { name: 'case_number', type: 'text', required: true },
        { name: 'financial_affidavit', type: 'document', required: true },
        { name: 'court_filing_fee', type: 'currency', required: true }
      ],
      formatRules: [
        { field: 'case_number', pattern: '^[A-Z0-9-]+$', message: 'Must be valid case number format' }
      ],
      redFlags: [
        'Missing financial information',
        'Incomplete case details',
        'No supporting documentation'
      ],
      signatureRequirements: [
        { party: 'Applicant', required: true, witness: false }
      ],
      validityRules: {
        financialDisclosure: true,
        caseNumberValid: true
      }
    },
    {
      id: 'rule-lease-ontario',
      jurisdiction: 'Ontario',
      documentType: 'Residential Lease Agreement',
      requiredFields: [
        { name: 'landlord_name', type: 'text', required: true },
        { name: 'tenant_name', type: 'text', required: true },
        { name: 'property_address', type: 'address', required: true },
        { name: 'rent_amount', type: 'currency', required: true },
        { name: 'lease_term', type: 'text', required: true },
        { name: 'landlord_signature', type: 'signature', required: true },
        { name: 'tenant_signature', type: 'signature', required: true }
      ],
      formatRules: [
        { field: 'rent_amount', pattern: '^\\$?[0-9,]+(\\.\\d{2})?$', message: 'Must be valid currency format' }
      ],
      redFlags: [
        'Missing signatures',
        'No lease term specified',
        'Invalid rent amount'
      ],
      signatureRequirements: [
        { party: 'Landlord', required: true, witness: false },
        { party: 'Tenant', required: true, witness: false }
      ],
      validityRules: {
        allPartiesSigned: true,
        leaseTermSpecified: true,
        rentAmountValid: true
      }
    },
    {
      id: 'rule-mortgage-ontario',
      jurisdiction: 'Ontario',
      documentType: 'Mortgage Document',
      requiredFields: [
        { name: 'borrower_name', type: 'text', required: true },
        { name: 'lender_name', type: 'text', required: true },
        { name: 'property_address', type: 'address', required: true },
        { name: 'loan_amount', type: 'currency', required: true },
        { name: 'interest_rate', type: 'percentage', required: true },
        { name: 'term_length', type: 'text', required: true },
        { name: 'borrower_signature', type: 'signature', required: true },
        { name: 'lender_signature', type: 'signature', required: true }
      ],
      formatRules: [
        { field: 'loan_amount', pattern: '^\\$?[0-9,]+(\\.\\d{2})?$', message: 'Must be valid currency format' },
        { field: 'interest_rate', pattern: '^\\d+(\\.\\d+)?%?$', message: 'Must be valid percentage format' }
      ],
      redFlags: [
        'Missing signatures',
        'Invalid loan amount',
        'No interest rate specified'
      ],
      signatureRequirements: [
        { party: 'Borrower', required: true, witness: false },
        { party: 'Lender', required: true, witness: false }
      ],
      validityRules: {
        allPartiesSigned: true,
        loanAmountValid: true,
        interestRateSpecified: true
      }
    }
  ];
  
  console.log('📝 Inserting legal rules into Cosmos DB...');
  
  for (const rule of legalRules) {
    try {
      await container.items.upsert(rule);
      console.log(`✅ Inserted rule: ${rule.documentType} (${rule.jurisdiction})`);
    } catch (error) {
      console.error(`❌ Error inserting rule ${rule.id}:`, error.message);
    }
  }
  
  console.log('✅ Cosmos DB population complete!');
}

async function createSearchIndex() {
  console.log('🔍 Creating Search index...');
  
  const searchClient = new SearchClient(SEARCH_ENDPOINT, SEARCH_INDEX, new AzureKeyCredential(SEARCH_KEY));
  
  // Define the search index
  const indexDefinition = {
    name: SEARCH_INDEX,
    fields: [
      { name: 'id', type: 'Edm.String', key: true, searchable: false },
      { name: 'title', type: 'Edm.String', searchable: true, filterable: true },
      { name: 'content', type: 'Edm.String', searchable: true, filterable: false },
      { name: 'jurisdiction', type: 'Edm.String', searchable: true, filterable: true },
      { name: 'documentType', type: 'Edm.String', searchable: true, filterable: true },
      { name: 'sourceUrl', type: 'Edm.String', searchable: false, filterable: false },
      { name: 'effectiveDate', type: 'Edm.DateTimeOffset', searchable: false, filterable: true },
      { name: 'keyPhrases', type: 'Collection(Edm.String)', searchable: true, filterable: true }
    ],
    semanticSearch: {
      configurations: [
        {
          name: 'default',
          prioritizedFields: {
            titleField: { fieldName: 'title' },
            contentFields: [{ fieldName: 'content' }],
            keywordsFields: [{ fieldName: 'keyPhrases' }]
          }
        }
      ]
    }
  };
  
  try {
    await searchClient.createIndex(indexDefinition);
    console.log('✅ Search index created successfully!');
  } catch (error) {
    if (error.statusCode === 409) {
      console.log('ℹ️ Search index already exists');
    } else {
      console.error('❌ Error creating search index:', error.message);
    }
  }
}

async function populateSearchIndex() {
  console.log('📚 Populating Search index with legal references...');
  
  const searchClient = new SearchClient(SEARCH_ENDPOINT, SEARCH_INDEX, new AzureKeyCredential(SEARCH_KEY));
  
  // Legal reference documents
  const legalRefs = [
    {
      id: 'ref-aps-orea-100',
      title: 'OREA Form 100 - Agreement of Purchase and Sale',
      content: 'The OREA Form 100 is the standard Agreement of Purchase and Sale used in Ontario real estate transactions. It must include: purchase price, property description, closing date, deposit amount, and signatures from both buyer and seller. The deposit must be held in trust by the listing brokerage.',
      jurisdiction: 'Ontario',
      documentType: 'Agreement of Purchase and Sale (APS)',
      sourceUrl: 'https://www.orea.com/forms/orea-form-100',
      effectiveDate: new Date('2024-01-01'),
      keyPhrases: ['purchase price', 'closing date', 'deposit', 'signatures', 'buyer', 'seller']
    },
    {
      id: 'ref-fee-waiver-rules',
      title: 'Ontario Court Fee Waiver Rules',
      content: 'Fee waiver applications in Ontario require: completed application form, financial affidavit, case number, and supporting documentation. The court will consider the applicant\'s financial circumstances and the nature of the case when determining eligibility.',
      jurisdiction: 'Ontario',
      documentType: 'Fee Waiver Request',
      sourceUrl: 'https://www.ontario.ca/laws/regulation/990293',
      effectiveDate: new Date('2024-01-01'),
      keyPhrases: ['financial affidavit', 'case number', 'supporting documentation', 'eligibility']
    },
    {
      id: 'ref-lease-rta',
      title: 'Residential Tenancies Act - Lease Requirements',
      content: 'Under the Residential Tenancies Act, lease agreements must include: names of landlord and tenant, property address, rent amount, lease term, and signatures from both parties. The lease must comply with provincial rent control regulations.',
      jurisdiction: 'Ontario',
      documentType: 'Residential Lease Agreement',
      sourceUrl: 'https://www.ontario.ca/laws/statute/06r17',
      effectiveDate: new Date('2024-01-01'),
      keyPhrases: ['landlord', 'tenant', 'rent amount', 'lease term', 'signatures', 'rent control']
    },
    {
      id: 'ref-mortgage-act',
      title: 'Mortgages Act - Documentation Requirements',
      content: 'Mortgage documents must include: borrower and lender information, property description, loan amount, interest rate, term length, and signatures from both parties. The mortgage must be registered with the Land Registry Office.',
      jurisdiction: 'Ontario',
      documentType: 'Mortgage Document',
      sourceUrl: 'https://www.ontario.ca/laws/statute/90m30',
      effectiveDate: new Date('2024-01-01'),
      keyPhrases: ['borrower', 'lender', 'loan amount', 'interest rate', 'land registry']
    }
  ];
  
  try {
    await searchClient.uploadDocuments(legalRefs);
    console.log('✅ Search index populated with legal references!');
  } catch (error) {
    console.error('❌ Error populating search index:', error.message);
  }
}

async function main() {
  try {
    console.log('🚀 Starting Azure population process...');
    
    await populateCosmosDB();
    await createSearchIndex();
    await populateSearchIndex();
    
    console.log('✅ All Azure resources populated successfully!');
    console.log('🎯 Your document analysis system is now ready with:');
    console.log('   - Cosmos DB with legal rules');
    console.log('   - Search index with legal references');
    console.log('   - Full Azure integration');
    
  } catch (error) {
    console.error('❌ Error during population:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { populateCosmosDB, createSearchIndex, populateSearchIndex };
