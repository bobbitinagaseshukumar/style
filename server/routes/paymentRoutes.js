const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Public: Get Razorpay public key (needed by frontend)
router.get('/key', paymentController.getRazorpayKey);

// Protected: Create Razorpay order (requires logged-in user)
router.post('/create-order', protect, paymentController.createRazorpayOrder);

// Protected: Verify payment signature
router.post('/verify', protect, paymentController.verifyPayment);

module.exports = router;
