const { body } = require('express-validator');

const createProductValidator = [
    body('name').notEmpty().withMessage('Product name is required'),
    body('description').notEmpty().withMessage('Product description is required'),
    body('basePrice').isNumeric().withMessage('Base price must be a number'),
    body('categoryId').notEmpty().withMessage('Category ID is required'),
];

const updateProductValidator = [
    body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
    body('description').optional().notEmpty().withMessage('Product description cannot be empty'),
    body('basePrice').optional().isNumeric().withMessage('Base price must be a number'),
];

module.exports = {
    createProductValidator,
    updateProductValidator
};
