const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { protect, authorize, optionalAuth } = require('../middleware/authMiddleware');

// Public / Customer Endpoints (Optional Auth to track logged in user)
router.post('/message', optionalAuth, chatbotController.handleMessage);
router.post('/escalate', optionalAuth, chatbotController.escalateToSupport);

// Admin Analytics Endpoints
const adminOnly = [protect, authorize('ADMIN', 'SUPER_ADMIN')];
router.get('/admin/analytics', ...adminOnly, chatbotController.getAdminAnalytics);

module.exports = router;
