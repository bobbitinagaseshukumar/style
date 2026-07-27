const express = require('express');
const router = express.Router();
const chatbotSettingController = require('../controllers/chatbotSettingController');
const { protect, authorize } = require('../middleware/authMiddleware');

const adminOnly = [protect, authorize('ADMIN', 'SUPER_ADMIN')];

// Public Endpoint
router.get('/settings', chatbotSettingController.getChatbotSettings);

// Admin Setting Endpoint
router.put('/admin/settings', ...adminOnly, chatbotSettingController.updateChatbotSettings);

module.exports = router;
