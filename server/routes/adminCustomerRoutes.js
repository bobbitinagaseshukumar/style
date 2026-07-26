const express = require('express');
const router = express.Router();
const adminCustomerController = require('../controllers/adminCustomerController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All endpoints require Admin privileges
const adminAuth = [protect, authorize('ADMIN', 'SUPER_ADMIN')];

// LIST & STATS
router.get('/', ...adminAuth, adminCustomerController.getAllCustomers);
router.get('/duplicates', ...adminAuth, adminCustomerController.getDuplicates);
router.post('/assign-customer-ids', ...adminAuth, adminCustomerController.assignMissingCustomerIds);

// SINGLE CUSTOMER — must come after specific routes
router.get('/:id', ...adminAuth, adminCustomerController.getCustomerProfile);
router.put('/:id', ...adminAuth, adminCustomerController.updateCustomerDetails);

// PASSWORD MANAGEMENT
router.post('/:id/change-password', ...adminAuth, adminCustomerController.changeCustomerPassword);
router.post('/:id/reset-password', ...adminAuth, adminCustomerController.sendPasswordReset);

// STATUS MANAGEMENT
router.post('/:id/block', ...adminAuth, adminCustomerController.blockCustomer);
router.post('/:id/unblock', ...adminAuth, adminCustomerController.unblockCustomer);
router.post('/:id/suspend', ...adminAuth, adminCustomerController.suspendCustomer);
router.put('/:id/status', ...adminAuth, adminCustomerController.toggleCustomerStatus);

// PERMISSIONS
router.put('/:id/permissions', ...adminAuth, adminCustomerController.updateCustomerPermissions);

// SESSION MANAGEMENT
router.post('/:id/force-logout', ...adminAuth, adminCustomerController.forceLogoutCustomer);

// COMMUNICATION
router.post('/:id/send-message', ...adminAuth, adminCustomerController.sendCustomerMessage);

// ADMIN NOTES
router.put('/:id/admin-notes', ...adminAuth, adminCustomerController.updateAdminNotes);

// LOGS
router.get('/:id/logs', ...adminAuth, adminCustomerController.getCustomerLogs);

// DELETE
router.delete('/:id', ...adminAuth, adminCustomerController.deleteCustomer);

module.exports = router;
