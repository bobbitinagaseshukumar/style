const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/db');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.cookies?.token) {
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
            select: {
                id: true, email: true, role: true, isVerified: true, status: true,
                tokenVersion: true, suspendedUntil: true, canLogin: true,
                canPlaceOrders: true, canCancelOrders: true, canReturnProducts: true,
                canAddReviews: true, canAddWishlist: true, canUseCoupons: true
            }
        });

        if (!user) {
            return next(new ApiError(401, 'User belonging to this token no longer exists.'));
        }

        // Token Version Validation (Force Logout Enforcement)
        if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
            return next(new ApiError(401, 'Your session has expired or was terminated by the administrator. Please log in again.'));
        }

        // Account Status Controls
        if (user.status === 'BLOCKED') {
            return next(new ApiError(403, 'Your account has been blocked by the administrator. Please contact customer support.'));
        }

        if (user.status === 'INACTIVE') {
            return next(new ApiError(403, 'Your account is deactivated. Please contact support.'));
        }

        if (user.status === 'SUSPENDED') {
            if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
                return next(new ApiError(403, `Your account is temporarily suspended until ${new Date(user.suspendedUntil).toLocaleString()}. Please contact support.`));
            } else {
                // Auto-expire suspension
                await prisma.user.update({
                    where: { id: user.id },
                    data: { status: 'ACTIVE', suspendedUntil: null }
                });
                user.status = 'ACTIVE';
            }
        }

        if (user.canLogin === false && req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
            return next(new ApiError(403, 'Account login is disabled by administrator.'));
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.statusCode) return next(error);
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
            select: {
                id: true, email: true, role: true, isVerified: true, status: true,
                tokenVersion: true, canLogin: true
            }
        });

        if (user && user.status === 'ACTIVE' && (decoded.tokenVersion === undefined || decoded.tokenVersion === user.tokenVersion)) {
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
        if (!req.user) {
            return next(new ApiError(401, 'Not authorized, please log in'));
        }
        const userRole = (req.user.role || '').toUpperCase();
        const allowedRoles = roles.map(r => (r || '').toUpperCase());
        if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
            return next();
        }
        if (!allowedRoles.includes(userRole)) {
            return next(new ApiError(403, `User role ${req.user?.role} is not authorized to access this route`));
        }
        next();
    };
};

const checkPermission = (permissionKey) => {
    return (req, res, next) => {
        if (!req.user) return next(new ApiError(401, 'Not authorized'));
        if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
            return next();
        }
        if (req.user[permissionKey] === false) {
            return next(new ApiError(403, `Permission denied: ${permissionKey} has been disabled for your account by administrator.`));
        }
        next();
    };
};

module.exports = { protect, authorize, optionalAuth, checkPermission };
