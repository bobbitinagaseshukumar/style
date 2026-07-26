const express = require('express');
const router = express.Router();
const recentlyViewedController = require('../controllers/recentlyViewedController');
const { protect, optionalAuth, authorize } = require('../middleware/authMiddleware');

router.post('/', optionalAuth, recentlyViewedController.addRecentlyViewed);
router.get('/', optionalAuth, recentlyViewedController.getRecentlyViewed);
router.delete('/:productId', protect, recentlyViewedController.deleteOneRecentlyViewed);
router.delete('/', protect, recentlyViewedController.clearRecentlyViewed);

// Admin analytics
router.get(
  '/admin/most-viewed',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN'),
  recentlyViewedController.getMostViewedAnalytics
);

module.exports = router;
