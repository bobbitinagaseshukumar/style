const { body } = require('express-validator');

const registerValidator = [
    body('fullName').notEmpty().withMessage('Full name is required').trim(),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
        .withMessage('Password must contain uppercase, lowercase, number, and special character'),
    body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
];

const loginValidator = [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
];

const verifyOTPValidator = [
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be exactly 6 digits'),
    // Allow either userId or email to be provided
    body('userId').optional().notEmpty(),
    body('email').optional().isEmail(),
];

const forgotPasswordValidator = [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
];

const resetPasswordValidator = [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be exactly 6 digits'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
        .withMessage('Password must contain uppercase, lowercase, number, and special character'),
];

module.exports = {
    registerValidator,
    loginValidator,
    verifyOTPValidator,
    forgotPasswordValidator,
    resetPasswordValidator
};
