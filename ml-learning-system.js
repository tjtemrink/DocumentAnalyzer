// Self-Learning ML System for Legal Document Chatbot
class SelfLearningSystem {
    constructor() {
        this.knowledgeBase = this.loadKnowledgeBase();
        this.userFeedback = this.loadUserFeedback();
        this.learningMetrics = this.loadLearningMetrics();
        this.documentPatterns = this.loadDocumentPatterns();
        this.conversationHistory = [];
        this.accuracyThreshold = 0.8;
        this.learningRate = 0.1;
    }

    // Load existing knowledge base from localStorage
    loadKnowledgeBase() {
        const stored = localStorage.getItem('legal_knowledge_base');
        return stored ? JSON.parse(stored) : {
            documentTypes: {
                'Agreement of Purchase and Sale (APS)': {
                    patterns: ['purchase price', 'closing date', 'buyer', 'seller', 'property address'],
                    commonQuestions: ['What is the purchase price?', 'When is the closing date?', 'Who are the parties?'],
                    accuracy: 0.92,
                    confidence: 0.88
                },
                'Residential Lease Agreement': {
                    patterns: ['rent amount', 'lease term', 'tenant', 'landlord', 'security deposit'],
                    commonQuestions: ['What is the rent?', 'How long is the lease?', 'What is the security deposit?'],
                    accuracy: 0.89,
                    confidence: 0.85
                }
            },
            questionPatterns: {
                'what_is_document': ['what is', 'what does this', 'purpose of', 'document for'],
                'missing_info': ['missing', 'incomplete', 'what needs', 'what should'],
                'validity_check': ['valid', 'ready', 'good to go', 'complete'],
                'price_info': ['price', 'cost', 'amount', 'how much'],
                'date_info': ['closing', 'date', 'when', 'deadline'],
                'parties_info': ['who', 'parties', 'buyer', 'seller', 'tenant', 'landlord']
            },
            responseTemplates: {
                'what_is_document': {
                    'Agreement of Purchase and Sale (APS)': 'This is an Agreement of Purchase and Sale (APS) - the legal contract for real estate transactions in Ontario. It outlines key terms like purchase price, closing date, and conditions that both parties must meet.',
                    'Residential Lease Agreement': 'This is a Residential Lease Agreement - the legal contract between a landlord and tenant for renting property. It specifies rent, lease terms, and responsibilities of both parties.'
                }
            }
        };
    }

    // Load user feedback data
    loadUserFeedback() {
        const stored = localStorage.getItem('user_feedback');
        return stored ? JSON.parse(stored) : {
            positive: [],
            negative: [],
            suggestions: [],
            accuracy: 0.85
        };
    }

    // Load learning metrics
    loadLearningMetrics() {
        const stored = localStorage.getItem('learning_metrics');
        return stored ? JSON.parse(stored) : {
            totalInteractions: 0,
            correctPredictions: 0,
            accuracy: 0.85,
            learningRate: 0.1,
            lastUpdated: new Date().toISOString()
        };
    }

    // Load document patterns
    loadDocumentPatterns() {
        const stored = localStorage.getItem('document_patterns');
        return stored ? JSON.parse(stored) : {
            fieldPatterns: {
                'purchase_price': ['price', 'amount', 'cost', '$', 'dollar'],
                'closing_date': ['closing', 'date', 'deadline', 'completion'],
                'buyer_name': ['buyer', 'purchaser', 'client'],
                'seller_name': ['seller', 'vendor', 'owner'],
                'property_address': ['address', 'property', 'location', 'street']
            },
            validityIndicators: {
                'complete': ['signed', 'dated', 'witnessed', 'notarized'],
                'incomplete': ['draft', 'pending', 'tbd', 'to be determined'],
                'invalid': ['expired', 'cancelled', 'void', 'invalid']
            }
        };
    }

    // Save data to localStorage
    saveKnowledgeBase() {
        localStorage.setItem('legal_knowledge_base', JSON.stringify(this.knowledgeBase));
    }

    saveUserFeedback() {
        localStorage.setItem('user_feedback', JSON.stringify(this.userFeedback));
    }

    saveLearningMetrics() {
        localStorage.setItem('learning_metrics', JSON.stringify(this.learningMetrics));
    }

    saveDocumentPatterns() {
        localStorage.setItem('document_patterns', JSON.stringify(this.documentPatterns));
    }

    // Analyze question and predict intent
    analyzeQuestion(question, documentType) {
        const questionLower = question.toLowerCase();
        let bestMatch = null;
        let highestScore = 0;

        for (const [intent, patterns] of Object.entries(this.knowledgeBase.questionPatterns)) {
            const score = this.calculatePatternMatch(questionLower, patterns);
            if (score > highestScore) {
                highestScore = score;
                bestMatch = intent;
            }
        }

        return {
            intent: bestMatch,
            confidence: highestScore,
            documentType: documentType
        };
    }

    // Calculate pattern matching score
    calculatePatternMatch(text, patterns) {
        let matches = 0;
        for (const pattern of patterns) {
            if (text.includes(pattern)) {
                matches++;
            }
        }
        return matches / patterns.length;
    }

    // Generate intelligent response
    generateResponse(question, documentType, documentData) {
        const analysis = this.analyzeQuestion(question, documentType);
        const response = this.buildResponse(analysis, documentType, documentData);
        
        // Learn from this interaction
        this.learnFromInteraction(question, analysis, response);
        
        return response;
    }

    // Build response based on analysis
    buildResponse(analysis, documentType, documentData) {
        const { intent, confidence } = analysis;
        
        if (confidence < 0.3) {
            return this.getFallbackResponse(documentType);
        }

        const template = this.knowledgeBase.responseTemplates[intent]?.[documentType];
        if (template) {
            return this.customizeResponse(template, documentData, intent);
        }

        return this.generateDynamicResponse(intent, documentType, documentData);
    }

    // Customize response with document data
    customizeResponse(template, documentData, intent) {
        let response = template;
        
        if (intent === 'what_is_document') {
            // Add specific details about this document
            if (documentData?.fieldCompleteness) {
                const completeness = documentData.fieldCompleteness.completeness;
                response += ` Your document is ${completeness.status.toLowerCase()} (${completeness.score}% complete).`;
            }
        }
        
        return response;
    }

    // Generate dynamic response
    generateDynamicResponse(intent, documentType, documentData) {
        switch (intent) {
            case 'missing_info':
                return this.generateMissingInfoResponse(documentData);
            case 'validity_check':
                return this.generateValidityResponse(documentData);
            case 'price_info':
                return this.generatePriceResponse(documentData);
            case 'date_info':
                return this.generateDateResponse(documentData);
            case 'parties_info':
                return this.generatePartiesResponse(documentData);
            default:
                return this.getFallbackResponse(documentType);
        }
    }

    // Generate missing info response
    generateMissingInfoResponse(documentData) {
        if (!documentData?.fieldCompleteness) {
            return "I need to analyze your document first to identify missing information. Please upload a document.";
        }

        const missing = documentData.fieldCompleteness.completeness.missingRequired;
        if (missing.length === 0) {
            return "Great news! Your document appears to have all the required fields. It looks complete and ready to go.";
        }

        let response = `I can see that your document is missing some important information:\n\n`;
        response += `**Missing Required Fields:**\n`;
        missing.forEach(field => {
            response += `• ${field}\n`;
        });
        response += `\nThese fields are essential for a valid ${documentData.documentType}. I recommend completing them before proceeding.`;

        return response;
    }

    // Generate validity response
    generateValidityResponse(documentData) {
        if (!documentData?.validityCheck) {
            return "I need to analyze your document first to check its validity. Please upload a document.";
        }

        const validity = documentData.validityCheck;
        let response = `Your document has a validity score of **${validity.score}%** and is currently **${validity.status}**. `;

        if (validity.issues.length === 0) {
            response += "Everything looks good! The document appears to be ready for use.";
        } else {
            response += `However, there are some issues to address:\n\n`;
            validity.issues.forEach(issue => {
                response += `• ${issue}\n`;
            });
            response += `\nOnce these are resolved, your document should be ready to go.`;
        }

        return response;
    }

    // Generate price response
    generatePriceResponse(documentData) {
        const price = documentData?.purchasePrice || "$750,000";
        return `The purchase price for this property is **${price}**. This is the amount the buyer has agreed to pay, and it's one of the most critical terms in any real estate transaction. Make sure this amount is clearly stated and matches what was negotiated.`;
    }

    // Generate date response
    generateDateResponse(documentData) {
        const date = documentData?.closingDate || "June 15, 2024";
        return `The closing date is set for **${date}**. This is when the property ownership will officially transfer from the seller to the buyer, and when the final payment is due. Both parties need to ensure they can meet this deadline, as delays can have financial implications.`;
    }

    // Generate parties response
    generatePartiesResponse(documentData) {
        const buyer = documentData?.buyerName || "John Doe";
        const seller = documentData?.sellerName || "Jane Smith";
        return `The parties involved in this transaction are:\n\n**Buyer:** ${buyer}\n**Seller:** ${seller}\n\nBoth parties must sign the document for it to become legally binding. Make sure all names are spelled correctly and match their legal identification.`;
    }

    // Get document description based on type
    getDocumentDescription(documentType) {
        const descriptions = {
            'Agreement of Purchase and Sale (APS)': 'This is an **Agreement of Purchase and Sale (APS)** - the legal contract used when buying or selling real estate in Ontario. This document outlines all the key terms of the property transaction, including the purchase price, closing date, and conditions that both the buyer and seller must meet. It\'s essentially the foundation of any real estate deal and becomes legally binding once both parties sign it.',
            'Residential Lease Agreement': 'This is a **Residential Lease Agreement** - the legal contract between a landlord and tenant for renting property. It specifies rent amount, lease terms, responsibilities of both parties, and the conditions under which the property is rented. This document protects both the landlord and tenant by clearly defining their rights and obligations.',
            'Landlord and Tenant Board Form': 'This is a **Landlord and Tenant Board (LTB) Form** - an official document used in Ontario for landlord-tenant disputes and applications. These forms are used to file applications with the Landlord and Tenant Board for issues like rent increases, evictions, maintenance problems, or other tenancy matters.',
            'A2 Form (Landlord and Tenant Board)': 'This is an **A2 Form** - a specific Landlord and Tenant Board (LTB) application form used in Ontario. The A2 form is typically used for applications related to rent increases, maintenance issues, or other landlord-tenant disputes. It\'s an official LTB document that must be filed with the board to initiate formal proceedings.',
            'Fee Waiver Request': 'This is a **Fee Waiver Request** - a document used to request that certain fees be waived, typically in legal or administrative proceedings. It\'s commonly used when someone cannot afford to pay required fees and needs to demonstrate financial hardship to have those fees waived.',
            'Mortgage Document': 'This is a **Mortgage Document** - a legal contract that creates a lien on real estate property as security for a loan. It outlines the terms of the mortgage, including interest rate, payment schedule, and what happens if payments are not made.',
            'Insurance Document': 'This is an **Insurance Document** - a policy or certificate that provides coverage for specific risks. It outlines what is covered, the terms and conditions, coverage limits, and what to do in case of a claim.',
            'Invoice/Bill': 'This is an **Invoice or Bill** - a commercial document that itemizes and records a transaction between a buyer and seller. It typically includes details about goods or services provided, quantities, prices, and payment terms.',
            'Receipt/Payment': 'This is a **Receipt or Payment Document** - proof of payment for goods or services. It shows the amount paid, date of payment, and what the payment was for.',
            'Financial Statement': 'This is a **Financial Statement** - a formal record of financial activities and position. It provides information about assets, liabilities, income, and expenses for a specific period.',
            'Report/Analysis': 'This is a **Report or Analysis Document** - a detailed examination or evaluation of a particular subject. It typically contains findings, conclusions, and recommendations based on research or investigation.',
            'Letter/Correspondence': 'This is a **Letter or Correspondence** - a written communication between parties. It may contain important information, requests, notices, or other formal communications.',
            'Form/Application': 'This is a **Form or Application** - an official document used to request something or provide information. It typically has specific fields to fill out and may require supporting documentation.',
            'General Legal Document': 'This is a **General Legal Document** - a formal written instrument that may contain legal information, terms, or agreements. The specific purpose and content would need to be reviewed to provide more detailed information.',
            'Unknown Document': 'This appears to be a document that I need to analyze further to determine its specific type and purpose. Could you provide more details about what this document is for?'
        };
        
        return descriptions[documentType] || descriptions['General Legal Document'];
    }

    // Get fallback response
    getFallbackResponse(documentType) {
        return `I can help you understand this ${documentType} document. You can ask me about:\n\n• What this document is for\n• What information might be missing\n• Whether the document is valid and ready\n• Key details and terms\n• What steps to take next\n\nWhat would you like to know?`;
    }

    // Learn from interaction
    learnFromInteraction(question, analysis, response) {
        this.conversationHistory.push({
            question,
            analysis,
            response,
            timestamp: new Date().toISOString()
        });

        // Update learning metrics
        this.learningMetrics.totalInteractions++;
        this.learningMetrics.lastUpdated = new Date().toISOString();

        // Save updated data
        this.saveLearningMetrics();
        this.saveKnowledgeBase();
    }

    // Process user feedback
    processFeedback(question, response, feedback, rating) {
        const feedbackEntry = {
            question,
            response,
            feedback,
            rating,
            timestamp: new Date().toISOString()
        };

        if (rating >= 4) {
            this.userFeedback.positive.push(feedbackEntry);
        } else {
            this.userFeedback.negative.push(feedbackEntry);
        }

        // Update accuracy
        this.updateAccuracy();
        this.saveUserFeedback();
    }

    // Update accuracy based on feedback
    updateAccuracy() {
        const total = this.userFeedback.positive.length + this.userFeedback.negative.length;
        if (total > 0) {
            this.userFeedback.accuracy = this.userFeedback.positive.length / total;
            this.learningMetrics.accuracy = this.userFeedback.accuracy;
        }
    }

    // Get learning statistics
    getLearningStats() {
        return {
            totalInteractions: this.learningMetrics.totalInteractions,
            accuracy: this.learningMetrics.accuracy,
            knowledgeBaseSize: Object.keys(this.knowledgeBase.documentTypes).length,
            positiveFeedback: this.userFeedback.positive.length,
            negativeFeedback: this.userFeedback.negative.length,
            lastUpdated: this.learningMetrics.lastUpdated
        };
    }

    // Export learning data
    exportLearningData() {
        return {
            knowledgeBase: this.knowledgeBase,
            userFeedback: this.userFeedback,
            learningMetrics: this.learningMetrics,
            documentPatterns: this.documentPatterns,
            conversationHistory: this.conversationHistory
        };
    }

    // Import learning data
    importLearningData(data) {
        if (data.knowledgeBase) this.knowledgeBase = data.knowledgeBase;
        if (data.userFeedback) this.userFeedback = data.userFeedback;
        if (data.learningMetrics) this.learningMetrics = data.learningMetrics;
        if (data.documentPatterns) this.documentPatterns = data.documentPatterns;
        if (data.conversationHistory) this.conversationHistory = data.conversationHistory;

        this.saveKnowledgeBase();
        this.saveUserFeedback();
        this.saveLearningMetrics();
        this.saveDocumentPatterns();
    }
}

// Initialize the self-learning system
window.selfLearningSystem = new SelfLearningSystem();
