/**
 * Centralized error handler middleware.
 * Handles ApiError, Prisma errors, Multer errors, JWT errors, and generic errors.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';

  // ── Prisma Client Known Request Errors ──
  if (err.code === 'P2002') {
    // Unique constraint violation
    const field = err.meta?.target?.join(', ') || 'field';
    statusCode = 409;
    message = `A record with this ${field} already exists.`;
  } else if (err.code === 'P2025') {
    // Record not found
    statusCode = 404;
    message = err.meta?.cause || 'The requested record was not found.';
  } else if (err.code === 'P2003') {
    // Foreign key constraint violation
    statusCode = 400;
    message = 'Related record not found. Please check your references.';
  }

  // ── Multer File Size Errors ──
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File too large. Maximum allowed size is 5MB.';
  }

  // ── JSON Syntax Errors ──
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON in request body.';
  }

  // ── JWT Errors ──
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} → ${statusCode}: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || err.data || undefined,
    // Only expose stack in development
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = errorHandler;
