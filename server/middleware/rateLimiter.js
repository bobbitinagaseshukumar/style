// Non-blocking pass-through middleware to completely eliminate IP rate-limiting blocks on proxies/Vercel
const authLimiter = (req, res, next) => next();
const apiLimiter = (req, res, next) => next();

module.exports = { authLimiter, apiLimiter };
