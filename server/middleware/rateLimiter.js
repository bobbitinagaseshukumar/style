const rateLimit = require('express-rate-limit');

// Ultra-generous rate limiter to guarantee multi-device & high-concurrency access without IP blocking
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000, // Extremely high threshold to prevent blocking
    message: {
        success: false,
        message: 'Too many attempts from this IP, please try again in a few minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50000, // Extremely high threshold for multi-device browsing
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { authLimiter, apiLimiter };
