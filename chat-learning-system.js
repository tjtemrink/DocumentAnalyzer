/**
 * Chat Learning System - Records and learns from all user interactions
 * Improves AI responses over time based on conversation history
 */

class ChatLearningSystem {
    constructor() {
        this.conversations = new Map(); // conversationId -> conversation data
        this.userPatterns = new Map(); // userId -> user question patterns
        this.responsePatterns = new Map(); // questionType -> successful responses
        this.learningData = {
            totalConversations: 0,
            totalMessages: 0,
            totalQuestions: 0,
            successfulAnswers: 0,
            userFeedback: [],
            commonQuestions: new Map(),
            responseImprovements: []
        };
        this.currentConversationId = null;
        this.currentUserId = null;
    }

    /**
     * Start a new conversation
     */
    startConversation(userId = 'anonymous', documentData = null) {
        const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.currentConversationId = conversationId;
        this.currentUserId = userId;
        
        const conversation = {
            id: conversationId,
            userId: userId,
            documentData: documentData,
            messages: [],
            startTime: new Date().toISOString(),
            endTime: null,
            totalMessages: 0,
            userSatisfaction: null,
            learningInsights: {
                questionTypes: [],
                successfulPatterns: [],
                failedPatterns: [],
                userPreferences: []
            }
        };
        
        this.conversations.set(conversationId, conversation);
        this.learningData.totalConversations++;
        
        console.log(`💬 Started new conversation: ${conversationId} for user: ${userId}`);
        return conversationId;
    }

    /**
     * Record a user message
     */
    recordUserMessage(message, questionType = 'general') {
        if (!this.currentConversationId) {
            this.startConversation();
        }
        
        const conversation = this.conversations.get(this.currentConversationId);
        if (!conversation) return;
        
        const messageData = {
            type: 'user',
            content: message,
            questionType: questionType,
            timestamp: new Date().toISOString(),
            messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
        };
        
        conversation.messages.push(messageData);
        conversation.totalMessages++;
        this.learningData.totalMessages++;
        this.learningData.totalQuestions++;
        
        // Track question patterns
        this.trackQuestionPattern(message, questionType);
        
        // Update common questions
        this.updateCommonQuestions(message, questionType);
        
        console.log(`📝 Recorded user message: "${message}" (${questionType})`);
        return messageData;
    }

    /**
     * Record an AI response
     */
    recordAIResponse(response, confidence = 0.8, responseType = 'answer') {
        if (!this.currentConversationId) return;
        
        const conversation = this.conversations.get(this.currentConversationId);
        if (!conversation) return;
        
        const responseData = {
            type: 'ai',
            content: response,
            confidence: confidence,
            responseType: responseType,
            timestamp: new Date().toISOString(),
            messageId: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
        };
        
        conversation.messages.push(responseData);
        conversation.totalMessages++;
        
        // Track successful responses
        if (confidence > 0.7) {
            this.learningData.successfulAnswers++;
            this.trackSuccessfulResponse(response, responseType);
        }
        
        console.log(`🤖 Recorded AI response: "${response.substring(0, 50)}..." (confidence: ${confidence})`);
        return responseData;
    }

    /**
     * Record user feedback
     */
    recordUserFeedback(feedback, messageId = null) {
        if (!this.currentConversationId) return;
        
        const feedbackData = {
            type: 'feedback',
            feedback: feedback, // 'helpful', 'not_helpful', 'accurate', 'inaccurate'
            messageId: messageId,
            timestamp: new Date().toISOString(),
            conversationId: this.currentConversationId
        };
        
        this.learningData.userFeedback.push(feedbackData);
        
        // Update conversation satisfaction
        const conversation = this.conversations.get(this.currentConversationId);
        if (conversation) {
            conversation.userSatisfaction = feedback;
        }
        
        // Learn from feedback
        this.learnFromFeedback(feedbackData);
        
        console.log(`👍 Recorded user feedback: ${feedback}`);
        return feedbackData;
    }

    /**
     * Track question patterns for learning
     */
    trackQuestionPattern(question, questionType) {
        if (!this.userPatterns.has(this.currentUserId)) {
            this.userPatterns.set(this.currentUserId, {
                questionTypes: new Map(),
                commonPhrases: new Map(),
                questionComplexity: [],
                preferredResponseStyle: []
            });
        }
        
        const userData = this.userPatterns.get(this.currentUserId);
        
        // Track question types
        const currentCount = userData.questionTypes.get(questionType) || 0;
        userData.questionTypes.set(questionType, currentCount + 1);
        
        // Extract common phrases
        const words = question.toLowerCase().split(/\s+/);
        words.forEach(word => {
            if (word.length > 3) { // Only track meaningful words
                const currentCount = userData.commonPhrases.get(word) || 0;
                userData.commonPhrases.set(word, currentCount + 1);
            }
        });
        
        // Track question complexity
        userData.questionComplexity.push({
            length: question.length,
            wordCount: words.length,
            hasQuestionMark: question.includes('?'),
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Track successful responses for pattern learning
     */
    trackSuccessfulResponse(response, responseType) {
        if (!this.responsePatterns.has(responseType)) {
            this.responsePatterns.set(responseType, []);
        }
        
        this.responsePatterns.get(responseType).push({
            response: response,
            timestamp: new Date().toISOString(),
            success: true
        });
        
        // Keep only last 100 responses per type
        const responses = this.responsePatterns.get(responseType);
        if (responses.length > 100) {
            this.responsePatterns.set(responseType, responses.slice(-100));
        }
    }

    /**
     * Update common questions tracking
     */
    updateCommonQuestions(question, questionType) {
        const normalizedQuestion = question.toLowerCase().trim();
        const currentCount = this.learningData.commonQuestions.get(normalizedQuestion) || 0;
        this.learningData.commonQuestions.set(normalizedQuestion, currentCount + 1);
        
        // Keep only top 50 most common questions
        if (this.learningData.commonQuestions.size > 50) {
            const sorted = Array.from(this.learningData.commonQuestions.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 50);
            this.learningData.commonQuestions = new Map(sorted);
        }
    }

    /**
     * Learn from user feedback
     */
    learnFromFeedback(feedbackData) {
        const { feedback, messageId } = feedbackData;
        
        if (feedback === 'helpful' || feedback === 'accurate') {
            // Positive feedback - strengthen patterns
            this.strengthenResponsePatterns(messageId);
        } else if (feedback === 'not_helpful' || feedback === 'inaccurate') {
            // Negative feedback - identify improvement areas
            this.identifyImprovementAreas(messageId);
        }
    }

    /**
     * Strengthen response patterns based on positive feedback
     */
    strengthenResponsePatterns(messageId) {
        // Find the response that received positive feedback
        const conversation = this.conversations.get(this.currentConversationId);
        if (!conversation) return;
        
        const response = conversation.messages.find(msg => msg.messageId === messageId);
        if (response && response.type === 'ai') {
            // Mark this response pattern as successful
            const responseType = response.responseType || 'answer';
            if (!this.responsePatterns.has(responseType)) {
                this.responsePatterns.set(responseType, []);
            }
            
            this.responsePatterns.get(responseType).push({
                response: response.content,
                timestamp: new Date().toISOString(),
                success: true,
                userFeedback: 'positive'
            });
        }
    }

    /**
     * Identify improvement areas based on negative feedback
     */
    identifyImprovementAreas(messageId) {
        const conversation = this.conversations.get(this.currentConversationId);
        if (!conversation) return;
        
        const response = conversation.messages.find(msg => msg.messageId === messageId);
        if (response && response.type === 'ai') {
            // Record this as a failed pattern
            this.learningData.responseImprovements.push({
                messageId: messageId,
                response: response.content,
                issue: 'User found response unhelpful',
                timestamp: new Date().toISOString(),
                conversationId: this.currentConversationId
            });
        }
    }

    /**
     * Generate improved response based on learning
     */
    generateImprovedResponse(question, questionType = 'general') {
        // Get user's question patterns
        const userData = this.userPatterns.get(this.currentUserId);
        const userPreferences = userData ? this.analyzeUserPreferences(userData) : {};
        
        // Get successful response patterns for this question type
        const successfulPatterns = this.responsePatterns.get(questionType) || [];
        const recentSuccessful = successfulPatterns
            .filter(p => p.success)
            .slice(-10); // Last 10 successful responses
        
        // Get common questions similar to this one
        const similarQuestions = this.findSimilarQuestions(question);
        
        // Generate response based on learning
        const improvedResponse = this.buildResponseFromLearning(
            question,
            questionType,
            userPreferences,
            recentSuccessful,
            similarQuestions
        );
        
        return improvedResponse;
    }

    /**
     * Analyze user preferences from their question patterns
     */
    analyzeUserPreferences(userData) {
        const preferences = {
            preferredLength: 'medium',
            technicalLevel: 'intermediate',
            responseStyle: 'conversational',
            detailLevel: 'moderate'
        };
        
        // Analyze question complexity
        const avgComplexity = userData.questionComplexity.reduce((sum, q) => sum + q.wordCount, 0) / userData.questionComplexity.length;
        if (avgComplexity > 15) preferences.detailLevel = 'high';
        if (avgComplexity < 5) preferences.detailLevel = 'low';
        
        // Analyze common phrases for technical level
        const technicalWords = ['legal', 'jurisdiction', 'validity', 'compliance', 'regulation'];
        const hasTechnicalTerms = Array.from(userData.commonPhrases.keys())
            .some(phrase => technicalWords.some(term => phrase.includes(term)));
        
        if (hasTechnicalTerms) preferences.technicalLevel = 'advanced';
        
        return preferences;
    }

    /**
     * Find similar questions in the learning data
     */
    findSimilarQuestions(question) {
        const normalizedQuestion = question.toLowerCase();
        const similar = [];
        
        for (const [storedQuestion, count] of this.learningData.commonQuestions) {
            const similarity = this.calculateSimilarity(normalizedQuestion, storedQuestion);
            if (similarity > 0.6) {
                similar.push({
                    question: storedQuestion,
                    count: count,
                    similarity: similarity
                });
            }
        }
        
        return similar.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
    }

    /**
     * Calculate similarity between two strings
     */
    calculateSimilarity(str1, str2) {
        const words1 = str1.split(/\s+/);
        const words2 = str2.split(/\s+/);
        const intersection = words1.filter(word => words2.includes(word));
        const union = [...new Set([...words1, ...words2])];
        
        return intersection.length / union.length;
    }

    /**
     * Build response from learning data
     */
    buildResponseFromLearning(question, questionType, userPreferences, successfulPatterns, similarQuestions) {
        let response = '';
        
        // Start with a base response structure
        if (userPreferences.detailLevel === 'high') {
            response += '### Detailed Analysis\n\n';
        } else if (userPreferences.detailLevel === 'low') {
            response += '### Quick Answer\n\n';
        } else {
            response += '### Answer\n\n';
        }
        
        // Use successful patterns if available
        if (successfulPatterns.length > 0) {
            const bestPattern = successfulPatterns[Math.floor(Math.random() * Math.min(3, successfulPatterns.length))];
            response += bestPattern.response;
        } else {
            // Fallback to basic response
            response += this.generateBasicResponse(question, questionType);
        }
        
        // Add learning-based improvements
        if (similarQuestions.length > 0) {
            response += '\n\n### Related Information\n\n';
            response += 'Based on similar questions, here are additional insights...';
        }
        
        return response;
    }

    /**
     * Generate basic response when no learning data is available
     */
    generateBasicResponse(question, questionType) {
        const responses = {
            'general': 'I understand your question. Let me provide you with the most relevant information based on your document.',
            'validity': 'Based on the document analysis, I can help you understand the validity requirements.',
            'completeness': 'I can help you identify what information might be missing from your document.',
            'legal': 'Let me provide you with the legal context and requirements for your document type.'
        };
        
        return responses[questionType] || responses['general'];
    }

    /**
     * Get learning statistics
     */
    getLearningStats() {
        const totalFeedback = this.learningData.userFeedback.length;
        const positiveFeedback = this.learningData.userFeedback.filter(f => 
            f.feedback === 'helpful' || f.feedback === 'accurate'
        ).length;
        
        const satisfactionRate = totalFeedback > 0 ? (positiveFeedback / totalFeedback) * 100 : 0;
        
        return {
            totalConversations: this.learningData.totalConversations,
            totalMessages: this.learningData.totalMessages,
            totalQuestions: this.learningData.totalQuestions,
            successfulAnswers: this.learningData.successfulAnswers,
            satisfactionRate: Math.round(satisfactionRate),
            commonQuestionsCount: this.learningData.commonQuestions.size,
            responsePatternsCount: Array.from(this.responsePatterns.values()).reduce((sum, patterns) => sum + patterns.length, 0),
            activeUsers: this.userPatterns.size,
            averageMessagesPerConversation: this.learningData.totalConversations > 0 ? 
                Math.round(this.learningData.totalMessages / this.learningData.totalConversations) : 0
        };
    }

    /**
     * Get conversation history for a user
     */
    getUserConversationHistory(userId) {
        const userConversations = Array.from(this.conversations.values())
            .filter(conv => conv.userId === userId)
            .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        
        return userConversations;
    }

    /**
     * Get learning insights
     */
    getLearningInsights() {
        const insights = {
            mostCommonQuestions: Array.from(this.learningData.commonQuestions.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10),
            mostSuccessfulResponseTypes: Array.from(this.responsePatterns.entries())
                .map(([type, patterns]) => ({
                    type: type,
                    count: patterns.length,
                    successRate: patterns.filter(p => p.success).length / patterns.length
                }))
                .sort((a, b) => b.successRate - a.successRate),
            userEngagement: {
                totalUsers: this.userPatterns.size,
                averageQuestionsPerUser: this.userPatterns.size > 0 ? 
                    Math.round(this.learningData.totalQuestions / this.userPatterns.size) : 0
            }
        };
        
        return insights;
    }

    /**
     * Export learning data for analysis
     */
    exportLearningData() {
        return {
            conversations: Array.from(this.conversations.values()),
            learningData: this.learningData,
            userPatterns: Array.from(this.userPatterns.entries()),
            responsePatterns: Array.from(this.responsePatterns.entries()),
            exportTimestamp: new Date().toISOString()
        };
    }

    /**
     * End current conversation
     */
    endConversation() {
        if (!this.currentConversationId) return;
        
        const conversation = this.conversations.get(this.currentConversationId);
        if (conversation) {
            conversation.endTime = new Date().toISOString();
            
            // Generate conversation insights
            conversation.learningInsights = this.generateConversationInsights(conversation);
        }
        
        this.currentConversationId = null;
        this.currentUserId = null;
        
        console.log(`💬 Ended conversation: ${conversation.id}`);
    }

    /**
     * Generate insights for a specific conversation
     */
    generateConversationInsights(conversation) {
        const questionTypes = conversation.messages
            .filter(msg => msg.type === 'user')
            .map(msg => msg.questionType);
        
        const successfulResponses = conversation.messages
            .filter(msg => msg.type === 'ai' && msg.confidence > 0.7)
            .length;
        
        return {
            questionTypes: [...new Set(questionTypes)],
            successfulPatterns: successfulResponses,
            failedPatterns: conversation.messages.length - successfulResponses,
            userPreferences: this.analyzeUserPreferences(
                this.userPatterns.get(conversation.userId) || { questionTypes: new Map(), commonPhrases: new Map(), questionComplexity: [] }
            )
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatLearningSystem;
} else {
    window.ChatLearningSystem = ChatLearningSystem;
}
