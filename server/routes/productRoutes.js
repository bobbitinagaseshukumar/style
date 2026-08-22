const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/render-image', productController.renderImage);
router.get('/:slug', productController.getProductBySlug);

// Admin-only routes — MUST be protected
router.put('/admin/reset-all-stocks', protect, authorize('ADMIN', 'SUPER_ADMIN'), productController.resetAllStocks);
router.post('/:id/restock', protect, authorize('ADMIN', 'SUPER_ADMIN'), productController.restockProduct);
router.post('/', protect, authorize('ADMIN', 'SUPER_ADMIN'), productController.createProduct);
router.put('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), productController.updateProduct);
router.delete('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), productController.deleteProduct);

// Customer routes — logged-in users
router.post('/:id/notify-me', protect, productController.subscribeBackInStock);

module.exports = router;
