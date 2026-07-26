const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public endpoints
router.post('/validate', couponController.validateCoupon);
router.get('/public', couponController.getPublicCoupons);

// Admin routes
const adminOnly = [protect, authorize('ADMIN', 'SUPER_ADMIN')];
router.get('/admin/all', ...adminOnly, couponController.getAllCoupons);
router.get('/admin/stats', ...adminOnly, couponController.getCouponStats);
router.post('/admin', ...adminOnly, couponController.createCoupon);
router.put('/admin/:id', ...adminOnly, couponController.updateCoupon);
router.delete('/admin/:id', ...adminOnly, couponController.deleteCoupon);

module.exports = router;
