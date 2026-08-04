const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', orderController.createOrder);
router.post('/whatsapp', orderController.createWhatsappOrder);
router.get('/my', orderController.getMyOrders);
router.get('/my-orders', orderController.getMyOrders);
router.get('/admin/all', orderController.adminGetAllOrders);
router.get('/:id', orderController.getOrderById);
router.get('/:id/cancellation-eligibility', orderController.getCancellationEligibility);
router.get('/:id/cancellation-status', orderController.getOrderCancellationStatus);
router.post('/:id/cancel', orderController.cancelOrder);
router.put('/:id/cancel', orderController.cancelOrder);
router.put('/admin/:id/approve', orderController.adminApproveOrder);
router.put('/admin/:id/reject', orderController.adminRejectOrder);
router.put('/admin/:id/status', orderController.adminUpdateOrderStatus);

module.exports = router;
