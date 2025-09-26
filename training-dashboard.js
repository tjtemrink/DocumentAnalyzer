/**
 * Training Dashboard - Real-time training progress and analytics
 */

class TrainingDashboard {
    constructor() {
        this.dashboardElement = null;
        this.isVisible = false;
        this.updateInterval = null;
        this.trainingSystem = null;
    }

    /**
     * Initialize the training dashboard
     */
    initialize(trainingSystem) {
        this.trainingSystem = trainingSystem;
        this.createDashboardElement();
        this.attachToPage();
        this.startAutoUpdate();
    }

    /**
     * Create the dashboard HTML element
     */
    createDashboardElement() {
        this.dashboardElement = document.createElement('div');
        this.dashboardElement.id = 'training-dashboard';
        this.dashboardElement.className = 'training-dashboard';
        this.dashboardElement.innerHTML = `
            <div class="dashboard-header">
                <h3>🤖 AI Training Dashboard</h3>
                <button id="toggle-dashboard" class="toggle-btn">Hide</button>
            </div>
            <div class="dashboard-content">
                <div class="training-status">
                    <div class="status-indicator" id="status-indicator">
                        <span class="status-dot"></span>
                        <span id="status-text">Ready</span>
                    </div>
                </div>
                
                <div class="progress-section">
                    <h4>Training Progress</h4>
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                    <div class="progress-text" id="progress-text">0% Complete</div>
                </div>
                
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value" id="total-documents">0</div>
                        <div class="metric-label">Total Documents</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="processed-documents">0</div>
                        <div class="metric-label">Processed</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="current-pass">0</div>
                        <div class="metric-label">Current Pass</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="errors-found">0</div>
                        <div class="metric-label">Errors Found</div>
                    </div>
                </div>
                
                <div class="accuracy-section">
                    <h4>Accuracy Metrics</h4>
                    <div class="accuracy-chart">
                        <div class="accuracy-bar">
                            <div class="accuracy-fill" id="accuracy-fill"></div>
                        </div>
                        <div class="accuracy-text" id="accuracy-text">0%</div>
                    </div>
                </div>
                
                <div class="error-analysis">
                    <h4>Error Analysis</h4>
                    <div class="error-list" id="error-list">
                        <div class="no-errors">No errors detected</div>
                    </div>
                </div>
                
                <div class="pattern-refinements">
                    <h4>Pattern Refinements</h4>
                    <div class="refinement-list" id="refinement-list">
                        <div class="no-refinements">No refinements yet</div>
                    </div>
                </div>
                
                <div class="training-controls">
                    <button id="start-training" class="btn-primary">Start Training</button>
                    <button id="stop-training" class="btn-secondary" disabled>Stop Training</button>
                    <button id="view-details" class="btn-outline">View Details</button>
                </div>
            </div>
        `;
    }

    /**
     * Attach dashboard to the page
     */
    attachToPage() {
        // Add CSS styles
        this.addDashboardStyles();
        
        // Insert dashboard into the page
        document.body.appendChild(this.dashboardElement);
        
        // Add event listeners
        this.addEventListeners();
    }

    /**
     * Add CSS styles for the dashboard
     */
    addDashboardStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .training-dashboard {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 400px;
                max-height: 80vh;
                background: white;
                border: 1px solid #ddd;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                z-index: 1000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                overflow: hidden;
                transition: all 0.3s ease;
            }
            
            .training-dashboard.collapsed {
                height: 60px;
                overflow: hidden;
            }
            
            .dashboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 12px 12px 0 0;
            }
            
            .dashboard-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }
            
            .toggle-btn {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 5px 10px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .dashboard-content {
                padding: 20px;
                max-height: calc(80vh - 80px);
                overflow-y: auto;
            }
            
            .training-status {
                margin-bottom: 20px;
            }
            
            .status-indicator {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .status-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #28a745;
                animation: pulse 2s infinite;
            }
            
            .status-dot.training {
                background: #ffc107;
            }
            
            .status-dot.error {
                background: #dc3545;
            }
            
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
            
            .progress-section {
                margin-bottom: 20px;
            }
            
            .progress-section h4 {
                margin: 0 0 10px 0;
                font-size: 14px;
                color: #333;
            }
            
            .progress-bar {
                width: 100%;
                height: 8px;
                background: #e9ecef;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 5px;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #28a745, #20c997);
                width: 0%;
                transition: width 0.3s ease;
            }
            
            .progress-text {
                font-size: 12px;
                color: #666;
                text-align: center;
            }
            
            .metrics-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .metric-card {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                text-align: center;
                border: 1px solid #e9ecef;
            }
            
            .metric-value {
                font-size: 24px;
                font-weight: bold;
                color: #333;
                margin-bottom: 5px;
            }
            
            .metric-label {
                font-size: 12px;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .accuracy-section {
                margin-bottom: 20px;
            }
            
            .accuracy-section h4 {
                margin: 0 0 10px 0;
                font-size: 14px;
                color: #333;
            }
            
            .accuracy-chart {
                position: relative;
            }
            
            .accuracy-bar {
                width: 100%;
                height: 20px;
                background: #e9ecef;
                border-radius: 10px;
                overflow: hidden;
            }
            
            .accuracy-fill {
                height: 100%;
                background: linear-gradient(90deg, #dc3545, #ffc107, #28a745);
                width: 0%;
                transition: width 0.3s ease;
            }
            
            .accuracy-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-weight: bold;
                color: white;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            }
            
            .error-analysis, .pattern-refinements {
                margin-bottom: 20px;
            }
            
            .error-analysis h4, .pattern-refinements h4 {
                margin: 0 0 10px 0;
                font-size: 14px;
                color: #333;
            }
            
            .error-list, .refinement-list {
                max-height: 120px;
                overflow-y: auto;
                background: #f8f9fa;
                border-radius: 6px;
                padding: 10px;
            }
            
            .error-item, .refinement-item {
                padding: 8px;
                margin-bottom: 5px;
                background: white;
                border-radius: 4px;
                border-left: 3px solid #dc3545;
                font-size: 12px;
            }
            
            .refinement-item {
                border-left-color: #28a745;
            }
            
            .no-errors, .no-refinements {
                text-align: center;
                color: #666;
                font-style: italic;
                padding: 20px;
            }
            
            .training-controls {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            
            .btn-primary, .btn-secondary, .btn-outline {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.2s ease;
            }
            
            .btn-primary {
                background: #007bff;
                color: white;
            }
            
            .btn-primary:hover:not(:disabled) {
                background: #0056b3;
            }
            
            .btn-secondary {
                background: #6c757d;
                color: white;
            }
            
            .btn-outline {
                background: transparent;
                color: #007bff;
                border: 1px solid #007bff;
            }
            
            .btn-primary:disabled, .btn-secondary:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Add event listeners
     */
    addEventListeners() {
        // Toggle dashboard visibility
        document.getElementById('toggle-dashboard').addEventListener('click', () => {
            this.toggleVisibility();
        });

        // Training controls
        document.getElementById('start-training').addEventListener('click', () => {
            this.startTraining();
        });

        document.getElementById('stop-training').addEventListener('click', () => {
            this.stopTraining();
        });

        document.getElementById('view-details').addEventListener('click', () => {
            this.showDetailedView();
        });
    }

    /**
     * Toggle dashboard visibility
     */
    toggleVisibility() {
        this.isVisible = !this.isVisible;
        const content = this.dashboardElement.querySelector('.dashboard-content');
        const toggleBtn = document.getElementById('toggle-dashboard');
        
        if (this.isVisible) {
            content.style.display = 'block';
            toggleBtn.textContent = 'Hide';
        } else {
            content.style.display = 'none';
            toggleBtn.textContent = 'Show';
        }
    }

    /**
     * Start training process
     */
    async startTraining() {
        if (!this.trainingSystem) {
            console.error('Training system not initialized');
            return;
        }

        const startBtn = document.getElementById('start-training');
        const stopBtn = document.getElementById('stop-training');
        
        startBtn.disabled = true;
        stopBtn.disabled = false;
        
        try {
            await this.trainingSystem.startTraining();
        } catch (error) {
            console.error('Training failed:', error);
            this.updateStatus('error', 'Training failed');
        }
    }

    /**
     * Stop training process
     */
    stopTraining() {
        const startBtn = document.getElementById('start-training');
        const stopBtn = document.getElementById('stop-training');
        
        startBtn.disabled = false;
        stopBtn.disabled = true;
        
        this.updateStatus('ready', 'Training stopped');
    }

    /**
     * Show detailed view
     */
    showDetailedView() {
        const results = this.trainingSystem?.getTrainingResults() || [];
        const details = results.map(result => ({
            pass: result.pass,
            accuracy: `${(result.accuracy * 100).toFixed(1)}%`,
            confidence: `${(result.confidence * 100).toFixed(1)}%`,
            errors: result.errors.length
        }));
        
        alert(`Training Details:\n\n${JSON.stringify(details, null, 2)}`);
    }

    /**
     * Update dashboard with current progress
     */
    updateDashboard() {
        if (!this.trainingSystem) return;
        
        const progress = this.trainingSystem.getTrainingProgress();
        const results = this.trainingSystem.getTrainingResults();
        
        // Update progress
        const progressPercent = progress.totalDocuments > 0 ? 
            (progress.processedDocuments / progress.totalDocuments) * 100 : 0;
        
        document.getElementById('progress-fill').style.width = `${progressPercent}%`;
        document.getElementById('progress-text').textContent = `${progressPercent.toFixed(1)}% Complete`;
        
        // Update metrics
        document.getElementById('total-documents').textContent = progress.totalDocuments;
        document.getElementById('processed-documents').textContent = progress.processedDocuments;
        document.getElementById('current-pass').textContent = progress.currentPass;
        document.getElementById('errors-found').textContent = progress.errorsFound;
        
        // Update accuracy
        const lastResult = results[results.length - 1];
        if (lastResult) {
            const accuracyPercent = lastResult.accuracy * 100;
            document.getElementById('accuracy-fill').style.width = `${accuracyPercent}%`;
            document.getElementById('accuracy-text').textContent = `${accuracyPercent.toFixed(1)}%`;
        }
        
        // Update status
        if (progress.isTraining) {
            this.updateStatus('training', 'Training in progress...');
        } else if (progress.errorsFound > 0) {
            this.updateStatus('error', `${progress.errorsFound} errors found`);
        } else {
            this.updateStatus('ready', 'Ready');
        }
        
        // Update error list
        this.updateErrorList(results);
        
        // Update refinement list
        this.updateRefinementList(progress);
    }

    /**
     * Update status indicator
     */
    updateStatus(type, message) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.getElementById('status-text');
        
        statusDot.className = `status-dot ${type}`;
        statusText.textContent = message;
    }

    /**
     * Update error list
     */
    updateErrorList(results) {
        const errorList = document.getElementById('error-list');
        const allErrors = results.flatMap(result => result.errors);
        
        if (allErrors.length === 0) {
            errorList.innerHTML = '<div class="no-errors">No errors detected</div>';
            return;
        }
        
        const errorHtml = allErrors.slice(-5).map(error => `
            <div class="error-item">
                <strong>Pass ${error.pass}:</strong> ${error.filename}<br>
                <small>${error.errors?.[0]?.message || error.error}</small>
            </div>
        `).join('');
        
        errorList.innerHTML = errorHtml;
    }

    /**
     * Update refinement list
     */
    updateRefinementList(progress) {
        const refinementList = document.getElementById('refinement-list');
        
        if (progress.patternsRefined === 0) {
            refinementList.innerHTML = '<div class="no-refinements">No refinements yet</div>';
            return;
        }
        
        const refinementHtml = `
            <div class="refinement-item">
                <strong>Patterns Refined:</strong> ${progress.patternsRefined}<br>
                <small>Based on error analysis and training results</small>
            </div>
        `;
        
        refinementList.innerHTML = refinementHtml;
    }

    /**
     * Start auto-update
     */
    startAutoUpdate() {
        this.updateInterval = setInterval(() => {
            this.updateDashboard();
        }, 1000);
    }

    /**
     * Stop auto-update
     */
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Show dashboard
     */
    show() {
        if (this.dashboardElement) {
            this.dashboardElement.style.display = 'block';
        }
    }

    /**
     * Hide dashboard
     */
    hide() {
        if (this.dashboardElement) {
            this.dashboardElement.style.display = 'none';
        }
    }

    /**
     * Destroy dashboard
     */
    destroy() {
        this.stopAutoUpdate();
        if (this.dashboardElement) {
            this.dashboardElement.remove();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrainingDashboard;
} else {
    window.TrainingDashboard = TrainingDashboard;
}
