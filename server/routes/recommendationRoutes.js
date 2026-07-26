const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Public / Optional Auth Tracking & Recommendations
router.post('/track', optionalAuth, recommendationController.trackCustomerBehavior);
router.get('/personalized', optionalAuth, recommendationController.getPersonalizedRecommendations);

// Admin Analytics
router.get('/admin/analytics', protect, recommendationController.getAdminRecommendationAnalytics);

module.exports = router;
