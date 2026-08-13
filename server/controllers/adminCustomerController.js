const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');

// Helper: Generate unique Customer ID like CUS000001 (Guaranteed Unique & Sequential)
const generateCustomerId = async () => {
  try {
    const latestCustomer = await prisma.user.findFirst({
      where: { customerId: { startsWith: 'CUS' } },
      orderBy: { createdAt: 'desc' },
      select: { customerId: true }
    });

    let nextNum = 1;
    if (latestCustomer?.customerId) {
      const numPart = parseInt(latestCustomer.customerId.replace('CUS', ''), 10);
      if (!isNaN(numPart)) {
        nextNum = numPart + 1;
      }
    }

    let candidate = `CUS${String(nextNum).padStart(6, '0')}`;
    let exists = await prisma.user.findUnique({ where: { customerId: candidate } });
    while (exists) {
      nextNum++;
      candidate = `CUS${String(nextNum).padStart(6, '0')}`;
      exists = await prisma.user.findUnique({ where: { customerId: candidate } });
    }

    return candidate;
  } catch (err) {
    console.error('generateCustomerId error:', err.message);
    return `CUS${Math.floor(100000 + Math.random() * 900000)}`;
  }
};

// Helper: Log Admin Action
const logAdminAction = async (req, targetUser, action, reason = null, details = null) => {
  try {
    const adminName = req.user?.fullName || req.user?.email || 'Administrator';
    await prisma.adminActionLog.create({
      data: {
        adminId: req.user?.id || null,
        adminName,
        targetUserId: targetUser?.id || null,
        targetName: targetUser?.fullName || targetUser?.email || 'Customer',
        action,
        reason,
        details,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
        userAgent: req.headers['user-agent'] || null,
      }
    });
  } catch (err) {
    console.error('Failed to log admin action:', err.message);
  }
};

// Helper: Build safe where clause for search
const buildSearchWhere = (search, extra = {}, roleQuery = null) => {
  const where = { ...extra };
  if (roleQuery) {
    const upperRole = roleQuery.toUpperCase();
    if (upperRole === 'CUSTOMER') {
      where.role = { in: ['CUSTOMER', 'USER'] };
    } else {
      where.role = upperRole;
    }
  }
  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { fullName: { contains: q, mode: 'insensitive' } },
      { username: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
      { alternatePhone: { contains: q, mode: 'insensitive' } },
      { customerId: { contains: q, mode: 'insensitive' } },
    ];
  }
  return where;
};

// ==================== 1. GET ALL CUSTOMERS (FAST & HIGH-PERFORMANCE) ====================
exports.getAllCustomers = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 20, search = '', status, filter,
    sortBy = 'createdAt', sortOrder = 'desc'
  } = req.query;

  const pageNum = Math.max(parseInt(page) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  let where = buildSearchWhere(search, {}, req.query.role || 'CUSTOMER');

  // Status Filter
  if (status && status !== 'ALL') {
    where.status = status.toUpperCase();
  }

  // Preset Filters
  if (filter) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    if (filter === 'ACTIVE') where.status = 'ACTIVE';
    else if (filter === 'BLOCKED') where.status = 'BLOCKED';
    else if (filter === 'SUSPENDED') where.status = 'SUSPENDED';
    else if (filter === 'PENDING_VERIFICATION') where.isVerified = false;
    else if (filter === 'NEW_CUSTOMERS') where.createdAt = { gte: startOfWeek };
    else if (filter === 'WITH_ORDERS') where.orders = { some: {} };
    else if (filter === 'WITHOUT_ORDERS') where.orders = { none: {} };
  }

  const allowedSort = ['createdAt', 'lastLoginAt', 'fullName', 'email', 'status', 'updatedAt'];
  const safeSortBy = allowedSort.includes(sortBy) ? sortBy : 'createdAt';
  const orderDirection = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

  // Step 1: Fetch paginated customer list & count matching total
  const [total, customers] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [safeSortBy]: orderDirection },
      select: {
        id: true, customerId: true, email: true, username: true, fullName: true,
        firstName: true, lastName: true, phone: true, alternatePhone: true,
        whatsappNumber: true, gender: true, dob: true, role: true,
        isVerified: true, avatar: true, status: true, tokenVersion: true,
        suspendedUntil: true, blockReason: true, blockNotes: true,
        canLogin: true, canCheckout: true, canPlaceOrders: true, canCancelOrders: true,
        canReturnProducts: true, canAddReviews: true, canAddWishlist: true,
        canUseCoupons: true, canUseWallet: true, canUseReferral: true,
        promoNotifications: true, lastLoginAt: true, createdAt: true, updatedAt: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
            addresses: true
          }
        }
      }
    })
  ]);

  // Step 2: Fetch order statistics ONLY for the customers on the current page
  const customerIds = customers.map(c => c.id);
  const spendingMap = {};
  const orderStatsMap = {};

  if (customerIds.length > 0) {
    const pageOrders = await prisma.order.findMany({
      where: { userId: { in: customerIds } },
      select: { userId: true, totalAmount: true, status: true }
    });

    pageOrders.forEach(o => {
      if (!spendingMap[o.userId]) spendingMap[o.userId] = 0;
      spendingMap[o.userId] += Number(o.totalAmount || 0);

      if (!orderStatsMap[o.userId]) {
        orderStatsMap[o.userId] = { pending: 0, delivered: 0, cancelled: 0, returned: 0 };
      }
      if (['PENDING', 'PROCESSING', 'SHIPPED'].includes(o.status)) orderStatsMap[o.userId].pending++;
      if (o.status === 'DELIVERED') orderStatsMap[o.userId].delivered++;
      if (o.status === 'CANCELLED') orderStatsMap[o.userId].cancelled++;
      if (o.status === 'RETURNED') orderStatsMap[o.userId].returned++;
    });
  }

  const enrichedCustomers = customers.map(c => {
    const stats = orderStatsMap[c.id] || { pending: 0, delivered: 0, cancelled: 0, returned: 0 };
    return {
      ...c,
      stats: {
        totalOrders: c._count.orders,
        pendingOrders: stats.pending,
        deliveredOrders: stats.delivered,
        cancelledOrders: stats.cancelled,
        returnedOrders: stats.returned,
        totalSpent: spendingMap[c.id] || 0
      }
    };
  });

  // Step 3: Fast Overall Statistics Header (Optimized SQL aggregations)
  const [statusCounts, unverifiedCount, totalRevenueAgg] = await Promise.all([
    prisma.user.groupBy({
      by: ['status'],
      where: { role: { in: ['CUSTOMER', 'USER'] } },
      _count: { id: true }
    }),
    prisma.user.count({
      where: { role: { in: ['CUSTOMER', 'USER'] }, isVerified: false }
    }),
    prisma.order.aggregate({
      _sum: { totalAmount: true }
    })
  ]);

  let totalCustomers = 0;
  let activeCustomers = 0;
  let blockedCustomers = 0;
  let suspendedCustomers = 0;

  statusCounts.forEach(sc => {
    const cnt = sc._count.id;
    totalCustomers += cnt;
    if (sc.status === 'ACTIVE') activeCustomers = cnt;
    if (sc.status === 'BLOCKED') blockedCustomers = cnt;
    if (sc.status === 'SUSPENDED') suspendedCustomers = cnt;
  });

  const totalCustomerRevenue = Number(totalRevenueAgg._sum?.totalAmount || 0);

  res.status(200).json({
    success: true,
    data: {
      customers: enrichedCustomers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1
      },
      summary: {
        totalCustomers,
        activeCustomers,
        blockedCustomers,
        suspendedCustomers,
        unverifiedCustomers: unverifiedCount,
        totalCustomerRevenue
      }
    }
  });
});

// ==================== 2. VIEW FULL CUSTOMER PROFILE ====================
exports.getCustomerProfile = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: { orderBy: { isDefault: 'desc' } },
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          items: {
            include: { product: { select: { name: true, images: true } } }
          }
        }
      },
      wishlist: {
        include: {
          items: {
            include: { product: { select: { id: true, name: true, price: true, images: true } } }
          }
        }
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { product: { select: { name: true } } }
      },
      activityLogs: {
        orderBy: { createdAt: 'desc' },
        take: 30
      },
      adminActionLogs: {
        orderBy: { createdAt: 'desc' },
        take: 30
      },
      recentlyViewed: {
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: { product: { select: { id: true, name: true, price: true, images: true } } }
      },
      notifications: {
        orderBy: { createdAt: 'desc' },
        take: 15
      },
      loginHistory: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  if (!customer) {
    return next(new ApiError(404, 'Customer not found'));
  }

  const { password, otpCode, ...safeCustomer } = customer;

  const totalOrders = customer.orders.length;
  const pendingOrders = customer.orders.filter(o => ['PENDING', 'PROCESSING', 'SHIPPED'].includes(o.status)).length;
  const deliveredOrders = customer.orders.filter(o => o.status === 'DELIVERED').length;
  const cancelledOrders = customer.orders.filter(o => o.status === 'CANCELLED').length;
  const returnedOrders = customer.orders.filter(o => o.status === 'RETURNED').length;
  const totalAmountSpent = customer.orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalAmountSpent / totalOrders : 0;
  const wishlistCount = customer.wishlist?.items?.length || 0;
  const addressCount = customer.addresses.length;

  res.status(200).json({
    success: true,
    data: {
      ...safeCustomer,
      metrics: {
        totalOrders,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        returnedOrders,
        totalAmountSpent,
        avgOrderValue,
        wishlistCount,
        addressCount
      }
    }
  });
});

// ==================== 3. EDIT CUSTOMER DETAILS ====================
exports.updateCustomerDetails = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const {
    firstName, lastName, fullName, username, email, phone, alternatePhone,
    whatsappNumber, gender, dob, avatar, preferredLanguage, address
  } = req.body;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return next(new ApiError(404, 'Customer not found'));
  }

  if (email && email.toLowerCase() !== existing.email.toLowerCase()) {
    const emailTaken = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (emailTaken) return next(new ApiError(400, 'Email address is already in use by another account'));
  }
  if (username && username !== existing.username) {
    const userTaken = await prisma.user.findUnique({ where: { username } });
    if (userTaken) return next(new ApiError(400, 'Username is already taken'));
  }

  const computedFullName = fullName || `${firstName || ''} ${lastName || ''}`.trim() || existing.fullName;

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      firstName: firstName !== undefined ? firstName : existing.firstName,
      lastName: lastName !== undefined ? lastName : existing.lastName,
      fullName: computedFullName,
      username: username !== undefined ? username : existing.username,
      email: email ? email.toLowerCase() : existing.email,
      phone: phone !== undefined ? phone : existing.phone,
      alternatePhone: alternatePhone !== undefined ? alternatePhone : existing.alternatePhone,
      whatsappNumber: whatsappNumber !== undefined ? whatsappNumber : existing.whatsappNumber,
      gender: gender !== undefined ? gender : existing.gender,
      dob: dob ? new Date(dob) : existing.dob,
      avatar: avatar !== undefined ? avatar : existing.avatar,
      preferredLanguage: preferredLanguage || existing.preferredLanguage
    }
  });

  if (address && typeof address === 'object') {
    const defaultAddr = await prisma.address.findFirst({ where: { userId: id, isDefault: true } });
    if (defaultAddr) {
      await prisma.address.update({
        where: { id: defaultAddr.id },
        data: {
          name: computedFullName,
          street: address.street || address.address || defaultAddr.street,
          city: address.city || defaultAddr.city,
          district: address.district || defaultAddr.district,
          state: address.state || defaultAddr.state,
          country: address.country || defaultAddr.country,
          pinCode: address.pinCode || defaultAddr.pinCode,
          phone: phone || defaultAddr.phone
        }
      });
    } else if (address.street || address.address) {
      await prisma.address.create({
        data: {
          userId: id,
          name: computedFullName,
          street: address.street || address.address || '',
          city: address.city || '',
          district: address.district || '',
          state: address.state || '',
          country: address.country || 'India',
          pinCode: address.pinCode || '',
          phone: phone || '',
          isDefault: true
        }
      });
    }
  }

  await logAdminAction(req, updatedUser, 'PROFILE_UPDATED', 'Admin modified customer profile info', JSON.stringify(req.body));

  res.status(200).json({
    success: true,
    message: 'Customer information updated successfully!',
    data: updatedUser
  });
});

// ==================== 4. CHANGE CUSTOMER PASSWORD ====================
exports.changeCustomerPassword = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { newPassword, confirmPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return next(new ApiError(400, 'Password must be at least 6 characters long'));
  }
  if (confirmPassword && newPassword !== confirmPassword) {
    return next(new ApiError(400, 'Passwords do not match'));
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return next(new ApiError(404, 'Customer not found'));

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  const updated = await prisma.user.update({
    where: { id },
    data: {
      password: hashedPassword,
      tokenVersion: { increment: 1 }
    }
  });

  await prisma.notification.create({
    data: {
      userId: id,
      title: 'Password Changed by Administrator',
      message: 'Your account password was reset by an administrator. Please log in using your new password.',
      type: 'SECURITY'
    }
  }).catch(() => {});

  await logAdminAction(req, user, 'PASSWORD_CHANGED', 'Admin manually changed customer password', 'Token version incremented');

  res.status(200).json({
    success: true,
    message: 'Password changed successfully! Customer has been logged out from all devices.',
    data: { id: updated.id, email: updated.email }
  });
});

// ==================== 5. RESET CUSTOMER PASSWORD ====================
exports.sendPasswordReset = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { channel = 'EMAIL' } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return next(new ApiError(404, 'Customer not found'));

  const tempPass = 'Style' + Math.floor(100000 + Math.random() * 900000) + '!';
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(tempPass, salt);

  await prisma.user.update({
    where: { id },
    data: {
      password: hashedPassword,
      tokenVersion: { increment: 1 },
      mustChangePassword: true
    }
  });

  await prisma.notification.create({
    data: {
      userId: id,
      title: 'Password Reset by Administrator',
      message: `Your account password was reset. Temporary password: ${tempPass}`,
      type: 'SECURITY'
    }
  }).catch(() => {});

  await logAdminAction(req, user, `PASSWORD_RESET_${channel}`, `Admin reset password via ${channel}`, `Temp password generated`);

  res.status(200).json({
    success: true,
    message: `Password reset successfully! Temporary password generated & notified via ${channel}.`,
    data: { tempPassword: tempPass, email: user.email }
  });
});

// ==================== 6. BLOCK CUSTOMER ====================
exports.blockCustomer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason = 'Policy Violation', notes = '' } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return next(new ApiError(404, 'Customer not found'));
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return next(new ApiError(403, 'Cannot block an admin account from this endpoint'));
  }

  const blockedUser = await prisma.user.update({
    where: { id },
    data: {
      status: 'BLOCKED',
      blockReason: reason,
      blockNotes: notes,
      canLogin: false,
      canCheckout: false,
      canPlaceOrders: false,
      tokenVersion: { increment: 1 }
    }
  });

  await prisma.notification.create({
    data: {
      userId: id,
      title: 'Account Blocked',
      message: `Your account has been blocked. Reason: ${reason}. Please contact support.`,
      type: 'ACCOUNT'
    }
  }).catch(() => {});

  await logAdminAction(req, user, 'ACCOUNT_BLOCKED', reason, notes);

  res.status(200).json({
    success: true,
    message: `Customer "${user.fullName}" has been blocked & logged out.`,
    data: blockedUser
  });
});

// ==================== 7. UNBLOCK CUSTOMER ====================
exports.unblockCustomer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return next(new ApiError(404, 'Customer not found'));

  const unblockedUser = await prisma.user.update({
    where: { id },
    data: {
      status: 'ACTIVE',
      blockReason: null,
      blockNotes: null,
      canLogin: true,
      canCheckout: true,
      canPlaceOrders: true,
      canAddWishlist: true,
      canAddReviews: true,
      canUseCoupons: true,
      suspendedUntil: null
    }
  });

  await prisma.notification.create({
    data: {
      userId: id,
      title: 'Account Restored',
      message: 'Your account has been unblocked. You can now log in and shop as usual.',
      type: 'ACCOUNT'
    }
  }).catch(() => {});

  await logAdminAction(req, user, 'ACCOUNT_UNBLOCKED', 'Admin unblocked customer account');

  res.status(200).json({
    success: true,
    message: `Customer "${user.fullName}" has been unblocked. Full access restored.`,
    data: unblockedUser
  });
});

// ==================== 8. SUSPEND CUSTOMER ====================
exports.suspendCustomer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { durationDays, customDate, reason = 'Temporary Suspension' } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return next(new ApiError(404, 'Customer not found'));

  let suspendedUntil = new Date();
  if (customDate) {
    suspendedUntil = new Date(customDate);
  } else {
    const days = parseInt(durationDays || 7);
    suspendedUntil.setDate(suspendedUntil.getDate() + days);
  }

  const suspendedUser = await prisma.user.update({
    where: { id },
    data: {
      status: 'SUSPENDED',
      suspendedUntil,
      blockReason: reason,
      canLogin: false,
      tokenVersion: { increment: 1 }
    }
  });

  await prisma.notification.create({
    data: {
      userId: id,
      title: 'Account Suspended',
      message: `Your account has been suspended until ${suspendedUntil.toLocaleDateString()}. Reason: ${reason}.`,
      type: 'ACCOUNT'
    }
  }).catch(() => {});

  await logAdminAction(req, user, 'ACCOUNT_SUSPENDED', reason, `Suspended until ${suspendedUntil.toISOString()}`);

  res.status(200).json({
    success: true,
    message: `Customer suspended until ${suspendedUntil.toLocaleDateString()}.`,
    data: suspendedUser
  });
});

// ==================== 9. ACTIVATE / DEACTIVATE CUSTOMER ====================
exports.toggleCustomerStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return next(new ApiError(404, 'Customer not found'));

  const updatedStatus = status ? status.toUpperCase() : (user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      status: updatedStatus,
      canLogin: updatedStatus === 'ACTIVE',
      tokenVersion: updatedStatus === 'INACTIVE' ? { increment: 1 } : undefined
    }
  });

  await logAdminAction(req, user, `ACCOUNT_${updatedStatus}`, `Status changed to ${updatedStatus}`);

  res.status(200).json({
    success: true,
    message: `Customer status updated to ${updatedStatus}`,
    data: updatedUser
  });
});

// ==================== 10. UPDATE CUSTOMER PERMISSIONS ====================
exports.updateCustomerPermissions = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const {
    canLogin, canCheckout, canPlaceOrders, canCancelOrders, canReturnProducts,
    canAddReviews, canAddWishlist, canUseCoupons, canUseWallet, canUseReferral, promoNotifications
  } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return next(new ApiError(404, 'Customer not found'));

  const updateData = {};
  if (canLogin !== undefined) updateData.canLogin = Boolean(canLogin);
  if (canCheckout !== undefined) updateData.canCheckout = Boolean(canCheckout);
  if (canPlaceOrders !== undefined) updateData.canPlaceOrders = Boolean(canPlaceOrders);
  if (canCancelOrders !== undefined) updateData.canCancelOrders = Boolean(canCancelOrders);
  if (canReturnProducts !== undefined) updateData.canReturnProducts = Boolean(canReturnProducts);
  if (canAddReviews !== undefined) updateData.canAddReviews = Boolean(canAddReviews);
  if (canAddWishlist !== undefined) updateData.canAddWishlist = Boolean(canAddWishlist);
  if (canUseCoupons !== undefined) updateData.canUseCoupons = Boolean(canUseCoupons);
  if (canUseWallet !== undefined) updateData.canUseWallet = Boolean(canUseWallet);
  if (canUseReferral !== undefined) updateData.canUseReferral = Boolean(canUseReferral);
  if (promoNotifications !== undefined) updateData.promoNotifications = Boolean(promoNotifications);

  const updatedPermissions = await prisma.user.update({ where: { id }, data: updateData });

  await logAdminAction(req, user, 'PERMISSIONS_UPDATED', 'Admin modified feature permissions', JSON.stringify(req.body));

  res.status(200).json({
    success: true,
    message: 'Customer feature permissions updated successfully!',
    data: updatedPermissions
  });
});

// ==================== 11. FORCE LOGOUT CUSTOMER ====================
exports.forceLogoutCustomer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return next(new ApiError(404, 'Customer not found'));

  await prisma.user.update({
    where: { id },
    data: { tokenVersion: { increment: 1 } }
  });

  await prisma.notification.create({
    data: {
      userId: id,
      title: 'Session Terminated',
      message: 'You have been logged out from all devices by an administrator.',
      type: 'SECURITY'
    }
  }).catch(() => {});

  await logAdminAction(req, user, 'FORCE_LOGOUT', 'Admin terminated active customer sessions');

  res.status(200).json({
    success: true,
    message: `Customer "${user.fullName}" forcibly logged out from all devices.`
  });
});

// ==================== 12. CASCADING DELETE CUSTOMER ====================
exports.deleteCustomer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const {
    deleteWishlist = false,
    deleteAddresses = false,
    deleteReviews = false,
    deleteMessages = false,
    deleteAll = true
  } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return next(new ApiError(404, 'Customer not found'));
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return next(new ApiError(403, 'Cannot delete an admin account from customer management'));
  }

  if (deleteAll || deleteReviews) {
    await prisma.review.deleteMany({ where: { userId: id } }).catch(() => {});
  }
  if (deleteAll || deleteWishlist) {
    const wishlist = await prisma.wishlist.findUnique({ where: { userId: id } });
    if (wishlist) {
      await prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id } }).catch(() => {});
      await prisma.wishlist.delete({ where: { id: wishlist.id } }).catch(() => {});
    }
  }
  if (deleteAll || deleteAddresses) {
    await prisma.address.deleteMany({ where: { userId: id } }).catch(() => {});
  }
  if (deleteAll || deleteMessages) {
    await prisma.notification.deleteMany({ where: { userId: id } }).catch(() => {});
    await prisma.supportTicket.deleteMany({ where: { userId: id } }).catch(() => {});
  }

  await prisma.activityLog.deleteMany({ where: { userId: id } }).catch(() => {});
  await prisma.recentlyViewed.deleteMany({ where: { userId: id } }).catch(() => {});
  await prisma.emailOTP.deleteMany({ where: { userId: id } }).catch(() => {});

  const cart = await prisma.cart.findUnique({ where: { userId: id } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } }).catch(() => {});
    await prisma.cart.delete({ where: { id: cart.id } }).catch(() => {});
  }

  await logAdminAction(req, user, 'ACCOUNT_DELETED', 'Admin permanently deleted customer account');

  await prisma.user.delete({ where: { id } });

  res.status(200).json({
    success: true,
    message: `Customer account "${user.fullName}" permanently removed.`,
    data: null
  });
});

// ==================== 13. GET CUSTOMER ACTIVITY & AUDIT LOGS ====================
exports.getCustomerLogs = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const [activityLogs, adminActionLogs] = await Promise.all([
    prisma.activityLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 50
    }),
    prisma.adminActionLog.findMany({
      where: { targetUserId: id },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
  ]);

  res.status(200).json({
    success: true,
    data: { activityLogs, adminActionLogs }
  });
});

// ==================== 14. UPDATE ADMIN NOTES (PRIVATE) ====================
exports.updateAdminNotes = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { adminNotes } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return next(new ApiError(404, 'Customer not found'));

  const updated = await prisma.user.update({
    where: { id },
    data: { blockNotes: adminNotes || null }
  });

  await logAdminAction(req, user, 'ADMIN_NOTES_UPDATED', 'Admin updated private notes');

  res.status(200).json({
    success: true,
    message: 'Admin notes updated.',
    data: { adminNotes: updated.blockNotes }
  });
});

// ==================== 15. SEND MESSAGE / NOTIFICATION TO CUSTOMER ====================
exports.sendCustomerMessage = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { title, message, type = 'ADMIN' } = req.body;

  if (!title || !message) return next(new ApiError(400, 'Title and message are required'));

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return next(new ApiError(404, 'Customer not found'));

  await prisma.notification.create({
    data: { userId: id, title, message, type }
  });

  await logAdminAction(req, user, 'MESSAGE_SENT', 'Admin sent message to customer', title);

  res.status(200).json({ success: true, message: 'Message sent to customer dashboard.' });
});

// ==================== 16. DETECT DUPLICATE ACCOUNTS ====================
exports.getDuplicates = asyncHandler(async (req, res) => {
  const phoneGroups = await prisma.user.groupBy({
    by: ['phone'],
    where: { role: { in: ['CUSTOMER', 'USER'] }, phone: { not: null } },
    _count: { phone: true },
    having: { phone: { _count: { gt: 1 } } }
  });

  const duplicatePhones = phoneGroups.map(g => g.phone);

  let duplicates = [];
  if (duplicatePhones.length > 0) {
    const users = await prisma.user.findMany({
      where: { phone: { in: duplicatePhones }, role: { in: ['CUSTOMER', 'USER'] } },
      select: {
        id: true, customerId: true, fullName: true, email: true, phone: true,
        status: true, createdAt: true, lastLoginAt: true
      }
    });

    const grouped = {};
    for (const u of users) {
      if (!grouped[u.phone]) grouped[u.phone] = [];
      grouped[u.phone].push(u);
    }
    duplicates = Object.entries(grouped).map(([phone, accounts]) => ({
      type: 'SAME_PHONE',
      phone,
      accounts
    }));
  }

  res.status(200).json({
    success: true,
    data: { duplicates, total: duplicates.length }
  });
});

// ==================== 17. ASSIGN MISSING CUSTOMER IDS ====================
exports.assignMissingCustomerIds = asyncHandler(async (req, res) => {
  const customers = await prisma.user.findMany({
    where: { role: { in: ['CUSTOMER', 'USER'] }, customerId: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true }
  });

  let updated = 0;
  for (const c of customers) {
    const cid = await generateCustomerId();
    await prisma.user.update({ where: { id: c.id }, data: { customerId: cid } });
    updated++;
  }

  res.status(200).json({
    success: true,
    message: `Assigned Customer IDs to ${updated} customers.`
  });
});

exports.generateCustomerId = generateCustomerId;
