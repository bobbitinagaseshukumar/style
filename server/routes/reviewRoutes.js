const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public: Get product reviews
router.get('/product/:productId', reviewController.getProductReviews);

// Protected: Authenticated customers can post reviews & vote
router.post('/', protect, reviewController.createReview);
router.post('/:id/vote', protect, reviewController.voteReview);

// Admin-only routes
router.get('/admin/all', protect, authorize('ADMIN', 'SUPER_ADMIN'), reviewController.getAllReviews);
router.put('/admin/:id/status', protect, authorize('ADMIN', 'SUPER_ADMIN'), reviewController.updateReviewStatus);
router.delete('/admin/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), reviewController.deleteReview);

module.exports = router;
