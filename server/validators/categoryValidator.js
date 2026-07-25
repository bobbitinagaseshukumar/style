const { body } = require('express-validator');

const createCategoryValidator = [
    body('name').notEmpty().withMessage('Category name is required'),
    body('description').optional().isString(),
];

const updateCategoryValidator = [
    body('name').optional().notEmpty().withMessage('Category name cannot be empty'),
];

module.exports = {
    createCategoryValidator,
    updateCategoryValidator
};
