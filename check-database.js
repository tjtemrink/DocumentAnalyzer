/**
 * Check what's in the local database
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'legal_knowledge.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('✅ Connected to SQLite database');
});

// Check what's in the database
db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, tables) => {
  if (err) {
    console.error('Error getting tables:', err.message);
    return;
  }
  
  console.log('📋 Tables in database:');
  tables.forEach(table => {
    console.log(`  - ${table.name}`);
  });
  
  // Check legal_rules table
  db.all("SELECT COUNT(*) as count FROM legal_rules;", (err, result) => {
    if (err) {
      console.error('Error counting legal_rules:', err.message);
      return;
    }
    
    console.log(`\n📊 Total legal rules: ${result[0].count}`);
    
    // Get sample rules
    db.all("SELECT jurisdiction, document_type, COUNT(*) as count FROM legal_rules GROUP BY jurisdiction, document_type;", (err, rules) => {
      if (err) {
        console.error('Error getting rule summary:', err.message);
        return;
      }
      
      console.log('\n📋 Rules by jurisdiction and document type:');
      rules.forEach(rule => {
        console.log(`  - ${rule.jurisdiction}: ${rule.document_type} (${rule.count} rules)`);
      });
      
      // Get a sample rule
      db.get("SELECT * FROM legal_rules LIMIT 1;", (err, sample) => {
        if (err) {
          console.error('Error getting sample rule:', err.message);
          return;
        }
        
        console.log('\n📄 Sample rule structure:');
        console.log(JSON.stringify(sample, null, 2));
        
        db.close();
      });
    });
  });
});

