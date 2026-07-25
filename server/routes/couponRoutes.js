const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/validate', couponController.validateCoupon);

// Admin routes
router.use(protect, authorize('ADMIN', 'SUPER_ADMIN'));
router.get('/admin/all', couponController.getAllCoupons);
router.post('/admin', couponController.createCoupon);
router.put('/admin/:id', couponController.updateCoupon);
router.delete('/admin/:id', couponController.deleteCoupon);

module.exports = router;
