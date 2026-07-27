const express = require('express');
const router = express.Router();
const authFormController = require('../controllers/authFormController');
const { protect, authorize } = require('../middleware/authMiddleware');

const adminOnly = [protect, authorize('ADMIN', 'SUPER_ADMIN')];

// Public Customer Endpoint (Get Active Enabled Form Fields)
router.get('/form-fields', authFormController.getPublicAuthFields);

// Admin Management Endpoints
router.get('/admin/auth-form-fields', ...adminOnly, authFormController.getAdminAuthFields);
router.post('/admin/auth-form-fields', ...adminOnly, authFormController.createAuthField);
router.put('/admin/auth-form-fields/reorder', ...adminOnly, authFormController.reorderAuthFields);
router.put('/admin/auth-form-fields/:id', ...adminOnly, authFormController.updateAuthField);
router.delete('/admin/auth-form-fields/:id', ...adminOnly, authFormController.deleteAuthField);

module.exports = router;
