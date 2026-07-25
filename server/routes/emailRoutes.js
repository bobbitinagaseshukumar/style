const express = require('express');
const router = express.Router();
const {
  createCampaign,
  sendTestEmail,
  notifyBackInStock,
  sendOrderStatusEmail,
} = require('../controllers/emailController');
const { protect, authorize } = require('../middleware/authMiddleware'); // FIXED: was '../middleware/auth'

// Admin-only routes
router.post('/campaign', protect, authorize('ADMIN', 'SUPER_ADMIN'), createCampaign);
router.post('/test', protect, authorize('ADMIN', 'SUPER_ADMIN'), sendTestEmail);
router.post('/order-status', protect, authorize('ADMIN', 'SUPER_ADMIN'), sendOrderStatusEmail);
router.post('/back-in-stock/:productId', protect, authorize('ADMIN', 'SUPER_ADMIN'), notifyBackInStock);

module.exports = router;
