const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public: Get product reviews
router.get('/product/:productId', reviewController.getProductReviews);

// Protected: Authenticated customers can post reviews
router.post('/', protect, reviewController.createReview);

// Admin-only routes
router.get('/admin/all', protect, authorize('ADMIN', 'SUPER_ADMIN'), reviewController.getAllReviews);
router.delete('/admin/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), reviewController.deleteReview);

module.exports = router;
