const express = require('express');
const router = express.Router();
const seoController = require('../controllers/seoController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public: read SEO settings
router.get('/settings', seoController.getSEOSettings);

// Admin-only: update SEO settings
router.put('/settings', protect, authorize('ADMIN', 'SUPER_ADMIN'), seoController.updateSEOSetting);

module.exports = router;
