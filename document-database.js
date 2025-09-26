/**
 * Document Database - Comprehensive knowledge base for document analysis
 * Contains patterns, rules, and examples for various document types
 */

class DocumentDatabase {
    constructor() {
        this.documentTypes = new Map();
        this.patterns = new Map();
        this.rules = new Map();
        this.examples = new Map();
        this.initializeDatabase();
    }

    /**
     * Initialize the comprehensive document database
     */
    initializeDatabase() {
        this.initializeDocumentTypes();
        this.initializePatterns();
        this.initializeRules();
        this.initializeExamples();
    }

    /**
     * Initialize document type definitions
     */
    initializeDocumentTypes() {
        // Agreement of Purchase and Sale (APS)
        this.documentTypes.set('Agreement of Purchase and Sale (APS)', {
            name: 'Agreement of Purchase and Sale (APS)',
            category: 'Real Estate',
            jurisdiction: 'Ontario',
            description: 'Legal contract between buyer and seller for property purchase',
            requiredFields: [
                'purchasePrice', 'closingDate', 'buyerName', 'sellerName', 
                'propertyAddress', 'depositAmount', 'irrevocableDate'
            ],
            optionalFields: [
                'scheduleA', 'conditions', 'chattels', 'fixtures', 'adjustments'
            ],
            validityRules: {
                maxAge: 365,
                requiredSignatures: ['buyer', 'seller'],
                minFields: 7
            },
            commonIssues: [
                'Missing irrevocable date',
                'Schedule A not attached',
                'Incomplete party information',
                'Missing property description'
            ],
            legalReferences: [
                'Real Estate and Business Brokers Act, 2002 (REBBA)',
                'Standard Form 100 Agreement of Purchase and Sale',
                'Ontario Real Estate Association (OREA) guidelines'
            ]
        });

        // Residential Lease Agreement
        this.documentTypes.set('Residential Lease Agreement', {
            name: 'Residential Lease Agreement',
            category: 'Rental',
            jurisdiction: 'Ontario',
            description: 'Contract between landlord and tenant for residential rental',
            requiredFields: [
                'rentAmount', 'leaseStartDate', 'leaseEndDate', 'tenantName', 
                'landlordName', 'propertyAddress', 'securityDeposit'
            ],
            optionalFields: [
                'utilities', 'parking', 'pets', 'maintenance', 'termination'
            ],
            validityRules: {
                maxAge: 365,
                requiredSignatures: ['tenant', 'landlord'],
                minFields: 6
            },
            commonIssues: [
                'Missing lease term dates',
                'Incomplete rent amount',
                'Missing security deposit details',
                'Unclear maintenance responsibilities'
            ],
            legalReferences: [
                'Residential Tenancies Act, 2006',
                'Landlord and Tenant Board guidelines',
                'Ontario Human Rights Code'
            ]
        });

        // Landlord and Tenant Board Form
        this.documentTypes.set('Landlord and Tenant Board Form', {
            name: 'Landlord and Tenant Board Form',
            category: 'Legal Form',
            jurisdiction: 'Ontario',
            description: 'Official form for LTB applications and disputes',
            requiredFields: [
                'formNumber', 'applicantName', 'respondentName', 'propertyAddress', 
                'issueDate', 'applicationType', 'reason'
            ],
            optionalFields: [
                'hearingDate', 'evidence', 'witnesses', 'supportingDocuments'
            ],
            validityRules: {
                maxAge: 30,
                requiredSignatures: ['applicant'],
                minFields: 5
            },
            commonIssues: [
                'Missing form number',
                'Incomplete party information',
                'Missing application reason',
                'Outdated form version'
            ],
            legalReferences: [
                'Residential Tenancies Act, 2006',
                'Landlord and Tenant Board Rules',
                'Statutory Powers Procedure Act'
            ]
        });

        // Fee Waiver Request
        this.documentTypes.set('Fee Waiver Request', {
            name: 'Fee Waiver Request',
            category: 'Administrative',
            jurisdiction: 'Ontario',
            description: 'Request for exemption from court or administrative fees',
            requiredFields: [
                'applicantName', 'reasonForRequest', 'financialInformation', 
                'supportingDocuments', 'dateOfRequest'
            ],
            optionalFields: [
                'caseNumber', 'hearingDate', 'previousWaivers', 'incomeVerification'
            ],
            validityRules: {
                maxAge: 90,
                requiredSignatures: ['applicant'],
                minFields: 4
            },
            commonIssues: [
                'Missing financial information',
                'Incomplete reason for request',
                'Missing supporting documentation',
                'Insufficient income verification'
            ],
            legalReferences: [
                'Courts of Justice Act',
                'Family Law Rules',
                'Rules of Civil Procedure'
            ]
        });

        // Mortgage Document
        this.documentTypes.set('Mortgage Document', {
            name: 'Mortgage Document',
            category: 'Financial',
            jurisdiction: 'Ontario',
            description: 'Legal document securing a loan with property as collateral',
            requiredFields: [
                'borrowerName', 'lenderName', 'propertyAddress', 'loanAmount', 
                'interestRate', 'termLength', 'paymentAmount'
            ],
            optionalFields: [
                'amortizationPeriod', 'prepaymentPrivileges', 'insurance', 'defaultTerms'
            ],
            validityRules: {
                maxAge: 365,
                requiredSignatures: ['borrower', 'lender'],
                minFields: 6
            },
            commonIssues: [
                'Missing interest rate',
                'Incomplete loan terms',
                'Missing property description',
                'Unclear payment schedule'
            ],
            legalReferences: [
                'Mortgages Act',
                'Interest Act',
                'Bank Act'
            ]
        });

        // Property Appraisal
        this.documentTypes.set('Property Appraisal', {
            name: 'Property Appraisal',
            category: 'Valuation',
            jurisdiction: 'Ontario',
            description: 'Professional assessment of property value',
            requiredFields: [
                'appraiserName', 'propertyAddress', 'appraisedValue', 'appraisalDate', 
                'propertyType', 'appraisalMethod'
            ],
            optionalFields: [
                'comparableProperties', 'marketConditions', 'propertyCondition', 'recommendations'
            ],
            validityRules: {
                maxAge: 180,
                requiredSignatures: ['appraiser'],
                minFields: 5
            },
            commonIssues: [
                'Outdated appraisal',
                'Missing appraiser credentials',
                'Incomplete property description',
                'Unclear valuation method'
            ],
            legalReferences: [
                'Appraisal Institute of Canada standards',
                'Real Estate and Business Brokers Act, 2002',
                'Professional standards for appraisers'
            ]
        });
    }

    /**
     * Initialize document patterns for recognition
     */
    initializePatterns() {
        // APS Patterns
        this.patterns.set('Agreement of Purchase and Sale (APS)', {
            keywords: [
                'agreement of purchase and sale', 'aps', 'purchase price', 'closing date',
                'buyer', 'seller', 'property', 'deposit', 'irrevocable'
            ],
            phrases: [
                'this agreement is made between',
                'purchase price of',
                'closing date of',
                'deposit amount of',
                'irrevocable until'
            ],
            numbers: [
                'purchase price', 'deposit amount', 'closing date'
            ],
            dates: [
                'closing date', 'irrevocable date', 'agreement date'
            ]
        });

        // Lease Patterns
        this.patterns.set('Residential Lease Agreement', {
            keywords: [
                'lease agreement', 'rental agreement', 'tenant', 'landlord', 'rent',
                'lease term', 'security deposit', 'utilities'
            ],
            phrases: [
                'lease agreement between',
                'monthly rent of',
                'lease term of',
                'security deposit of',
                'tenant responsibilities'
            ],
            numbers: [
                'rent amount', 'security deposit', 'lease term'
            ],
            dates: [
                'lease start date', 'lease end date', 'rent due date'
            ]
        });

        // LTB Form Patterns
        this.patterns.set('Landlord and Tenant Board Form', {
            keywords: [
                'landlord and tenant board', 'ltb', 'form', 'application',
                'hearing', 'dispute', 'eviction', 'rent increase'
            ],
            phrases: [
                'landlord and tenant board',
                'form number',
                'application for',
                'hearing date',
                'respondent'
            ],
            numbers: [
                'form number', 'case number'
            ],
            dates: [
                'application date', 'hearing date', 'issue date'
            ]
        });

        // Fee Waiver Patterns
        this.patterns.set('Fee Waiver Request', {
            keywords: [
                'fee waiver', 'waiver request', 'financial hardship',
                'inability to pay', 'court fees', 'administrative fees'
            ],
            phrases: [
                'request for fee waiver',
                'financial hardship',
                'inability to pay',
                'supporting documentation',
                'income verification'
            ],
            numbers: [
                'income amount', 'expense amount', 'asset value'
            ],
            dates: [
                'request date', 'hearing date'
            ]
        });
    }

    /**
     * Initialize validation rules
     */
    initializeRules() {
        // APS Rules
        this.rules.set('Agreement of Purchase and Sale (APS)', {
            requiredFields: {
                purchasePrice: { type: 'currency', required: true, min: 1 },
                closingDate: { type: 'date', required: true, future: true },
                buyerName: { type: 'text', required: true, minLength: 2 },
                sellerName: { type: 'text', required: true, minLength: 2 },
                propertyAddress: { type: 'text', required: true, minLength: 10 },
                depositAmount: { type: 'currency', required: true, min: 1 }
            },
            validationRules: {
                depositAmount: (value, context) => {
                    const purchasePrice = context.purchasePrice;
                    if (purchasePrice && value) {
                        const depositPercent = (value / purchasePrice) * 100;
                        return depositPercent >= 1 && depositPercent <= 20;
                    }
                    return true;
                },
                closingDate: (value, context) => {
                    if (value) {
                        const closingDate = new Date(value);
                        const now = new Date();
                        const daysDiff = (closingDate - now) / (1000 * 60 * 60 * 24);
                        return daysDiff >= 30 && daysDiff <= 365;
                    }
                    return true;
                }
            }
        });

        // Lease Rules
        this.rules.set('Residential Lease Agreement', {
            requiredFields: {
                rentAmount: { type: 'currency', required: true, min: 1 },
                leaseStartDate: { type: 'date', required: true },
                leaseEndDate: { type: 'date', required: true, future: true },
                tenantName: { type: 'text', required: true, minLength: 2 },
                landlordName: { type: 'text', required: true, minLength: 2 },
                propertyAddress: { type: 'text', required: true, minLength: 10 }
            },
            validationRules: {
                leaseEndDate: (value, context) => {
                    const startDate = context.leaseStartDate;
                    if (startDate && value) {
                        const start = new Date(startDate);
                        const end = new Date(value);
                        const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
                        return daysDiff >= 30 && daysDiff <= 3650; // 1 month to 10 years
                    }
                    return true;
                }
            }
        });
    }

    /**
     * Initialize example documents for training
     */
    initializeExamples() {
        // APS Examples
        this.examples.set('Agreement of Purchase and Sale (APS)', [
            {
                text: 'This Agreement of Purchase and Sale is made between John Doe (Buyer) and Jane Smith (Seller) for the property at 123 Main Street, Toronto, ON. The purchase price is $750,000 with a closing date of June 15, 2024. The deposit amount is $37,500.',
                confidence: 0.95,
                extractedFields: {
                    buyerName: 'John Doe',
                    sellerName: 'Jane Smith',
                    propertyAddress: '123 Main Street, Toronto, ON',
                    purchasePrice: '$750,000',
                    closingDate: 'June 15, 2024',
                    depositAmount: '$37,500'
                }
            },
            {
                text: 'Agreement of Purchase and Sale between ABC Corporation (Buyer) and XYZ Properties Ltd. (Seller) for the commercial property at 456 Business Ave, Mississauga, ON. Purchase price: $1,200,000. Closing: September 30, 2024. Deposit: $60,000.',
                confidence: 0.92,
                extractedFields: {
                    buyerName: 'ABC Corporation',
                    sellerName: 'XYZ Properties Ltd.',
                    propertyAddress: '456 Business Ave, Mississauga, ON',
                    purchasePrice: '$1,200,000',
                    closingDate: 'September 30, 2024',
                    depositAmount: '$60,000'
                }
            }
        ]);

        // Lease Examples
        this.examples.set('Residential Lease Agreement', [
            {
                text: 'Residential Lease Agreement between Mike Johnson (Tenant) and Sarah Wilson (Landlord) for the apartment at 789 Oak Street, Hamilton, ON. Monthly rent: $2,200. Lease term: January 1, 2024 to December 31, 2024. Security deposit: $2,200.',
                confidence: 0.94,
                extractedFields: {
                    tenantName: 'Mike Johnson',
                    landlordName: 'Sarah Wilson',
                    propertyAddress: '789 Oak Street, Hamilton, ON',
                    rentAmount: '$2,200',
                    leaseStartDate: 'January 1, 2024',
                    leaseEndDate: 'December 31, 2024',
                    securityDeposit: '$2,200'
                }
            }
        ]);
    }

    /**
     * Get document type information
     */
    getDocumentType(typeName) {
        return this.documentTypes.get(typeName);
    }

    /**
     * Get patterns for document type
     */
    getPatterns(typeName) {
        return this.patterns.get(typeName);
    }

    /**
     * Get validation rules for document type
     */
    getRules(typeName) {
        return this.rules.get(typeName);
    }

    /**
     * Get examples for document type
     */
    getExamples(typeName) {
        return this.examples.get(typeName);
    }

    /**
     * Analyze document text against patterns
     */
    analyzeDocument(text, filename = '') {
        const results = [];
        const textLower = text.toLowerCase();
        const filenameLower = filename.toLowerCase();

        for (const [typeName, patterns] of this.patterns) {
            let score = 0;
            let matches = [];

            // Check keywords
            for (const keyword of patterns.keywords) {
                if (textLower.includes(keyword.toLowerCase())) {
                    score += 2;
                    matches.push(keyword);
                }
            }

            // Check phrases
            for (const phrase of patterns.phrases) {
                if (textLower.includes(phrase.toLowerCase())) {
                    score += 3;
                    matches.push(phrase);
                }
            }

            // Check filename patterns
            for (const keyword of patterns.keywords) {
                if (filenameLower.includes(keyword.toLowerCase())) {
                    score += 1;
                    matches.push(`filename: ${keyword}`);
                }
            }

            if (score > 0) {
                results.push({
                    documentType: typeName,
                    confidence: Math.min(score / 10, 1),
                    matches: matches,
                    score: score
                });
            }
        }

        // Sort by confidence
        results.sort((a, b) => b.confidence - a.confidence);

        return results;
    }

    /**
     * Validate document fields
     */
    validateDocument(documentType, fields) {
        const rules = this.getRules(documentType);
        if (!rules) return { valid: true, issues: [] };

        const issues = [];
        const warnings = [];

        // Check required fields
        for (const [fieldName, rule] of Object.entries(rules.requiredFields)) {
            if (rule.required && (!fields[fieldName] || fields[fieldName].toString().trim() === '')) {
                issues.push(`Missing required field: ${fieldName}`);
            }
        }

        // Run validation rules
        if (rules.validationRules) {
            for (const [fieldName, validator] of Object.entries(rules.validationRules)) {
                if (fields[fieldName]) {
                    try {
                        const isValid = validator(fields[fieldName], fields);
                        if (!isValid) {
                            warnings.push(`Invalid value for ${fieldName}: ${fields[fieldName]}`);
                        }
                    } catch (error) {
                        warnings.push(`Error validating ${fieldName}: ${error.message}`);
                    }
                }
            }
        }

        return {
            valid: issues.length === 0,
            issues: issues,
            warnings: warnings,
            score: Math.max(0, 100 - (issues.length * 20) - (warnings.length * 5))
        };
    }

    /**
     * Get all document types
     */
    getAllDocumentTypes() {
        return Array.from(this.documentTypes.keys());
    }

    /**
     * Get document types by category
     */
    getDocumentTypesByCategory(category) {
        const result = [];
        for (const [name, info] of this.documentTypes) {
            if (info.category === category) {
                result.push({ name, ...info });
            }
        }
        return result;
    }

    /**
     * Add new document type
     */
    addDocumentType(typeName, definition) {
        this.documentTypes.set(typeName, definition);
    }

    /**
     * Update document type
     */
    updateDocumentType(typeName, updates) {
        const existing = this.documentTypes.get(typeName);
        if (existing) {
            this.documentTypes.set(typeName, { ...existing, ...updates });
        }
    }

    /**
     * Get learning statistics
     */
    getLearningStats() {
        return {
            totalDocumentTypes: this.documentTypes.size,
            totalPatterns: this.patterns.size,
            totalRules: this.rules.size,
            totalExamples: this.examples.size,
            categories: [...new Set(Array.from(this.documentTypes.values()).map(d => d.category))]
        };
    }
}

// Make it available globally
window.DocumentDatabase = DocumentDatabase;
