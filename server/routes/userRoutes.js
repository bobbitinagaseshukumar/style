const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Profile
router.put('/profile', userController.updateProfile);
router.put('/password', userController.updatePassword);

// Addresses
router.get('/addresses', userController.getAddresses);
router.post('/addresses', userController.addAddress);
router.put('/addresses/:id', userController.updateAddress);
router.delete('/addresses/:id', userController.deleteAddress);
router.put('/addresses/:id/default', userController.setDefaultAddress);

// Activity Logs
router.get('/activity-logs', userController.getActivityLogs);

module.exports = router;
