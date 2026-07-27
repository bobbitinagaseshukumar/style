const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public endpoints
router.post('/newsletter/subscribe', emailController.subscribeNewsletter);

// Protected customer routes
router.put('/preferences', protect, emailController.updateNotificationPreferences);

// Admin-only campaign routes
const adminOnly = [protect, authorize('ADMIN', 'SUPER_ADMIN')];

router.get('/campaigns', ...adminOnly, emailController.getCampaigns);
router.post('/campaigns', ...adminOnly, emailController.createCampaign);
router.put('/campaigns/:id', ...adminOnly, emailController.updateCampaign);
router.post('/campaigns/:id/send', ...adminOnly, emailController.sendCampaignNow);
router.delete('/campaigns/:id', ...adminOnly, emailController.deleteCampaign);

router.get('/history', ...adminOnly, emailController.getEmailHistory);

module.exports = router;
