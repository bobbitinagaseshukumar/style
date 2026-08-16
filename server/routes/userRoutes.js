const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Profile
router.get('/me', authController.getMe);
router.get('/profile', authController.getMe);
router.put('/profile', userController.updateProfile);
// Password Change
router.put('/password', userController.updatePassword);
router.post('/password-otp/request', userController.requestPasswordOTP);
router.post('/password-otp/verify', userController.verifyPasswordOTP);

// Multi-Device Session Security
router.post('/logout-all-devices', userController.logoutAllDevices);

// Addresses
router.get('/addresses', userController.getAddresses);
router.post('/addresses', userController.addAddress);
router.put('/addresses/:id', userController.updateAddress);
router.delete('/addresses/:id', userController.deleteAddress);
router.put('/addresses/:id/default', userController.setDefaultAddress);

// Activity Logs
router.get('/activity-logs', userController.getActivityLogs);
router.delete('/activity-logs/:id', userController.deleteActivityLog);
router.delete('/activity-logs', userController.clearActivityLogs);

module.exports = router;
