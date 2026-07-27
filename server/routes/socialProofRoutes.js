const express = require('express');
const router = express.Router();
const socialProofController = require('../controllers/socialProofController');
const { protect, authorize } = require('../middleware/authMiddleware');

const adminOnly = [protect, authorize('ADMIN', 'SUPER_ADMIN')];

// Public Endpoints
router.get('/settings', socialProofController.getSocialProofSettings);
router.get('/recent-delivered-orders', socialProofController.getRealDeliveredOrders);

// Admin Setting Endpoint
router.put('/admin/settings', ...adminOnly, socialProofController.updateSocialProofSettings);

module.exports = router;
