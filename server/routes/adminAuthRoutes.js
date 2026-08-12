const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');
const { protect, authorize } = require('../middleware/authMiddleware');

const adminOnly = [protect, authorize('ADMIN', 'SUPER_ADMIN')];
const superAdminOnly = [protect, authorize('SUPER_ADMIN')];

// Step 1 & Step 2 Authentication Routes
router.post('/login', adminAuthController.adminLoginStep1);
router.post('/verify-otp', adminAuthController.verifyAdminOTP);
router.post('/resend-otp', adminAuthController.resendAdminOTP);

// Admin Forgot Password Flow (Email OTP)
router.post('/forgot-password', adminAuthController.adminForgotPassword);
router.post('/verify-reset-otp', adminAuthController.adminVerifyResetOTP);
router.post('/reset-password', adminAuthController.adminResetPassword);

// Logged-in Admin Account Profile & Security Settings
router.get('/me', ...adminOnly, adminAuthController.getAdminProfile);
router.put('/profile', ...adminOnly, adminAuthController.updateAdminProfile);

// Change Email Flow (2-Step OTP to NEW Email)
router.post('/change-email/request-otp', ...adminOnly, adminAuthController.requestEmailChangeOTP);
router.post('/change-email/verify-otp', ...adminOnly, adminAuthController.verifyEmailChangeOTP);

// Change Password Flow (Current Password + 2-Step OTP to Registered Email)
router.post('/change-password/request-otp', ...adminOnly, adminAuthController.requestPasswordChangeOTP);
router.post('/change-password/verify-otp', ...adminOnly, adminAuthController.verifyPasswordChangeOTP);

// Two-Factor Authentication (2FA) Toggle
router.put('/2fa', ...adminOnly, adminAuthController.toggleAdmin2FA);

// Session & Trusted Devices Management
router.get('/sessions', ...adminOnly, adminAuthController.getAdminSessions);
router.delete('/sessions/:id', ...adminOnly, adminAuthController.revokeAdminSession);
router.post('/revoke-all-sessions', ...adminOnly, adminAuthController.revokeAllOtherSessions);

// Login History & Security Audit Logs
router.get('/history', ...adminOnly, adminAuthController.getAdminLoginHistory);
router.get('/security-logs', ...adminOnly, adminAuthController.getAdminSecurityLogs);

// Super Admin Team & RBAC Management
router.post('/create-admin', ...superAdminOnly, adminAuthController.createAdminAccount);

// Maintenance Mode
router.get('/maintenance', adminAuthController.getMaintenanceStatus);
router.post('/maintenance', ...superAdminOnly, adminAuthController.toggleMaintenanceMode);

module.exports = router;
