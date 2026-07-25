const { body } = require('express-validator');

const updateSettingsValidator = [
    body('storeName').optional().notEmpty().withMessage('Store name cannot be empty'),
    body('supportEmail').optional().isEmail().withMessage('Invalid support email'),
];

const createBannerValidator = [
    body('title').notEmpty().withMessage('Banner title is required'),
    body('position').notEmpty().withMessage('Position is required'),
];

const updateCMSPageValidator = [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
];

module.exports = {
    updateSettingsValidator,
    createBannerValidator,
    updateCMSPageValidator
};
