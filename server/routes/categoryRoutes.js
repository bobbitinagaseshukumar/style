const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/', categoryController.getCategories);
router.get('/:categoryId/subcategories', categoryController.getSubCategories);

// Admin-only routes
router.post('/', protect, authorize('ADMIN', 'SUPER_ADMIN'), categoryController.createCategory);
router.put('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), categoryController.updateCategory);
router.delete('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), categoryController.deleteCategory);
router.post('/:id/delete', protect, authorize('ADMIN', 'SUPER_ADMIN'), categoryController.deleteCategory);

router.post('/:categoryId/subcategories', protect, authorize('ADMIN', 'SUPER_ADMIN'), categoryController.createSubCategory);
router.put('/subcategories/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), categoryController.updateSubCategory);
router.delete('/subcategories/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), categoryController.deleteSubCategory);

module.exports = router;
