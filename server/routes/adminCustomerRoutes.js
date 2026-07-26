const express = require('express');
const router = express.Router();
const adminCustomerController = require('../controllers/adminCustomerController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All endpoints require Admin privileges
const adminAuth = [protect, authorize('ADMIN', 'SUPER_ADMIN')];

router.get('/', ...adminAuth, adminCustomerController.getAllCustomers);
router.get('/:id', ...adminAuth, adminCustomerController.getCustomerProfile);
router.put('/:id', ...adminAuth, adminCustomerController.updateCustomerDetails);

router.post('/:id/change-password', ...adminAuth, adminCustomerController.changeCustomerPassword);
router.post('/:id/reset-password', ...adminAuth, adminCustomerController.sendPasswordReset);

router.post('/:id/block', ...adminAuth, adminCustomerController.blockCustomer);
router.post('/:id/unblock', ...adminAuth, adminCustomerController.unblockCustomer);
router.post('/:id/suspend', ...adminAuth, adminCustomerController.suspendCustomer);

router.put('/:id/status', ...adminAuth, adminCustomerController.toggleCustomerStatus);
router.put('/:id/permissions', ...adminAuth, adminCustomerController.updateCustomerPermissions);

router.post('/:id/force-logout', ...adminAuth, adminCustomerController.forceLogoutCustomer);
router.delete('/:id', ...adminAuth, adminCustomerController.deleteCustomer);
router.get('/:id/logs', ...adminAuth, adminCustomerController.getCustomerLogs);

module.exports = router;
