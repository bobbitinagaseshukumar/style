const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// ==================== GET ALL COUPONS (ADMIN) ====================
exports.getAllCoupons = asyncHandler(async (req, res, next) => {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' }
  });

  // Calculate analytics for each coupon
  const enriched = await Promise.all(coupons.map(async (coupon) => {
    const ordersWithCoupon = await prisma.order.findMany({
      where: { couponCode: coupon.code },
      select: { totalAmount: true, discountAmount: true }
    });

    const totalRevenueGenerated = ordersWithCoupon.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const totalDiscountGiven = ordersWithCoupon.reduce((sum, o) => sum + Number(o.discountAmount || 0), 0);

    return {
      ...coupon,
      analytics: {
        timesUsed: ordersWithCoupon.length,
        totalRevenueGenerated,
        totalDiscountGiven,
        remainingUses: coupon.totalUsageLimit ? Math.max(0, coupon.totalUsageLimit - coupon.currentUsageCount) : null
      }
    };
  }));

  res.status(200).json({ success: true, message: 'Coupons fetched with analytics', data: enriched });
});

// ==================== GET COUPON DASHBOARD STATS ====================
exports.getCouponStats = asyncHandler(async (req, res, next) => {
  const allCoupons = await prisma.coupon.findMany();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalCoupons = allCoupons.length;
  const activeCoupons = allCoupons.filter(c => c.status === 'PUBLISHED' && c.isActive && new Date(c.expiresAt) > now).length;
  const scheduledCoupons = allCoupons.filter(c => c.status === 'SCHEDULED' || new Date(c.startDate) > now).length;
  const expiredCoupons = allCoupons.filter(c => new Date(c.expiresAt) <= now).length;
  const hiddenCoupons = allCoupons.filter(c => c.status === 'HIDDEN').length;
  const disabledCoupons = allCoupons.filter(c => c.status === 'DISABLED' || !c.isActive).length;
  const totalCouponsUsed = allCoupons.reduce((sum, c) => sum + (c.currentUsageCount || 0), 0);

  // Discount given from orders
  const ordersWithCoupons = await prisma.order.findMany({
    where: { couponCode: { not: null } },
    select: { discountAmount: true, createdAt: true }
  });

  const totalDiscountGiven = ordersWithCoupons.reduce((sum, o) => sum + Number(o.discountAmount || 0), 0);
  const todayUsage = ordersWithCoupons.filter(o => new Date(o.createdAt) >= startOfToday).length;
  const monthlyUsage = ordersWithCoupons.filter(o => new Date(o.createdAt) >= startOfMonth).length;

  res.status(200).json({
    success: true,
    data: {
      totalCoupons, activeCoupons, scheduledCoupons, expiredCoupons,
      hiddenCoupons, disabledCoupons, totalCouponsUsed,
      totalDiscountGiven, todayUsage, monthlyUsage
    }
  });
});

// ==================== CREATE COUPON ====================
exports.createCoupon = asyncHandler(async (req, res, next) => {
  const {
    name, code, description, discountType, discountPercent, discountAmount,
    minOrderAmount, maxDiscount, startDate, expiresAt, status, isActive,
    totalUsageLimit, perCustomerLimit, customerEligibility,
    showOnHomepage, showOnOffers, showOnCheckout, showAsPopup, showOnBanner,
    colorTheme, priority, termsConditions
  } = req.body;

  if (!code) return next(new ApiError(400, 'Coupon code is required'));
  if (!expiresAt) return next(new ApiError(400, 'Expiry date is required'));

  const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (existing) return next(new ApiError(400, 'Coupon code already exists'));

  const coupon = await prisma.coupon.create({
    data: {
      name: name || '',
      code: code.toUpperCase(),
      description: description || null,
      discountType: discountType || 'PERCENTAGE',
      discountPercent: discountPercent ? parseFloat(discountPercent) : null,
      discountAmount: discountAmount ? parseFloat(discountAmount) : null,
      minOrderAmount: parseFloat(minOrderAmount || 0),
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      startDate: startDate ? new Date(startDate) : new Date(),
      expiresAt: new Date(expiresAt),
      status: status || 'PUBLISHED',
      isActive: isActive !== undefined ? isActive : true,
      totalUsageLimit: totalUsageLimit ? parseInt(totalUsageLimit) : null,
      perCustomerLimit: perCustomerLimit ? parseInt(perCustomerLimit) : 1,
      customerEligibility: customerEligibility || 'ALL',
      showOnHomepage: showOnHomepage || false,
      showOnOffers: showOnOffers !== undefined ? showOnOffers : true,
      showOnCheckout: showOnCheckout !== undefined ? showOnCheckout : true,
      showAsPopup: showAsPopup || false,
      showOnBanner: showOnBanner || false,
      colorTheme: colorTheme || '#D4AF37',
      priority: priority ? parseInt(priority) : 0,
      termsConditions: termsConditions || null
    }
  });

  res.status(201).json({ success: true, message: 'Coupon created successfully', data: coupon });
});

// ==================== UPDATE COUPON ====================
exports.updateCoupon = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  if (updateData.code) updateData.code = updateData.code.toUpperCase();
  if (updateData.discountPercent) updateData.discountPercent = parseFloat(updateData.discountPercent);
  if (updateData.discountAmount) updateData.discountAmount = parseFloat(updateData.discountAmount);
  if (updateData.minOrderAmount !== undefined) updateData.minOrderAmount = parseFloat(updateData.minOrderAmount);
  if (updateData.maxDiscount) updateData.maxDiscount = parseFloat(updateData.maxDiscount);
  if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
  if (updateData.expiresAt) updateData.expiresAt = new Date(updateData.expiresAt);
  if (updateData.totalUsageLimit) updateData.totalUsageLimit = parseInt(updateData.totalUsageLimit);
  if (updateData.perCustomerLimit) updateData.perCustomerLimit = parseInt(updateData.perCustomerLimit);
  if (updateData.priority !== undefined) updateData.priority = parseInt(updateData.priority);

  const coupon = await prisma.coupon.update({ where: { id }, data: updateData });

  res.status(200).json({ success: true, message: 'Coupon updated', data: coupon });
});

// ==================== DELETE COUPON ====================
exports.deleteCoupon = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { mode } = req.query; // 'HIDE' | 'DISABLE' | 'ARCHIVE' | 'DELETE'

  if (mode === 'HIDE') {
    await prisma.coupon.update({ where: { id }, data: { status: 'HIDDEN' } });
    return res.status(200).json({ success: true, message: 'Coupon hidden from customers' });
  }
  if (mode === 'DISABLE') {
    await prisma.coupon.update({ where: { id }, data: { status: 'DISABLED', isActive: false } });
    return res.status(200).json({ success: true, message: 'Coupon disabled' });
  }
  if (mode === 'ARCHIVE') {
    await prisma.coupon.update({ where: { id }, data: { status: 'ARCHIVED', isActive: false } });
    return res.status(200).json({ success: true, message: 'Coupon archived' });
  }

  await prisma.coupon.delete({ where: { id } });
  res.status(200).json({ success: true, message: 'Coupon permanently deleted', data: null });
});

// ==================== VALIDATE COUPON (CUSTOMER CHECKOUT) ====================
exports.validateCoupon = asyncHandler(async (req, res, next) => {
  const { code, cartTotal } = req.body;

  if (!code) return next(new ApiError(400, 'Please enter a coupon code'));

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

  if (!coupon) return next(new ApiError(404, 'Coupon not found. Please check the code and try again.'));
  if (!coupon.isActive) return next(new ApiError(400, 'This coupon is currently disabled.'));
  if (coupon.status === 'HIDDEN' || coupon.status === 'DISABLED' || coupon.status === 'ARCHIVED' || coupon.status === 'DELETED') {
    return next(new ApiError(400, 'This coupon is no longer available.'));
  }
  if (coupon.status === 'DRAFT') return next(new ApiError(400, 'This coupon is not yet published.'));
  
  const now = new Date();
  if (coupon.startDate && now < new Date(coupon.startDate)) {
    return next(new ApiError(400, 'This coupon is not active yet. It starts on ' + new Date(coupon.startDate).toLocaleDateString()));
  }
  if (now > new Date(coupon.expiresAt)) return next(new ApiError(400, 'This coupon has expired.'));
  if (coupon.totalUsageLimit && coupon.currentUsageCount >= coupon.totalUsageLimit) {
    return next(new ApiError(400, 'This coupon has reached its maximum usage limit.'));
  }
  if (cartTotal < coupon.minOrderAmount) {
    return next(new ApiError(400, `Minimum order of ₹${coupon.minOrderAmount} required to use this coupon.`));
  }

  // Calculate discount
  let discount = 0;
  if (coupon.discountType === 'PERCENTAGE' && coupon.discountPercent) {
    discount = Math.round((cartTotal * coupon.discountPercent) / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else if (coupon.discountType === 'FIXED' && coupon.discountAmount) {
    discount = coupon.discountAmount;
  }

  res.status(200).json({
    success: true,
    message: 'Coupon applied successfully! 🎉',
    data: {
      couponId: coupon.id,
      code: coupon.code,
      name: coupon.name,
      discountType: coupon.discountType,
      discountPercent: coupon.discountPercent,
      discountAmount: discount,
      maxDiscount: coupon.maxDiscount,
      originalTotal: cartTotal,
      finalTotal: Math.max(0, cartTotal - discount),
      amountSaved: discount
    }
  });
});

// ==================== GET PUBLIC COUPONS (CUSTOMER-FACING) ====================
exports.getPublicCoupons = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const coupons = await prisma.coupon.findMany({
    where: {
      status: 'PUBLISHED',
      isActive: true,
      expiresAt: { gt: now },
      startDate: { lte: now }
    },
    orderBy: { priority: 'desc' },
    select: {
      id: true, name: true, code: true, description: true,
      discountType: true, discountPercent: true, discountAmount: true,
      minOrderAmount: true, maxDiscount: true, expiresAt: true,
      showOnHomepage: true, showOnOffers: true, showOnCheckout: true,
      showAsPopup: true, showOnBanner: true, colorTheme: true,
      termsConditions: true
    }
  });

  res.status(200).json({ success: true, data: coupons });
});
