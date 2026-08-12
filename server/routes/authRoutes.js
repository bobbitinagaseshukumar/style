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

// Auth Settings Routes (Enterprise Auth Manager)
router.get('/settings/public', authController.getAuthSettingsPublic);
router.get('/settings/admin', protect, authController.getAuthSettingsAdmin);
router.put('/settings/admin', protect, authController.updateAuthSettingsAdmin);

// Google Sign-In (Firebase)
router.post('/google', authController.googleLogin);
router.post('/google/register', authController.googleRegister);

module.exports = router;
