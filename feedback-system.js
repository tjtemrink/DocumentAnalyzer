// User Feedback System for Continuous Learning
class FeedbackSystem {
    constructor() {
        this.feedbackContainer = null;
        this.currentQuestion = null;
        this.currentResponse = null;
        this.init();
    }

    init() {
        this.createFeedbackUI();
        this.bindEvents();
    }

    createFeedbackUI() {
        // Create feedback overlay
        const overlay = document.createElement('div');
        overlay.id = 'feedbackOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: none;
            justify-content: center;
            align-items: center;
        `;

        // Create feedback modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;

        modal.innerHTML = `
            <h3 style="margin-top: 0; color: #333;">How was this response?</h3>
            <div class="rating-container" style="margin: 20px 0;">
                <div class="stars" style="display: flex; gap: 10px; justify-content: center;">
                    <span class="star" data-rating="1">⭐</span>
                    <span class="star" data-rating="2">⭐</span>
                    <span class="star" data-rating="3">⭐</span>
                    <span class="star" data-rating="4">⭐</span>
                    <span class="star" data-rating="5">⭐</span>
                </div>
                <p id="ratingText" style="text-align: center; margin: 10px 0; color: #666;">Click a star to rate</p>
            </div>
            <div class="feedback-options" style="margin: 20px 0;">
                <label style="display: block; margin: 10px 0;">
                    <input type="radio" name="feedback" value="helpful"> This response was helpful
                </label>
                <label style="display: block; margin: 10px 0;">
                    <input type="radio" name="feedback" value="not-helpful"> This response was not helpful
                </label>
                <label style="display: block; margin: 10px 0;">
                    <input type="radio" name="feedback" value="inaccurate"> This response was inaccurate
                </label>
                <label style="display: block; margin: 10px 0;">
                    <input type="radio" name="feedback" value="incomplete"> This response was incomplete
                </label>
            </div>
            <div class="suggestion-box" style="margin: 20px 0;">
                <label for="suggestion" style="display: block; margin-bottom: 5px; font-weight: bold;">How can I improve? (Optional)</label>
                <textarea id="suggestion" placeholder="Tell me what would make this response better..." 
                    style="width: 100%; height: 80px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; resize: vertical;"></textarea>
            </div>
            <div class="button-container" style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="skipFeedback" style="padding: 10px 20px; border: 1px solid #ddd; background: #f5f5f5; border-radius: 5px; cursor: pointer;">Skip</button>
                <button id="submitFeedback" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Submit Feedback</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        this.feedbackContainer = overlay;
    }

    bindEvents() {
        // Star rating events
        const stars = this.feedbackContainer.querySelectorAll('.star');
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                this.setRating(index + 1);
            });
            star.addEventListener('mouseenter', () => {
                this.highlightStars(index + 1);
            });
        });

        // Reset stars on mouse leave
        const starsContainer = this.feedbackContainer.querySelector('.stars');
        starsContainer.addEventListener('mouseleave', () => {
            this.highlightStars(this.currentRating || 0);
        });

        // Button events
        this.feedbackContainer.querySelector('#skipFeedback').addEventListener('click', () => {
            this.hideFeedback();
        });

        this.feedbackContainer.querySelector('#submitFeedback').addEventListener('click', () => {
            this.submitFeedback();
        });
    }

    setRating(rating) {
        this.currentRating = rating;
        this.highlightStars(rating);
        
        const ratingText = this.feedbackContainer.querySelector('#ratingText');
        const texts = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
        ratingText.textContent = texts[rating];
    }

    highlightStars(rating) {
        const stars = this.feedbackContainer.querySelectorAll('.star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.style.color = '#ffc107';
                star.style.transform = 'scale(1.1)';
            } else {
                star.style.color = '#ddd';
                star.style.transform = 'scale(1)';
            }
        });
    }

    showFeedback(question, response) {
        this.currentQuestion = question;
        this.currentResponse = response;
        this.currentRating = 0;
        
        // Reset form
        this.feedbackContainer.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.checked = false;
        });
        this.feedbackContainer.querySelector('#suggestion').value = '';
        this.highlightStars(0);
        this.feedbackContainer.querySelector('#ratingText').textContent = 'Click a star to rate';
        
        this.feedbackContainer.style.display = 'flex';
    }

    hideFeedback() {
        this.feedbackContainer.style.display = 'none';
    }

    submitFeedback() {
        const rating = this.currentRating || 0;
        const feedbackType = this.feedbackContainer.querySelector('input[name="feedback"]:checked')?.value || 'no-feedback';
        const suggestion = this.feedbackContainer.querySelector('#suggestion').value;

        if (rating === 0 && feedbackType === 'no-feedback') {
            alert('Please provide some feedback before submitting.');
            return;
        }

        // Process feedback
        this.processFeedback({
            question: this.currentQuestion,
            response: this.currentResponse,
            rating: rating,
            feedbackType: feedbackType,
            suggestion: suggestion,
            timestamp: new Date().toISOString()
        });

        this.hideFeedback();
        this.showThankYou();
    }

    processFeedback(feedback) {
        // Send to self-learning system
        if (window.selfLearningSystem) {
            window.selfLearningSystem.processFeedback(
                feedback.question,
                feedback.response,
                feedback.suggestion,
                feedback.rating
            );
        }

        // Store in localStorage
        const storedFeedback = JSON.parse(localStorage.getItem('user_feedback_history') || '[]');
        storedFeedback.push(feedback);
        localStorage.setItem('user_feedback_history', JSON.stringify(storedFeedback));

        // Update learning metrics
        this.updateLearningMetrics(feedback);
    }

    updateLearningMetrics(feedback) {
        const metrics = JSON.parse(localStorage.getItem('learning_metrics') || '{"totalFeedback": 0, "averageRating": 0, "totalRating": 0}');
        
        metrics.totalFeedback++;
        metrics.totalRating += feedback.rating;
        metrics.averageRating = metrics.totalRating / metrics.totalFeedback;
        
        localStorage.setItem('learning_metrics', JSON.stringify(metrics));
    }

    showThankYou() {
        const thankYou = document.createElement('div');
        thankYou.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        thankYou.textContent = 'Thank you for your feedback! I\'m learning and improving.';
        
        document.body.appendChild(thankYou);
        
        setTimeout(() => {
            document.body.removeChild(thankYou);
        }, 3000);
    }

    // Get feedback statistics
    getFeedbackStats() {
        const metrics = JSON.parse(localStorage.getItem('learning_metrics') || '{"totalFeedback": 0, "averageRating": 0}');
        const feedbackHistory = JSON.parse(localStorage.getItem('user_feedback_history') || '[]');
        
        return {
            totalFeedback: metrics.totalFeedback,
            averageRating: metrics.averageRating.toFixed(1),
            recentFeedback: feedbackHistory.slice(-10),
            feedbackTypes: this.analyzeFeedbackTypes(feedbackHistory)
        };
    }

    analyzeFeedbackTypes(feedbackHistory) {
        const types = {};
        feedbackHistory.forEach(feedback => {
            types[feedback.feedbackType] = (types[feedback.feedbackType] || 0) + 1;
        });
        return types;
    }
}

// Initialize feedback system
window.feedbackSystem = new FeedbackSystem();
