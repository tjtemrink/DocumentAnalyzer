/**
 * Field Status Dashboard
 * Shows real field analysis with true/false status for each field
 */

class FieldStatusDashboard {
    constructor() {
        this.container = null;
        this.currentDocumentId = null;
    }

    /**
     * Initialize the dashboard
     */
    initialize(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Field Status Dashboard container not found:', containerId);
            return;
        }
        
        this.renderDashboard();
        console.log('📊 Field Status Dashboard initialized');
    }

    /**
     * Render the dashboard
     */
    renderDashboard() {
        this.container.innerHTML = `
            <div class="field-status-dashboard">
                <h3>📊 Real Field Analysis</h3>
                <div class="dashboard-stats">
                    <div class="stat-item">
                        <div class="stat-value" id="totalDocuments">0</div>
                        <div class="stat-label">Documents Analyzed</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="overallCompletion">0%</div>
                        <div class="stat-label">Overall Completion</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="filledFields">0</div>
                        <div class="stat-label">Filled Fields</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="emptyFields">0</div>
                        <div class="stat-label">Empty Fields</div>
                    </div>
                </div>
                
                <div class="field-analysis-section">
                    <h4>🔍 Current Document Field Status</h4>
                    <div id="currentDocumentFields" class="field-list">
                        <p class="no-data">No document analyzed yet</p>
                    </div>
                </div>
                
                <div class="field-completion-section">
                    <h4>📈 Field Completion Statistics</h4>
                    <div id="fieldCompletionStats" class="completion-stats">
                        <p class="no-data">No data available</p>
                    </div>
                </div>
                
                <div class="document-history-section">
                    <h4>📚 Document Analysis History</h4>
                    <div id="documentHistory" class="document-history">
                        <p class="no-data">No documents in history</p>
                    </div>
                </div>
            </div>
        `;
        
        // Add CSS styles
        this.addStyles();
    }

    /**
     * Add CSS styles for the dashboard
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .field-status-dashboard {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                border-left: 4px solid #007bff;
            }
            
            .dashboard-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }
            
            .stat-item {
                background: white;
                padding: 15px;
                border-radius: 6px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .stat-value {
                font-size: 24px;
                font-weight: bold;
                color: #007bff;
                margin-bottom: 5px;
            }
            
            .stat-label {
                font-size: 12px;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .field-list {
                background: white;
                border-radius: 6px;
                padding: 15px;
                margin: 15px 0;
            }
            
            .field-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                margin: 5px 0;
                border-radius: 4px;
                border-left: 4px solid #ddd;
            }
            
            .field-item.filled {
                background: #d4edda;
                border-left-color: #28a745;
            }
            
            .field-item.empty {
                background: #f8d7da;
                border-left-color: #dc3545;
            }
            
            .field-name {
                font-weight: bold;
                color: #333;
            }
            
            .field-value {
                font-size: 12px;
                color: #666;
                max-width: 200px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .field-status {
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: bold;
                text-transform: uppercase;
            }
            
            .field-status.filled {
                background: #28a745;
                color: white;
            }
            
            .field-status.empty {
                background: #dc3545;
                color: white;
            }
            
            .completion-stats {
                background: white;
                border-radius: 6px;
                padding: 15px;
                margin: 15px 0;
            }
            
            .completion-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            
            .completion-item:last-child {
                border-bottom: none;
            }
            
            .field-name {
                font-weight: 500;
                color: #333;
            }
            
            .completion-bar {
                flex: 1;
                height: 8px;
                background: #e9ecef;
                border-radius: 4px;
                margin: 0 10px;
                overflow: hidden;
            }
            
            .completion-fill {
                height: 100%;
                background: linear-gradient(90deg, #dc3545 0%, #ffc107 50%, #28a745 100%);
                transition: width 0.3s ease;
            }
            
            .completion-percentage {
                font-size: 12px;
                font-weight: bold;
                color: #666;
                min-width: 40px;
                text-align: right;
            }
            
            .document-history {
                background: white;
                border-radius: 6px;
                padding: 15px;
                margin: 15px 0;
                max-height: 300px;
                overflow-y: auto;
            }
            
            .document-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                margin: 5px 0;
                border-radius: 4px;
                background: #f8f9fa;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            
            .document-item:hover {
                background: #e9ecef;
            }
            
            .document-info {
                flex: 1;
            }
            
            .document-name {
                font-weight: bold;
                color: #333;
            }
            
            .document-meta {
                font-size: 12px;
                color: #666;
            }
            
            .document-completion {
                text-align: right;
            }
            
            .completion-score {
                font-size: 16px;
                font-weight: bold;
                color: #007bff;
            }
            
            .no-data {
                text-align: center;
                color: #666;
                font-style: italic;
                padding: 20px;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Update dashboard with field analysis data
     */
    updateFieldAnalysis(fieldAnalysis) {
        if (!this.container) return;
        
        this.currentDocumentId = fieldAnalysis.id;
        
        // Update current document fields
        this.updateCurrentDocumentFields(fieldAnalysis);
        
        // Update overall statistics
        this.updateOverallStatistics();
        
        // Update field completion statistics
        this.updateFieldCompletionStats();
        
        // Update document history
        this.updateDocumentHistory();
    }

    /**
     * Update current document fields display
     */
    updateCurrentDocumentFields(fieldAnalysis) {
        const fieldsContainer = document.getElementById('currentDocumentFields');
        if (!fieldsContainer) return;
        
        if (!fieldAnalysis.fields || fieldAnalysis.fields.size === 0) {
            fieldsContainer.innerHTML = '<p class="no-data">No fields analyzed</p>';
            return;
        }
        
        let fieldsHtml = '';
        for (const [fieldName, fieldData] of fieldAnalysis.fields) {
            const isFilled = fieldData.isFilled;
            const statusClass = isFilled ? 'filled' : 'empty';
            const statusText = isFilled ? 'FILLED' : 'EMPTY';
            
            fieldsHtml += `
                <div class="field-item ${statusClass}">
                    <div class="field-info">
                        <div class="field-name">${fieldName}</div>
                        <div class="field-value">${fieldData.value || 'No value'}</div>
                    </div>
                    <div class="field-status ${statusClass}">${statusText}</div>
                </div>
            `;
        }
        
        fieldsContainer.innerHTML = fieldsHtml;
    }

    /**
     * Update overall statistics
     */
    updateOverallStatistics() {
        try {
            const existingData = JSON.parse(localStorage.getItem('documentAnalysis') || '[]');
            
            let totalDocuments = existingData.length;
            let totalFields = 0;
            let filledFields = 0;
            
            for (const doc of existingData) {
                for (const [fieldName, isFilled] of Object.entries(doc.fieldStatus)) {
                    totalFields++;
                    if (isFilled) filledFields++;
                }
            }
            
            const overallCompletion = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
            const emptyFields = totalFields - filledFields;
            
            document.getElementById('totalDocuments').textContent = totalDocuments;
            document.getElementById('overallCompletion').textContent = overallCompletion + '%';
            document.getElementById('filledFields').textContent = filledFields;
            document.getElementById('emptyFields').textContent = emptyFields;
            
        } catch (error) {
            console.error('Error updating overall statistics:', error);
        }
    }

    /**
     * Update field completion statistics
     */
    updateFieldCompletionStats() {
        const statsContainer = document.getElementById('fieldCompletionStats');
        if (!statsContainer) return;
        
        try {
            const existingData = JSON.parse(localStorage.getItem('documentAnalysis') || '[]');
            const fieldStats = {};
            
            // Calculate field statistics
            for (const doc of existingData) {
                for (const [fieldName, isFilled] of Object.entries(doc.fieldStatus)) {
                    if (!fieldStats[fieldName]) {
                        fieldStats[fieldName] = { total: 0, filled: 0 };
                    }
                    fieldStats[fieldName].total++;
                    if (isFilled) {
                        fieldStats[fieldName].filled++;
                    }
                }
            }
            
            if (Object.keys(fieldStats).length === 0) {
                statsContainer.innerHTML = '<p class="no-data">No field statistics available</p>';
                return;
            }
            
            let statsHtml = '';
            for (const [fieldName, stats] of Object.entries(fieldStats)) {
                const percentage = Math.round((stats.filled / stats.total) * 100);
                const width = percentage;
                
                statsHtml += `
                    <div class="completion-item">
                        <div class="field-name">${fieldName}</div>
                        <div class="completion-bar">
                            <div class="completion-fill" style="width: ${width}%"></div>
                        </div>
                        <div class="completion-percentage">${percentage}%</div>
                    </div>
                `;
            }
            
            statsContainer.innerHTML = statsHtml;
            
        } catch (error) {
            console.error('Error updating field completion stats:', error);
            statsContainer.innerHTML = '<p class="no-data">Error loading statistics</p>';
        }
    }

    /**
     * Update document history
     */
    updateDocumentHistory() {
        const historyContainer = document.getElementById('documentHistory');
        if (!historyContainer) return;
        
        try {
            const existingData = JSON.parse(localStorage.getItem('documentAnalysis') || '[]');
            
            if (existingData.length === 0) {
                historyContainer.innerHTML = '<p class="no-data">No documents in history</p>';
                return;
            }
            
            // Sort by timestamp (newest first)
            existingData.sort((a, b) => new Date(b.analysisTimestamp) - new Date(a.analysisTimestamp));
            
            let historyHtml = '';
            for (const doc of existingData) {
                const totalFields = Object.keys(doc.fieldStatus).length;
                const filledFields = Object.values(doc.fieldStatus).filter(status => status).length;
                const completionScore = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
                
                const date = new Date(doc.analysisTimestamp).toLocaleDateString();
                const time = new Date(doc.analysisTimestamp).toLocaleTimeString();
                
                historyHtml += `
                    <div class="document-item" onclick="showDocumentDetails('${doc.id}')">
                        <div class="document-info">
                            <div class="document-name">${doc.documentType}</div>
                            <div class="document-meta">${date} at ${time}</div>
                        </div>
                        <div class="document-completion">
                            <div class="completion-score">${completionScore}%</div>
                            <div class="document-meta">${filledFields}/${totalFields} fields</div>
                        </div>
                    </div>
                `;
            }
            
            historyContainer.innerHTML = historyHtml;
            
        } catch (error) {
            console.error('Error updating document history:', error);
            historyContainer.innerHTML = '<p class="no-data">Error loading history</p>';
        }
    }

    /**
     * Show document details
     */
    showDocumentDetails(documentId) {
        try {
            const existingData = JSON.parse(localStorage.getItem('documentAnalysis') || '[]');
            const doc = existingData.find(d => d.id === documentId);
            
            if (doc) {
                this.updateCurrentDocumentFields(doc);
                console.log('📄 Showing details for document:', doc.id);
            }
        } catch (error) {
            console.error('Error showing document details:', error);
        }
    }

    /**
     * Clear all data
     */
    clearAllData() {
        localStorage.removeItem('documentAnalysis');
        this.renderDashboard();
        console.log('🗑️ All field analysis data cleared');
    }
}

// Make it available globally
window.FieldStatusDashboard = FieldStatusDashboard;
