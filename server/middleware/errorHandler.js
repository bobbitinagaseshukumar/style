/**
 * Centralized error handler middleware.
 * Uses err.statusCode (ApiError) first, falls back to res.statusCode, then 500.
 */
const errorHandler = (err, req, res, next) => {
  // Use err.statusCode from ApiError, not res.statusCode
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} → ${statusCode}: ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Only expose stack in development
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = errorHandler;
