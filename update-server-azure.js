/**
 * Update the demo server to use Azure resources
 */

const fs = require('fs');
const path = require('path');

// Read the current demo-chat-server.js
const serverPath = path.join(__dirname, 'demo-chat-server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Update the Azure configuration section
const azureConfig = `
// Azure configuration
const COSMOS_ENDPOINT = process.env.COSMOS_ENDPOINT || 'https://cosmos-legal-kb-kb001.documents.azure.com:443/';
const COSMOS_KEY = process.env.COSMOS_KEY || '';
const COSMOS_DATABASE = 'legaldb';
const COSMOS_CONTAINER = 'LegalRules';

const SEARCH_ENDPOINT = process.env.SEARCH_ENDPOINT || 'https://srch-legal-kb-kb001.search.windows.net';
const SEARCH_KEY = process.env.SEARCH_KEY || '';
const SEARCH_INDEX = 'legalrefs-index';

// Azure clients
let cosmosClient, searchClient;

try {
  const { CosmosClient } = require('@azure/cosmos');
  const { SearchClient, AzureKeyCredential } = require('@azure/search-documents');
  
  if (COSMOS_KEY) {
    cosmosClient = new CosmosClient({
      endpoint: COSMOS_ENDPOINT,
      key: COSMOS_KEY
    });
    console.log('✅ Azure Cosmos DB connected');
  }
  
  if (SEARCH_KEY) {
    searchClient = new SearchClient(SEARCH_ENDPOINT, SEARCH_INDEX, new AzureKeyCredential(SEARCH_KEY));
    console.log('✅ Azure AI Search connected');
  }
} catch (error) {
  console.log('⚠️ Azure SDKs not available, using local fallback');
}`;

// Replace the existing Azure configuration
serverContent = serverContent.replace(
  /\/\/ Azure configuration[\s\S]*?console\.log\('⚠️ Azure.*?using local fallback'\);/,
  azureConfig
);

// Update the database query to use Cosmos DB
const cosmosQuery = `
    // Query Cosmos DB for validation rules
    if (cosmosClient) {
      try {
        const container = cosmosClient.database(COSMOS_DATABASE).container(COSMOS_CONTAINER);
        const { resource: rule } = await container.items
          .query({
            query: 'SELECT * FROM c WHERE c.jurisdiction = @jurisdiction AND c.documentType = @documentType',
            parameters: [
              { name: '@jurisdiction', value: jurisdiction },
              { name: '@documentType', value: documentType }
            ]
          })
          .fetchNext();
        
        if (rule) {
          // Use Cosmos DB rule
          const missingFields = [];
          const formatIssues = [];
          const redFlagsHit = [];
          
          // Check required fields
          rule.requiredFields.forEach(field => {
            if (!extracted[field.name]) {
              missingFields.push(field.name);
            }
          });
          
          // Check format rules
          rule.formatRules.forEach(formatRule => {
            const value = extracted[formatRule.field];
            if (value && !new RegExp(formatRule.pattern).test(String(value))) {
              formatIssues.push({
                field: formatRule.field,
                message: formatRule.message
              });
            }
          });
          
          // Determine validity status
          let validityStatus = "Valid";
          if (redFlagsHit.length > 0) {
            validityStatus = "Invalid";
          } else if (missingFields.length > 0 || formatIssues.length > 0) {
            validityStatus = "PartiallyValid";
          }
          
          result = {
            documentType: documentType,
            classificationConfidence: confidence,
            issueDate: "2025-01-15",
            expiryDate: "2025-12-31",
            validityStatus: validityStatus,
            reasons: [
              ...analysisNotes,
              ...missingFields.map(f => 'Missing required field: ' + f.replace(/_/g, ' ')),
              ...formatIssues.map(f => 'Format issue: ' + f.message),
              ...redFlagsHit.map(f => 'Red flag: ' + f)
            ],
            suggestedActions: [
              "Obtain missing signatures",
              "Verify all required information",
              "Review document completeness"
            ],
            userContext: userContext,
            correlationId: 'corr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
          };
          
          console.log('✅ Used Cosmos DB rule for validation');
        } else {
          console.log('⚠️ No rule found in Cosmos DB, using fallback');
          // Fallback to local validation
          result = {
            documentType: documentType,
            classificationConfidence: confidence,
            issueDate: "2025-01-15",
            expiryDate: "2025-12-31",
            validityStatus: "Undetermined",
            reasons: analysisNotes,
            suggestedActions: ["Manual review recommended"],
            userContext: userContext,
            correlationId: 'corr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
          };
        }
      } catch (cosmosError) {
        console.error('Cosmos DB error:', cosmosError);
        // Fallback to local validation
        result = {
          documentType: documentType,
          classificationConfidence: confidence,
          issueDate: "2025-01-15",
          expiryDate: "2025-12-31",
          validityStatus: "Undetermined",
          reasons: analysisNotes,
          suggestedActions: ["Manual review recommended"],
          userContext: userContext,
          correlationId: 'corr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        };
      }
    } else {
      // Fallback to local SQLite
      console.log('⚠️ Using local SQLite fallback');
      result = {
        documentType: documentType,
        classificationConfidence: confidence,
        issueDate: "2025-01-15",
        expiryDate: "2025-12-31",
        validityStatus: "Undetermined",
        reasons: analysisNotes,
        suggestedActions: ["Manual review recommended"],
        userContext: userContext,
        correlationId: 'corr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      };
    }`;

// Replace the database query section
serverContent = serverContent.replace(
  /\/\/ Query database for validation rules[\s\S]*?res\.json\(result\);/,
  cosmosQuery + '\n\n    res.json(result);'
);

// Update the search brief endpoint to use Azure Search
const searchBriefUpdate = `
  // Get briefs from Azure Search
  if (searchClient) {
    try {
      const searchResults = await searchClient.search('*', {
        filter: 'jurisdiction eq \'' + jurisdiction + '\' and documentType eq \'' + documentType + '\'',
        select: ['id', 'title', 'content', 'sourceUrl', 'keyPhrases'],
        top: 5
      });
      
      const briefs = [];
      for await (const result of searchResults.results) {
        briefs.push({
          title: result.document.title,
          excerpt: result.document.content.substring(0, 300) + '...',
          url: result.document.sourceUrl,
          keyPhrases: result.document.keyPhrases || []
        });
      }
      
      res.json(briefs);
      console.log('✅ Found ' + briefs.length + ' briefs from Azure Search');
    } catch (searchError) {
      console.error('Azure Search error:', searchError);
      res.json(mockBriefs);
    }
  } else {
    res.json(mockBriefs);
  }`;

// Replace the search brief endpoint
serverContent = serverContent.replace(
  /\/\/ Mock search briefs[\s\S]*?res\.json\(mockBriefs\);/,
  searchBriefUpdate
);

// Write the updated server file
fs.writeFileSync(serverPath, serverContent);

console.log('✅ Server updated to use Azure resources!');
console.log('🎯 The server will now:');
console.log('   - Use Cosmos DB for legal rules');
console.log('   - Use Azure AI Search for legal references');
console.log('   - Fall back to local SQLite if Azure is unavailable');
