const express = require('express');
const router = express.Router();
const subcategoryController = require('../controllers/subcategoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

const adminOnly = [protect, authorize('ADMIN', 'SUPER_ADMIN')];

// Public routes
router.get('/', subcategoryController.getAllSubcategories);
router.get('/:id', subcategoryController.getSubcategoryById);

// Admin-only routes
router.post('/', ...adminOnly, subcategoryController.createSubcategory);
router.put('/reorder', ...adminOnly, subcategoryController.reorderSubcategories);
router.put('/:id', ...adminOnly, subcategoryController.updateSubcategory);
router.post('/:id/delete', ...adminOnly, subcategoryController.deleteSubcategory);
router.delete('/:id', ...adminOnly, subcategoryController.deleteSubcategory);

module.exports = router;
