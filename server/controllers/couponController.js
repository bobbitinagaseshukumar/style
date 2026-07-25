const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.validateCoupon = asyncHandler(async (req, res, next) => {
    const { code, cartTotal } = req.body;

    const coupon = await prisma.coupon.findUnique({ where: { code } });

    if (!coupon) return next(new ApiError(404, 'Invalid coupon code'));
    if (!coupon.isActive) return next(new ApiError(400, 'Coupon is inactive'));
    if (new Date() > coupon.expiresAt) return next(new ApiError(400, 'Coupon has expired'));
    if (cartTotal < coupon.minOrderAmount) return next(new ApiError(400, `Minimum purchase of ${coupon.minOrderAmount} required`));

    res.status(200).json({
        success: true,
        message: 'Coupon is valid',
        data: {
            discountPercent: coupon.discountPercent,
            maxDiscount: coupon.maxDiscount
        }
    });
});

exports.createCoupon = asyncHandler(async (req, res, next) => {
    const { code, discountPercent, minOrderAmount, maxDiscount, expiresAt, isActive } = req.body;

    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) return next(new ApiError(400, 'Coupon code already exists'));

    const coupon = await prisma.coupon.create({
        data: {
            code: code.toUpperCase(),
            discountPercent: parseFloat(discountPercent),
            minOrderAmount: parseFloat(minOrderAmount || 0),
            maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
            expiresAt: new Date(expiresAt),
            isActive: isActive !== undefined ? isActive : true
        }
    });

    res.status(201).json({
        success: true,
        message: 'Coupon created',
        data: coupon
    });
});

exports.updateCoupon = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.code) updateData.code = updateData.code.toUpperCase();
    if (updateData.discountPercent) updateData.discountPercent = parseFloat(updateData.discountPercent);
    if (updateData.minOrderAmount) updateData.minOrderAmount = parseFloat(updateData.minOrderAmount);
    if (updateData.maxDiscount) updateData.maxDiscount = parseFloat(updateData.maxDiscount);
    if (updateData.expiresAt) updateData.expiresAt = new Date(updateData.expiresAt);

    const coupon = await prisma.coupon.update({
        where: { id },
        data: updateData
    });

    res.status(200).json({
        success: true,
        message: 'Coupon updated',
        data: coupon
    });
});

exports.deleteCoupon = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    await prisma.coupon.delete({ where: { id } });

    res.status(200).json({
        success: true,
        message: 'Coupon deleted',
        data: null
    });
});

exports.getAllCoupons = asyncHandler(async (req, res, next) => {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });

    res.status(200).json({
        success: true,
        message: 'Coupons fetched',
        data: coupons
    });
});
