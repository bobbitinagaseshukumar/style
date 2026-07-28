const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:slug', productController.getProductBySlug);

// Admin-only routes — MUST be protected
router.put('/admin/reset-all-stocks', protect, authorize('ADMIN', 'SUPER_ADMIN'), productController.resetAllStocks);
router.post('/', protect, authorize('ADMIN', 'SUPER_ADMIN'), productController.createProduct);
router.put('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), productController.updateProduct);
router.delete('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), productController.deleteProduct);

module.exports = router;
