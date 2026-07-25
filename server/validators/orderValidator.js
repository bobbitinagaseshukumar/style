const { body } = require('express-validator');

const createOrderValidator = [
    body('addressId').notEmpty().withMessage('Shipping address is required'),
    body('paymentMethod').notEmpty().withMessage('Payment method is required'),
];

const updateOrderStatusValidator = [
    body('status').isIn(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).withMessage('Invalid order status'),
];

module.exports = {
    createOrderValidator,
    updateOrderStatusValidator
};
