/**
 * Enhanced Chat System - Better integration with document analyzer
 * Provides contextual, document-aware conversations
 */

class EnhancedChatSystem {
    constructor() {
        this.currentDocument = null;
        this.conversationHistory = [];
        this.learningData = {
            totalConversations: 0,
            documentTypePatterns: new Map(),
            questionPatterns: new Map(),
            successfulResponses: new Map(),
            userFeedback: []
        };
    }

    /**
     * Initialize chat with document analysis results
     */
    initializeWithDocument(documentData) {
        this.currentDocument = documentData;
        this.conversationHistory = [];
        
        // Extract document context
        const context = this.extractDocumentContext(documentData);
        
        // Generate initial greeting based on document type
        const greeting = this.generateContextualGreeting(documentData, context);
        
        return {
            greeting: greeting,
            context: context,
            suggestions: this.generateQuestionSuggestions(documentData)
        };
    }

    /**
     * Extract key context from document analysis
     */
    extractDocumentContext(documentData) {
        const context = {
            documentType: documentData?.documentType || 'Unknown',
            confidence: documentData?.classificationConfidence || 0,
            completeness: documentData?.fieldCompleteness?.completeness || {},
            validity: documentData?.validityCheck || {},
            jurisdiction: documentData?.jurisdiction || 'Unknown',
            keyFields: this.extractKeyFields(documentData),
            issues: documentData?.validityCheck?.issues || [],
            warnings: documentData?.validityCheck?.warnings || []
        };
        
        return context;
    }

    /**
     * Extract key fields from document data
     */
    extractKeyFields(documentData) {
        const fields = {};
        
        // Common fields across document types
        if (documentData?.issueDate) fields.issueDate = documentData.issueDate;
        if (documentData?.expiryDate) fields.expiryDate = documentData.expiryDate;
        if (documentData?.jurisdiction) fields.jurisdiction = documentData.jurisdiction;
        
        // Document-specific fields
        if (documentData?.purchasePrice) fields.purchasePrice = documentData.purchasePrice;
        if (documentData?.closingDate) fields.closingDate = documentData.closingDate;
        if (documentData?.buyerName) fields.buyerName = documentData.buyerName;
        if (documentData?.sellerName) fields.sellerName = documentData.sellerName;
        if (documentData?.propertyAddress) fields.propertyAddress = documentData.propertyAddress;
        if (documentData?.depositAmount) fields.depositAmount = documentData.depositAmount;
        
        return fields;
    }

    /**
     * Generate contextual greeting based on document type
     */
    generateContextualGreeting(documentData, context) {
        const docType = context.documentType;
        const confidence = Math.round(context.confidence * 100);
        const completeness = context.completeness.score || 0;
        
        let greeting = `Hello! I've analyzed your **${docType}** document. `;
        
        if (confidence >= 90) {
            greeting += `I'm ${confidence}% confident about the document type. `;
        } else if (confidence >= 70) {
            greeting += `I'm ${confidence}% confident about the document type, but there might be some uncertainty. `;
        } else {
            greeting += `I'm only ${confidence}% confident about the document type - it might need closer review. `;
        }
        
        if (completeness >= 90) {
            greeting += `The document appears to be ${completeness}% complete, which is excellent! `;
        } else if (completeness >= 70) {
            greeting += `The document is ${completeness}% complete, but there are some missing fields. `;
        } else {
            greeting += `The document is only ${completeness}% complete and needs significant attention. `;
        }
        
        if (context.issues.length > 0) {
            greeting += `I found ${context.issues.length} critical issue(s) that need to be addressed. `;
        } else if (context.warnings.length > 0) {
            greeting += `I found ${context.warnings.length} warning(s) to review. `;
        } else {
            greeting += `The document looks good overall! `;
        }
        
        greeting += `What would you like to know about this document?`;
        
        return greeting;
    }

    /**
     * Generate relevant question suggestions
     */
    generateQuestionSuggestions(documentData) {
        const suggestions = [];
        const docType = documentData?.documentType || 'document';
        
        // Common suggestions
        suggestions.push("What is this document for?");
        suggestions.push("What information is missing?");
        suggestions.push("Is this document valid?");
        
        // Document-specific suggestions
        if (docType.includes('Agreement of Purchase and Sale') || docType.includes('APS')) {
            suggestions.push("What is the purchase price?");
            suggestions.push("When is the closing date?");
            suggestions.push("Who are the parties involved?");
            suggestions.push("What conditions need to be met?");
        } else if (docType.includes('Lease')) {
            suggestions.push("What is the rent amount?");
            suggestions.push("What is the lease term?");
            suggestions.push("What are the tenant responsibilities?");
        } else if (docType.includes('Fee Waiver')) {
            suggestions.push("What is the reason for the fee waiver?");
            suggestions.push("What financial information is required?");
            suggestions.push("Is this request complete?");
        }
        
        return suggestions.slice(0, 4); // Limit to 4 suggestions
    }

    /**
     * Process user question and generate contextual response
     */
    async processQuestion(question, documentData) {
        const context = this.extractDocumentContext(documentData);
        const questionType = this.classifyQuestion(question);
        
        // Record conversation
        this.conversationHistory.push({
            type: 'user',
            question: question,
            timestamp: new Date().toISOString(),
            questionType: questionType
        });
        
        // Generate response
        const response = await this.generateContextualResponse(question, questionType, context, documentData);
        
        // Record AI response
        this.conversationHistory.push({
            type: 'ai',
            response: response,
            timestamp: new Date().toISOString(),
            confidence: response.confidence || 0.8
        });
        
        // Learn from interaction
        this.learnFromInteraction(question, questionType, response, context);
        
        return response;
    }

    /**
     * Classify the type of question being asked
     */
    classifyQuestion(question) {
        const q = question.toLowerCase();
        
        if (q.includes('what') && (q.includes('document') || q.includes('for'))) {
            return 'document_purpose';
        } else if (q.includes('missing') || q.includes('incomplete') || q.includes('complete')) {
            return 'completeness';
        } else if (q.includes('valid') || q.includes('validity') || q.includes('ready')) {
            return 'validity';
        } else if (q.includes('price') || q.includes('cost') || q.includes('amount')) {
            return 'financial';
        } else if (q.includes('date') || q.includes('when') || q.includes('time')) {
            return 'temporal';
        } else if (q.includes('who') || q.includes('party') || q.includes('person')) {
            return 'parties';
        } else if (q.includes('where') || q.includes('address') || q.includes('location')) {
            return 'location';
        } else if (q.includes('how') || q.includes('process') || q.includes('step')) {
            return 'process';
        } else {
            return 'general';
        }
    }

    /**
     * Generate contextual response based on question type and document context
     */
    async generateContextualResponse(question, questionType, context, documentData) {
        let response = '';
        let confidence = 0.8;
        
        switch (questionType) {
            case 'document_purpose':
                response = this.generateDocumentPurposeResponse(context, documentData);
                confidence = 0.9;
                break;
                
            case 'completeness':
                response = this.generateCompletenessResponse(context, documentData);
                confidence = 0.85;
                break;
                
            case 'validity':
                response = this.generateValidityResponse(context, documentData);
                confidence = 0.8;
                break;
                
            case 'financial':
                response = this.generateFinancialResponse(context, documentData);
                confidence = 0.9;
                break;
                
            case 'temporal':
                response = this.generateTemporalResponse(context, documentData);
                confidence = 0.9;
                break;
                
            case 'parties':
                response = this.generatePartiesResponse(context, documentData);
                confidence = 0.9;
                break;
                
            case 'location':
                response = this.generateLocationResponse(context, documentData);
                confidence = 0.9;
                break;
                
            case 'process':
                response = this.generateProcessResponse(context, documentData);
                confidence = 0.8;
                break;
                
            default:
                response = this.generateGeneralResponse(question, context, documentData);
                confidence = 0.7;
        }
        
        return {
            answerMarkdown: response,
            confidence: confidence,
            timestamp: new Date().toISOString(),
            documentType: context.documentType,
            questionType: questionType
        };
    }

    /**
     * Generate response for document purpose questions
     */
    generateDocumentPurposeResponse(context, documentData) {
        const docType = context.documentType;
        let response = `## Document Purpose\n\n`;
        
        if (docType.includes('Agreement of Purchase and Sale') || docType.includes('APS')) {
            response += `This is an **Agreement of Purchase and Sale (APS)** - the foundational document for any real estate transaction. `;
            response += `It outlines the key terms and conditions that both the buyer and seller must agree to, including:\n\n`;
            response += `• **Purchase Price**: The agreed-upon price for the property\n`;
            response += `• **Closing Date**: When the transaction will be completed\n`;
            response += `• **Parties**: Buyer and seller information\n`;
            response += `• **Property Details**: Address and description\n`;
            response += `• **Conditions**: Any conditions that must be met\n\n`;
            response += `Once signed by both parties, this document becomes legally binding and forms the basis for the entire real estate transaction.`;
        } else if (docType.includes('Lease')) {
            response += `This is a **Residential Lease Agreement** that establishes the terms between a landlord and tenant. `;
            response += `It covers rent amount, lease duration, responsibilities, and other important terms for the rental relationship.`;
        } else if (docType.includes('Fee Waiver')) {
            response += `This is a **Fee Waiver Request** - a document used to request exemption from court or administrative fees. `;
            response += `It typically requires demonstrating financial hardship and providing supporting documentation.`;
        } else {
            response += `This is a **${docType}** document. Based on the analysis, it appears to be a legal document `;
            response += `with ${context.completeness.score}% completeness. `;
            response += `I can help you understand its specific purpose and requirements.`;
        }
        
        return response;
    }

    /**
     * Generate response for completeness questions
     */
    generateCompletenessResponse(context, documentData) {
        const completeness = context.completeness;
        let response = `## Document Completeness Analysis\n\n`;
        
        response += `Your document is **${completeness.score}% complete** (${completeness.status}).\n\n`;
        
        if (completeness.presentRequired && completeness.presentRequired.length > 0) {
            response += `**✅ Present Fields:**\n`;
            completeness.presentRequired.forEach(field => {
                response += `• ${field}\n`;
            });
            response += `\n`;
        }
        
        if (completeness.missingRequired && completeness.missingRequired.length > 0) {
            response += `**❌ Missing Required Fields:**\n`;
            completeness.missingRequired.forEach(field => {
                response += `• ${field}\n`;
            });
            response += `\n`;
        }
        
        if (context.issues && context.issues.length > 0) {
            response += `**🚨 Critical Issues:**\n`;
            context.issues.forEach(issue => {
                response += `• ${issue}\n`;
            });
            response += `\n`;
        }
        
        if (context.warnings && context.warnings.length > 0) {
            response += `**⚠️ Warnings:**\n`;
            context.warnings.forEach(warning => {
                response += `• ${warning}\n`;
            });
            response += `\n`;
        }
        
        if (completeness.score >= 90) {
            response += `**Great news!** Your document appears to be nearly complete and ready for use.`;
        } else if (completeness.score >= 70) {
            response += `**Good progress!** Your document is mostly complete but needs a few more fields filled in.`;
        } else {
            response += `**Needs attention!** Your document is missing several important fields that should be completed.`;
        }
        
        return response;
    }

    /**
     * Generate response for validity questions
     */
    generateValidityResponse(context, documentData) {
        const validity = context.validity;
        let response = `## Document Validity Assessment\n\n`;
        
        response += `**Status**: ${validity.status}\n`;
        response += `**Score**: ${validity.score}%\n\n`;
        
        if (validity.issues && validity.issues.length === 0 && validity.warnings && validity.warnings.length === 0) {
            response += `✅ **Excellent!** Your document appears to be valid with no issues or warnings. `;
            response += `It should be ready for the next steps in your process.`;
        } else {
            if (validity.issues && validity.issues.length > 0) {
                response += `🚨 **Critical Issues Found:**\n`;
                validity.issues.forEach(issue => {
                    response += `• ${issue}\n`;
                });
                response += `\n`;
            }
            
            if (validity.warnings && validity.warnings.length > 0) {
                response += `⚠️ **Warnings:**\n`;
                validity.warnings.forEach(warning => {
                    response += `• ${warning}\n`;
                });
                response += `\n`;
            }
            
            response += `**Recommendation**: Address the issues above before proceeding with this document.`;
        }
        
        return response;
    }

    /**
     * Generate response for financial questions
     */
    generateFinancialResponse(context, documentData) {
        const fields = context.keyFields;
        let response = `## Financial Information\n\n`;
        
        if (fields.purchasePrice) {
            response += `**Purchase Price**: ${fields.purchasePrice}\n\n`;
        }
        
        if (fields.depositAmount) {
            response += `**Deposit Amount**: ${fields.depositAmount}\n\n`;
        }
        
        if (fields.rentAmount) {
            response += `**Rent Amount**: ${fields.rentAmount}\n\n`;
        }
        
        if (!fields.purchasePrice && !fields.depositAmount && !fields.rentAmount) {
            response += `I don't see any financial information in this document. `;
            response += `This might be because the document type doesn't typically contain financial details, `;
            response += `or the information wasn't extracted properly.`;
        }
        
        return response;
    }

    /**
     * Generate response for temporal questions
     */
    generateTemporalResponse(context, documentData) {
        const fields = context.keyFields;
        let response = `## Important Dates\n\n`;
        
        if (fields.issueDate) {
            response += `**Issue Date**: ${fields.issueDate}\n`;
        }
        
        if (fields.expiryDate) {
            response += `**Expiry Date**: ${fields.expiryDate}\n`;
        }
        
        if (fields.closingDate) {
            response += `**Closing Date**: ${fields.closingDate}\n`;
        }
        
        if (fields.leaseStartDate) {
            response += `**Lease Start Date**: ${fields.leaseStartDate}\n`;
        }
        
        if (fields.leaseEndDate) {
            response += `**Lease End Date**: ${fields.leaseEndDate}\n`;
        }
        
        if (!fields.issueDate && !fields.expiryDate && !fields.closingDate) {
            response += `I don't see any specific dates in this document. `;
            response += `This might be because the document type doesn't typically contain date information, `;
            response += `or the dates weren't extracted properly.`;
        }
        
        return response;
    }

    /**
     * Generate response for parties questions
     */
    generatePartiesResponse(context, documentData) {
        const fields = context.keyFields;
        let response = `## Parties Involved\n\n`;
        
        if (fields.buyerName) {
            response += `**Buyer**: ${fields.buyerName}\n`;
        }
        
        if (fields.sellerName) {
            response += `**Seller**: ${fields.sellerName}\n`;
        }
        
        if (fields.tenantName) {
            response += `**Tenant**: ${fields.tenantName}\n`;
        }
        
        if (fields.landlordName) {
            response += `**Landlord**: ${fields.landlordName}\n`;
        }
        
        if (fields.applicantName) {
            response += `**Applicant**: ${fields.applicantName}\n`;
        }
        
        if (!fields.buyerName && !fields.sellerName && !fields.tenantName && !fields.landlordName) {
            response += `I don't see any party information in this document. `;
            response += `This might be because the document type doesn't typically contain party details, `;
            response += `or the information wasn't extracted properly.`;
        }
        
        return response;
    }

    /**
     * Generate response for location questions
     */
    generateLocationResponse(context, documentData) {
        const fields = context.keyFields;
        let response = `## Property Information\n\n`;
        
        if (fields.propertyAddress) {
            response += `**Property Address**: ${fields.propertyAddress}\n`;
        }
        
        if (!fields.propertyAddress) {
            response += `I don't see any property address information in this document. `;
            response += `This might be because the document type doesn't typically contain location details, `;
            response += `or the information wasn't extracted properly.`;
        }
        
        return response;
    }

    /**
     * Generate response for process questions
     */
    generateProcessResponse(context, documentData) {
        const docType = context.documentType;
        let response = `## Next Steps\n\n`;
        
        if (docType.includes('Agreement of Purchase and Sale') || docType.includes('APS')) {
            response += `For an **Agreement of Purchase and Sale**, here are the typical next steps:\n\n`;
            response += `1. **Review all conditions** in Schedule A\n`;
            response += `2. **Ensure all parties sign** the document\n`;
            response += `3. **Submit to lawyer** for legal review\n`;
            response += `4. **Meet all conditions** before closing date\n`;
            response += `5. **Prepare for closing** with all required documents\n\n`;
            response += `**Important**: This document becomes legally binding once signed by both parties.`;
        } else if (docType.includes('Lease')) {
            response += `For a **Lease Agreement**, here are the typical next steps:\n\n`;
            response += `1. **Review all terms** carefully\n`;
            response += `2. **Ensure both parties sign** the agreement\n`;
            response += `3. **Collect security deposit** if required\n`;
            response += `4. **Provide keys** on move-in date\n`;
            response += `5. **Set up utilities** in tenant's name\n\n`;
            response += `**Important**: Both parties should keep a signed copy of the lease.`;
        } else {
            response += `For this **${docType}**, I recommend:\n\n`;
            response += `1. **Review the document** for completeness\n`;
            response += `2. **Address any missing fields** identified in the analysis\n`;
            response += `3. **Consult with a professional** if needed\n`;
            response += `4. **Submit according to requirements**\n\n`;
            response += `**Note**: The specific process may vary depending on the document type and jurisdiction.`;
        }
        
        return response;
    }

    /**
     * Generate general response for unclear questions
     */
    generateGeneralResponse(question, context, documentData) {
        let response = `## Answer to Your Question\n\n`;
        
        response += `I understand you're asking: "${question}"\n\n`;
        
        response += `Based on your **${context.documentType}** document, I can help you with:\n\n`;
        response += `• **Document purpose** and what it's used for\n`;
        response += `• **Missing information** that needs to be filled in\n`;
        response += `• **Validity status** and any issues found\n`;
        response += `• **Specific details** like dates, amounts, or parties\n`;
        response += `• **Next steps** in your process\n\n`;
        
        response += `Could you be more specific about what you'd like to know? `;
        response += `For example, you could ask "What is the purchase price?" or "What information is missing?"`;
        
        return response;
    }

    /**
     * Learn from user interaction
     */
    learnFromInteraction(question, questionType, response, context) {
        // Update learning data
        this.learningData.totalConversations++;
        this.learningData.totalQuestions++;
        
        // Track question patterns
        if (!this.learningData.questionPatterns.has(questionType)) {
            this.learningData.questionPatterns.set(questionType, 0);
        }
        this.learningData.questionPatterns.set(questionType, 
            this.learningData.questionPatterns.get(questionType) + 1);
        
        // Track document type patterns
        const docType = context.documentType;
        if (!this.learningData.documentTypePatterns.has(docType)) {
            this.learningData.documentTypePatterns.set(docType, 0);
        }
        this.learningData.documentTypePatterns.set(docType, 
            this.learningData.documentTypePatterns.get(docType) + 1);
        
        // Store successful responses for future reference
        const responseKey = `${questionType}_${docType}`;
        if (!this.learningData.successfulResponses.has(responseKey)) {
            this.learningData.successfulResponses.set(responseKey, []);
        }
        this.learningData.successfulResponses.get(responseKey).push({
            question: question,
            response: response.answerMarkdown,
            confidence: response.confidence,
            timestamp: new Date().toISOString()
        });
        
        console.log(`🧠 Learned from interaction: ${questionType} for ${docType}`);
    }

    /**
     * Record user feedback
     */
    recordFeedback(feedback, question, response) {
        this.learningData.userFeedback.push({
            feedback: feedback,
            question: question,
            response: response,
            timestamp: new Date().toISOString()
        });
        
        if (feedback === 'helpful') {
            this.learningData.successfulAnswers++;
        }
        
        console.log(`👍 Recorded feedback: ${feedback}`);
    }

    /**
     * Get learning statistics
     */
    getLearningStats() {
        return {
            totalConversations: this.learningData.totalConversations,
            totalQuestions: this.learningData.totalQuestions,
            successfulAnswers: this.learningData.successfulAnswers,
            accuracy: this.learningData.totalQuestions > 0 ? 
                this.learningData.successfulAnswers / this.learningData.totalQuestions : 0,
            documentTypes: Array.from(this.learningData.documentTypePatterns.keys()),
            questionTypes: Array.from(this.learningData.questionPatterns.keys()),
            totalFeedback: this.learningData.userFeedback.length
        };
    }

    /**
     * Get conversation history
     */
    getConversationHistory() {
        return this.conversationHistory;
    }

    /**
     * Clear conversation history
     */
    clearConversation() {
        this.conversationHistory = [];
        this.currentDocument = null;
    }
}

// Make it available globally
window.EnhancedChatSystem = EnhancedChatSystem;
