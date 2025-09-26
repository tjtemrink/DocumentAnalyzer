// ML Plugins for Enhanced Document Analysis
class MLPlugins {
    constructor() {
        this.documentClassifier = new DocumentClassifier();
        this.fieldExtractor = new FieldExtractor();
        this.validityPredictor = new ValidityPredictor();
        this.sentimentAnalyzer = new SentimentAnalyzer();
        this.patternMatcher = new PatternMatcher();
    }

    // Analyze document with all ML plugins
    async analyzeDocument(file, filename) {
        const results = {
            documentType: null,
            confidence: 0,
            extractedFields: {},
            validityScore: 0,
            sentiment: 'neutral',
            patterns: [],
            recommendations: []
        };

        try {
            // Document classification
            const classification = await this.documentClassifier.classify(file, filename);
            results.documentType = classification.type;
            results.confidence = classification.confidence;

            // Field extraction
            const fields = await this.fieldExtractor.extract(file, classification.type);
            results.extractedFields = fields;

            // Validity prediction
            const validity = await this.validityPredictor.predict(fields, classification.type);
            results.validityScore = validity.score;

            // Sentiment analysis
            const sentiment = await this.sentimentAnalyzer.analyze(fields);
            results.sentiment = sentiment;

            // Pattern matching
            const patterns = await this.patternMatcher.match(fields, classification.type);
            results.patterns = patterns;

            // Generate recommendations
            results.recommendations = this.generateRecommendations(results);

        } catch (error) {
            console.error('ML Analysis Error:', error);
        }

        return results;
    }

    generateRecommendations(results) {
        const recommendations = [];
        
        if (results.confidence < 0.8) {
            recommendations.push("Document type confidence is low. Consider manual review.");
        }
        
        if (results.validityScore < 0.7) {
            recommendations.push("Document validity is questionable. Review required fields.");
        }
        
        if (results.sentiment === 'negative') {
            recommendations.push("Document contains negative language. Review for potential issues.");
        }

        return recommendations;
    }
}

// Document Classification Plugin
class DocumentClassifier {
    constructor() {
        this.models = {
            'Agreement of Purchase and Sale (APS)': {
                keywords: ['purchase', 'sale', 'buyer', 'seller', 'closing', 'property', 'price'],
                patterns: ['agreement of purchase', 'purchase and sale', 'real estate'],
                confidence: 0.9
            },
            'Residential Lease Agreement': {
                keywords: ['lease', 'rent', 'tenant', 'landlord', 'rental', 'monthly'],
                patterns: ['lease agreement', 'rental agreement', 'tenancy'],
                confidence: 0.9
            },
            'Landlord and Tenant Board Form': {
                keywords: ['ltb', 'board', 'application', 'hearing', 'tribunal'],
                patterns: ['landlord and tenant board', 'ltb form'],
                confidence: 0.85
            }
        };
    }

    async classify(file, filename) {
        const filenameLower = filename.toLowerCase();
        let bestMatch = { type: 'Unknown Document', confidence: 0.3 };
        let scores = [];

        for (const [docType, model] of Object.entries(this.models)) {
            const score = this.calculateScore(filenameLower, model);
            scores.push({ type: docType, score: score });
            if (score > bestMatch.confidence) {
                bestMatch = { type: docType, confidence: score };
            }
        }

        // If no strong match found, analyze file content patterns
        if (bestMatch.confidence < 0.6) {
            const contentAnalysis = this.analyzeFileContent(filename);
            if (contentAnalysis.confidence > bestMatch.confidence) {
                bestMatch = contentAnalysis;
            }
        }

        // If still no good match, return generic document type
        if (bestMatch.confidence < 0.4) {
            bestMatch = { type: 'General Legal Document', confidence: 0.3 };
        }

        console.log('Document Classification Results:', scores);
        console.log('Best Match:', bestMatch);
        
        return bestMatch;
    }

    analyzeFileContent(filename) {
        const filenameLower = filename.toLowerCase();
        
        // Check for specific document indicators
        if (filenameLower.includes('a2') || filenameLower.includes('a-2')) {
            return { type: 'A2 Form (Landlord and Tenant Board)', confidence: 0.9 };
        }
        if (filenameLower.includes('lease') || filenameLower.includes('rental')) {
            return { type: 'Residential Lease Agreement', confidence: 0.8 };
        }
        if (filenameLower.includes('ltb') || filenameLower.includes('landlord') || filenameLower.includes('tenant')) {
            return { type: 'Landlord and Tenant Board Form', confidence: 0.8 };
        }
        if (filenameLower.includes('waiver') || filenameLower.includes('fee')) {
            return { type: 'Fee Waiver Request', confidence: 0.8 };
        }
        if (filenameLower.includes('mortgage') || filenameLower.includes('loan')) {
            return { type: 'Mortgage Document', confidence: 0.8 };
        }
        if (filenameLower.includes('insurance') || filenameLower.includes('policy')) {
            return { type: 'Insurance Document', confidence: 0.8 };
        }
        if (filenameLower.includes('contract') || filenameLower.includes('agreement')) {
            return { type: 'General Contract', confidence: 0.6 };
        }
        if (filenameLower.includes('invoice') || filenameLower.includes('bill')) {
            return { type: 'Invoice/Bill', confidence: 0.7 };
        }
        if (filenameLower.includes('receipt') || filenameLower.includes('payment')) {
            return { type: 'Receipt/Payment', confidence: 0.7 };
        }
        if (filenameLower.includes('statement') || filenameLower.includes('account')) {
            return { type: 'Financial Statement', confidence: 0.7 };
        }
        if (filenameLower.includes('report') || filenameLower.includes('analysis')) {
            return { type: 'Report/Analysis', confidence: 0.6 };
        }
        if (filenameLower.includes('letter') || filenameLower.includes('correspondence')) {
            return { type: 'Letter/Correspondence', confidence: 0.6 };
        }
        if (filenameLower.includes('form') || filenameLower.includes('application')) {
            return { type: 'Form/Application', confidence: 0.6 };
        }
        
        return { type: 'Unknown Document', confidence: 0.2 };
    }

    calculateScore(filename, model) {
        let score = 0;
        let matches = 0;

        // Check filename patterns
        for (const pattern of model.patterns) {
            if (filename.includes(pattern.toLowerCase())) {
                score += 0.4;
                matches++;
            }
        }

        // Check keywords
        for (const keyword of model.keywords) {
            if (filename.includes(keyword.toLowerCase())) {
                score += 0.1;
                matches++;
            }
        }

        return Math.min(score, 0.95);
    }
}

// Field Extraction Plugin
class FieldExtractor {
    constructor() {
        this.fieldPatterns = {
            'purchasePrice': [/\$[\d,]+/, /price[:\s]*\$?[\d,]+/i],
            'closingDate': [/\d{1,2}\/\d{1,2}\/\d{4}/, /closing[:\s]*\d{1,2}\/\d{1,2}\/\d{4}/i],
            'buyerName': [/buyer[:\s]*([A-Za-z\s]+)/i, /purchaser[:\s]*([A-Za-z\s]+)/i],
            'sellerName': [/seller[:\s]*([A-Za-z\s]+)/i, /vendor[:\s]*([A-Za-z\s]+)/i],
            'propertyAddress': [/address[:\s]*([A-Za-z0-9\s,]+)/i, /property[:\s]*([A-Za-z0-9\s,]+)/i]
        };
    }

    async extract(file, documentType) {
        const extractedFields = {};
        
        // Mock extraction for demo
        if (documentType === 'Agreement of Purchase and Sale (APS)') {
            extractedFields.purchasePrice = '$750,000';
            extractedFields.closingDate = 'June 15, 2024';
            extractedFields.buyerName = 'John Doe';
            extractedFields.sellerName = 'Jane Smith';
            extractedFields.propertyAddress = '123 Main Street, Toronto, ON';
        }

        return extractedFields;
    }
}

// Validity Prediction Plugin
class ValidityPredictor {
    constructor() {
        this.validityRules = {
            'Agreement of Purchase and Sale (APS)': {
                requiredFields: ['purchasePrice', 'closingDate', 'buyerName', 'sellerName'],
                optionalFields: ['propertyAddress', 'depositAmount'],
                minScore: 0.7
            }
        };
    }

    async predict(fields, documentType) {
        const rules = this.validityRules[documentType] || this.validityRules['Agreement of Purchase and Sale (APS)'];
        let score = 0;
        let totalFields = rules.requiredFields.length + rules.optionalFields.length;
        let presentFields = 0;

        // Check required fields
        for (const field of rules.requiredFields) {
            if (fields[field]) {
                score += 0.8;
                presentFields++;
            }
        }

        // Check optional fields
        for (const field of rules.optionalFields) {
            if (fields[field]) {
                score += 0.2;
                presentFields++;
            }
        }

        return {
            score: Math.min(score, 1.0),
            presentFields,
            totalFields,
            status: score >= rules.minScore ? 'Valid' : 'Needs Review'
        };
    }
}

// Sentiment Analysis Plugin
class SentimentAnalyzer {
    constructor() {
        this.positiveWords = ['good', 'excellent', 'complete', 'valid', 'approved', 'signed'];
        this.negativeWords = ['incomplete', 'invalid', 'missing', 'error', 'problem', 'issue'];
    }

    async analyze(fields) {
        const text = JSON.stringify(fields).toLowerCase();
        let positiveCount = 0;
        let negativeCount = 0;

        for (const word of this.positiveWords) {
            if (text.includes(word)) positiveCount++;
        }

        for (const word of this.negativeWords) {
            if (text.includes(word)) negativeCount++;
        }

        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }
}

// Pattern Matching Plugin
class PatternMatcher {
    constructor() {
        this.patterns = {
            'legal_terms': ['agreement', 'contract', 'terms', 'conditions'],
            'financial_terms': ['price', 'amount', 'deposit', 'payment'],
            'date_terms': ['closing', 'deadline', 'expiry', 'valid'],
            'party_terms': ['buyer', 'seller', 'tenant', 'landlord']
        };
    }

    async match(fields, documentType) {
        const text = JSON.stringify(fields).toLowerCase();
        const matchedPatterns = [];

        for (const [category, terms] of Object.entries(this.patterns)) {
            const matches = terms.filter(term => text.includes(term));
            if (matches.length > 0) {
                matchedPatterns.push({
                    category,
                    matches,
                    confidence: matches.length / terms.length
                });
            }
        }

        return matchedPatterns;
    }
}

// Initialize ML plugins
window.mlPlugins = new MLPlugins();
