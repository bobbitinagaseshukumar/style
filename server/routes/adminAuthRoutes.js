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

// Session & Trusted Devices Management
router.get('/sessions', ...adminOnly, adminAuthController.getAdminSessions);
router.delete('/sessions/:id', ...adminOnly, adminAuthController.revokeAdminSession);

// Login History Logs
router.get('/history', ...adminOnly, adminAuthController.getAdminLoginHistory);

// Super Admin Team & RBAC Management
router.post('/create-admin', ...superAdminOnly, adminAuthController.createAdminAccount);

// Maintenance Mode
router.get('/maintenance', adminAuthController.getMaintenanceStatus);
router.post('/maintenance', ...superAdminOnly, adminAuthController.toggleMaintenanceMode);

module.exports = router;
