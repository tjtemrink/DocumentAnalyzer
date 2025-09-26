const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'legal_knowledge.db');
const db = new sqlite3.Database(dbPath);

console.log('🗄️ Setting up Legal Knowledge Database...');

// Create tables
db.serialize(() => {
  // Legal Rules table
  db.run(`CREATE TABLE IF NOT EXISTS legal_rules (
    id TEXT PRIMARY KEY,
    jurisdiction TEXT NOT NULL,
    document_type TEXT NOT NULL,
    version TEXT NOT NULL,
    effective_date TEXT NOT NULL,
    required_fields TEXT NOT NULL,
    signature_requirements TEXT,
    expiry_rules TEXT,
    format_rules TEXT,
    red_flags TEXT,
    legal_references TEXT,
    last_updated TEXT NOT NULL
  )`);

  // Legal References table
  db.run(`CREATE TABLE IF NOT EXISTS legal_references (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    jurisdiction TEXT,
    document_type TEXT,
    source_url TEXT,
    effective_date TEXT,
    content TEXT,
    key_phrases TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert sample legal rules
  const rules = [
    {
      id: 'lease-ontario-v1',
      jurisdiction: 'ON',
      document_type: 'Residential Lease Agreement',
      version: '1.0',
      effective_date: '2024-01-01',
      required_fields: JSON.stringify([
        { name: 'rent_amount', type: 'number', description: 'Monthly rent amount' },
        { name: 'term_start', type: 'date', description: 'Lease start date' },
        { name: 'term_end', type: 'date', description: 'Lease end date' },
        { name: 'property_address', type: 'string', description: 'Full property address' },
        { name: 'landlord_name', type: 'string', description: 'Landlord full name' },
        { name: 'tenant_name', type: 'string', description: 'Tenant full name' }
      ]),
      signature_requirements: JSON.stringify([
        { role: 'Landlord', type: 'wet_or_electronic' },
        { role: 'Tenant', type: 'wet_or_electronic' }
      ]),
      expiry_rules: 'Lease term must be clearly defined. Standard lease is 12 months.',
      format_rules: JSON.stringify([
        { field: 'rent_amount', pattern: '^[0-9]+(\\.[0-9]{2})?$', message: 'Rent must be a valid currency amount' }
      ]),
      red_flags: JSON.stringify([
        'Unsigned document',
        'Missing deposit receipt',
        'No lease term specified',
        'Incomplete property address'
      ]),
      legal_references: JSON.stringify([
        {
          title: 'Residential Tenancies Act, 2006',
          section: 'S.2, S.17',
          source: 'https://www.ontario.ca/laws/statute/06r17',
          docId: 'RTA-ON-2006'
        }
      ]),
      last_updated: '2024-01-15'
    },
    {
      id: 'aps-ontario-v1',
      jurisdiction: 'ON',
      document_type: 'Agreement of Purchase and Sale (APS)',
      version: '1.0',
      effective_date: '2024-01-01',
      required_fields: JSON.stringify([
        { name: 'purchase_price', type: 'number', description: 'Total purchase price' },
        { name: 'closing_date', type: 'date', description: 'Transaction closing date' },
        { name: 'property_address', type: 'string', description: 'Full property address' },
        { name: 'buyer_signature', type: 'string', description: 'Buyer signature' },
        { name: 'seller_signature', type: 'string', description: 'Seller signature' },
        { name: 'legal_description', type: 'string', description: 'Legal description of property' },
        { name: 'deposit_amount', type: 'number', description: 'Initial deposit amount' }
      ]),
      signature_requirements: JSON.stringify([
        { role: 'Buyer', type: 'wet_or_electronic' },
        { role: 'Seller', type: 'wet_or_electronic' }
      ]),
      expiry_rules: 'Completion date must be on or after today for validity.',
      format_rules: JSON.stringify([
        { field: 'purchase_price', pattern: '^[0-9]+(\\.[0-9]{2})?$', message: 'Purchase price must be a valid currency amount' },
        { field: 'deposit_amount', pattern: '^[0-9]+(\\.[0-9]{2})?$', message: 'Deposit amount must be a valid currency amount' }
      ]),
      red_flags: JSON.stringify([
        'Missing mandatory Schedule A',
        'Alterations to OREA Form 100 without initials',
        'Incomplete legal description',
        'No completion date specified'
      ]),
      legal_references: JSON.stringify([
        {
          title: 'Real Estate and Business Brokers Act, 2002',
          section: 'S.21, S.22',
          source: 'https://www.ontario.ca/laws/statute/02r30',
          docId: 'REBBA-ON-2002'
        },
        {
          title: 'OREA Standard Form 100',
          source: 'https://www.orea.com/',
          docId: 'OREA-FORM-100'
        }
      ]),
      last_updated: '2024-01-15'
    },
    {
      id: 'cra-noa-v1',
      jurisdiction: 'CA',
      document_type: 'CRA Notice of Assessment',
      version: '1.0',
      effective_date: '2024-01-01',
      required_fields: JSON.stringify([
        { name: 'tax_year', type: 'number', description: 'Tax year being assessed' },
        { name: 'total_income', type: 'number', description: 'Total income reported' },
        { name: 'assessment_date', type: 'date', description: 'Date of assessment' },
        { name: 'sin_masked', type: 'string', description: 'Masked SIN number' }
      ]),
      signature_requirements: JSON.stringify([]),
      expiry_rules: 'Valid if dated within 18 months unless recency requirement specified.',
      format_rules: JSON.stringify([]),
      red_flags: JSON.stringify([
        'Missing SIN',
        'No tax year specified',
        'Assessment date missing'
      ]),
      legal_references: JSON.stringify([
        {
          title: 'Income Tax Act',
          section: 'S.150, S.152',
          source: 'https://laws-lois.justice.gc.ca/eng/acts/I-3.3/',
          docId: 'ITA-CA'
        }
      ]),
      last_updated: '2024-01-15'
    }
  ];

  // Insert rules
  const insertRule = db.prepare(`INSERT OR REPLACE INTO legal_rules 
    (id, jurisdiction, document_type, version, effective_date, required_fields, 
     signature_requirements, expiry_rules, format_rules, red_flags, legal_references, last_updated) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  rules.forEach(rule => {
    insertRule.run(
      rule.id, rule.jurisdiction, rule.document_type, rule.version, rule.effective_date,
      rule.required_fields, rule.signature_requirements, rule.expiry_rules, 
      rule.format_rules, rule.red_flags, rule.legal_references, rule.last_updated
    );
  });

  insertRule.finalize();

  // Insert legal references
  const references = [
    {
      title: 'Residential Tenancies Act, 2006',
      jurisdiction: 'ON',
      document_type: 'Residential Lease Agreement',
      source_url: 'https://www.ontario.ca/laws/statute/06r17',
      effective_date: '2006-01-01',
      content: 'The Residential Tenancies Act governs the rights and responsibilities of landlords and tenants in Ontario. It establishes rules for rent increases, evictions, maintenance obligations, and lease agreements.',
      key_phrases: JSON.stringify(['lease', 'tenant', 'landlord', 'rent', 'eviction', 'maintenance'])
    },
    {
      title: 'Real Estate and Business Brokers Act, 2002',
      jurisdiction: 'ON',
      document_type: 'Agreement of Purchase and Sale (APS)',
      source_url: 'https://www.ontario.ca/laws/statute/02r30',
      effective_date: '2002-01-01',
      content: 'This Act regulates real estate brokerage activities in Ontario, including requirements for agreements of purchase and sale, deposit handling, professional conduct, and client representation.',
      key_phrases: JSON.stringify(['purchase', 'sale', 'deposit', 'broker', 'agent', 'representation'])
    },
    {
      title: 'OREA Standard Form 100',
      jurisdiction: 'ON',
      document_type: 'Agreement of Purchase and Sale (APS)',
      source_url: 'https://www.orea.com/',
      effective_date: '2024-01-01',
      content: 'The standard form for agreements of purchase and sale used by Ontario real estate professionals. Includes required clauses, conditions, and legal protections for both buyers and sellers.',
      key_phrases: JSON.stringify(['OREA', 'form', 'standard', 'clauses', 'conditions'])
    },
    {
      title: 'Income Tax Act',
      jurisdiction: 'CA',
      document_type: 'CRA Notice of Assessment',
      source_url: 'https://laws-lois.justice.gc.ca/eng/acts/I-3.3/',
      effective_date: '1985-01-01',
      content: 'The federal Income Tax Act governs income tax assessment and collection in Canada. It establishes the framework for tax returns, assessments, appeals, and enforcement.',
      key_phrases: JSON.stringify(['tax', 'assessment', 'income', 'CRA', 'return'])
    }
  ];

  const insertRef = db.prepare(`INSERT OR REPLACE INTO legal_references 
    (title, jurisdiction, document_type, source_url, effective_date, content, key_phrases) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`);

  references.forEach(ref => {
    insertRef.run(
      ref.title, ref.jurisdiction, ref.document_type, ref.source_url, 
      ref.effective_date, ref.content, ref.key_phrases
    );
  });

  insertRef.finalize();

  console.log('✅ Database setup complete!');
  console.log(`📁 Database file: ${dbPath}`);
  console.log(`📊 Inserted ${rules.length} legal rules`);
  console.log(`📚 Inserted ${references.length} legal references`);
});

// Close database connection
db.close();
