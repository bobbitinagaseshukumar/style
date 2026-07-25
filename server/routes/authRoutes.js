const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validatorMiddleware');
const {
    registerValidator,
    loginValidator,
    verifyOTPValidator,
    forgotPasswordValidator,
    resetPasswordValidator
} = require('../validators/authValidator');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, registerValidator, validate, authController.register);
router.post('/verify-otp', authLimiter, verifyOTPValidator, validate, authController.verifyOTP);
router.post('/login', authLimiter, loginValidator, validate, authController.login);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validate, authController.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidator, validate, authController.resetPassword);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);

module.exports = router;
