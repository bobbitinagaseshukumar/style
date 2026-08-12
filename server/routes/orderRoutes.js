const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', orderController.createOrder);
router.post('/whatsapp', orderController.createWhatsappOrder);
router.get('/my', orderController.getMyOrders);
router.get('/my-orders', orderController.getMyOrders);
router.get('/admin/all', authorize('ADMIN', 'SUPER_ADMIN'), orderController.adminGetAllOrders);
router.get('/:id', orderController.getOrderById);
router.get('/:id/cancellation-eligibility', orderController.getCancellationEligibility);
router.get('/:id/cancellation-status', orderController.getOrderCancellationStatus);
router.post('/:id/cancel', orderController.cancelOrder);
router.put('/:id/cancel', orderController.cancelOrder);
router.put('/admin/:id/approve', authorize('ADMIN', 'SUPER_ADMIN'), orderController.adminApproveOrder);
router.put('/admin/:id/reject', authorize('ADMIN', 'SUPER_ADMIN'), orderController.adminRejectOrder);
router.put('/admin/:id/status', authorize('ADMIN', 'SUPER_ADMIN'), orderController.adminUpdateOrderStatus);
router.delete('/admin/:id', authorize('ADMIN', 'SUPER_ADMIN'), orderController.deleteOrder);
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), orderController.deleteOrder);

module.exports = router;
