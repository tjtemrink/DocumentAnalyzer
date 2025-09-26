/**
 * Check legal references in the database
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

// Check legal_references table
db.all("SELECT COUNT(*) as count FROM legal_references;", (err, result) => {
  if (err) {
    console.error('Error counting legal_references:', err.message);
    return;
  }
  
  console.log(`📊 Total legal references: ${result[0].count}`);
  
  // Get sample references
  db.all("SELECT title, jurisdiction, document_type FROM legal_references LIMIT 10;", (err, refs) => {
    if (err) {
      console.error('Error getting references:', err.message);
      return;
    }
    
    console.log('\n📚 Sample legal references:');
    refs.forEach(ref => {
      console.log(`  - ${ref.title} (${ref.jurisdiction}, ${ref.document_type})`);
    });
    
    db.close();
  });
});

