const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/db');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.cookies.token) {
        token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new ApiError(401, 'Not authorized, no token'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true, isVerified: true, status: true }
        });

        if (!user) {
            return next(new ApiError(401, 'User belonging to this token no longer exists.'));
        }
        
        if (user.status !== 'ACTIVE') {
            return next(new ApiError(403, 'Your account is deactivated or blocked.'));
        }

        req.user = user;
        next();
    } catch (error) {
        return next(new ApiError(401, 'Not authorized, token failed'));
    }
});

const optionalAuth = asyncHandler(async (req, res, next) => {
    let token;

    if (req.cookies?.token) {
        token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true, isVerified: true, status: true }
        });

        if (user && user.status === 'ACTIVE') {
            req.user = user;
        } else {
            req.user = null;
        }
    } catch (error) {
        req.user = null;
    }

    next();
});

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user?.role)) {
            return next(new ApiError(403, `User role ${req.user?.role} is not authorized to access this route`));
        }
        next();
    };
};

module.exports = { protect, authorize, optionalAuth };
