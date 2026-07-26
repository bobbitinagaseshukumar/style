const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');

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

// ==================== 1. GET ALL CUSTOMERS (SEARCH & FILTERS) ====================
exports.getAllCustomers = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 20, search = '', status, filter,
    sortBy = 'createdAt', sortOrder = 'desc'
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  let where = {
    role: { in: ['CUSTOMER', 'USER'] }
  };

  // Search filter
  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { id: { contains: q, mode: 'insensitive' } },
      { fullName: { contains: q, mode: 'insensitive' } },
      { username: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
      { alternatePhone: { contains: q, mode: 'insensitive' } },
    ];
  }

  // Status Filter
  if (status && status !== 'ALL') {
    where.status = status.toUpperCase();
  }

  // Preset Filters
  if (filter) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    if (filter === 'ACTIVE') where.status = 'ACTIVE';
    else if (filter === 'BLOCKED') where.status = 'BLOCKED';
    else if (filter === 'SUSPENDED') where.status = 'SUSPENDED';
    else if (filter === 'PENDING_VERIFICATION') where.isVerified = false;
    else if (filter === 'NEW_CUSTOMERS') where.createdAt = { gte: startOfWeek };
    else if (filter === 'WITH_ORDERS') where.orders = { some: {} };
    else if (filter === 'WITHOUT_ORDERS') where.orders = { none: {} };
  }

  // Count total matching
  const total = await prisma.user.count({ where });

  // Fetch customer list with relations
  const customers = await prisma.user.findMany({
    where,
    skip,
    take: limitNum,
    orderBy: { [sortBy]: sortOrder.toLowerCase() },
    select: {
      id: true, email: true, username: true, fullName: true, firstName: true, lastName: true,
      phone: true, alternatePhone: true, whatsappNumber: true, gender: true, dob: true,
      role: true, isVerified: true, avatar: true, status: true, tokenVersion: true,
      suspendedUntil: true, blockReason: true, blockNotes: true,
      canLogin: true, canPlaceOrders: true, canCancelOrders: true, canReturnProducts: true,
      canAddReviews: true, canAddWishlist: true, canUseCoupons: true, promoNotifications: true,
      lastLoginAt: true, createdAt: true, updatedAt: true,
      _count: {
        select: {
          orders: true,
          reviews: true,
          addresses: true,
          supportTickets: true
        }
      },
      orders: {
        select: { totalAmount: true, status: true }
      }
    }
  });

  // Calculate totals per customer
  const enrichedCustomers = customers.map(c => {
    const totalSpent = c.orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const pendingOrders = c.orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING' || o.status === 'SHIPPED').length;
    const deliveredOrders = c.orders.filter(o => o.status === 'DELIVERED').length;
    const cancelledOrders = c.orders.filter(o => o.status === 'CANCELLED').length;
    const returnedOrders = c.orders.filter(o => o.status === 'RETURNED').length;

    const { orders, ...rest } = c;
    return {
      ...rest,
      stats: {
        totalOrders: c._count.orders,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        returnedOrders,
        totalSpent
      }
    };
  });

  // Overall Statistics Header
  const totalCustomers = await prisma.user.count({ where: { role: { in: ['CUSTOMER', 'USER'] } } });
  const activeCustomers = await prisma.user.count({ where: { role: { in: ['CUSTOMER', 'USER'] }, status: 'ACTIVE' } });
  const blockedCustomers = await prisma.user.count({ where: { role: { in: ['CUSTOMER', 'USER'] }, status: 'BLOCKED' } });
  const suspendedCustomers = await prisma.user.count({ where: { role: { in: ['CUSTOMER', 'USER'] }, status: 'SUSPENDED' } });
  const unverifiedCustomers = await prisma.user.count({ where: { role: { in: ['CUSTOMER', 'USER'] }, isVerified: false } });

  // Calculate total revenue generated by customers
  const allCompletedOrders = await prisma.order.findMany({
    select: { totalAmount: true }
  });
  const totalCustomerRevenue = allCompletedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  res.status(200).json({
    success: true,
    data: {
      customers: enrichedCustomers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      },
      summary: {
        totalCustomers,
        activeCustomers,
        blockedCustomers,
        suspendedCustomers,
        unverifiedCustomers,
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
        take: 20
      },
      adminActionLogs: {
        orderBy: { createdAt: 'desc' },
        take: 20
      },
      recentlyViewed: {
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: { product: { select: { id: true, name: true, price: true, images: true } } }
      },
      notifications: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  if (!customer) {
    return next(new ApiError(404, 'Customer not found'));
  }

  // Calculate order metrics
  const totalOrders = customer.orders.length;
  const pendingOrders = customer.orders.filter(o => ['PENDING', 'PROCESSING', 'SHIPPED'].includes(o.status)).length;
  const deliveredOrders = customer.orders.filter(o => o.status === 'DELIVERED').length;
  const cancelledOrders = customer.orders.filter(o => o.status === 'CANCELLED').length;
  const returnedOrders = customer.orders.filter(o => o.status === 'RETURNED').length;
  const totalAmountSpent = customer.orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const wishlistCount = customer.wishlist?.items?.length || 0;
  const addressCount = customer.addresses.length;

  res.status(200).json({
    success: true,
    data: {
      ...customer,
      metrics: {
        totalOrders,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        returnedOrders,
        totalAmountSpent,
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

  // Check email/username uniqueness if changing
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

  // Update default address if address payload provided
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

// ==================== 4. CHANGE CUSTOMER PASSWORD (WITH FORCE LOGOUT) ====================
exports.changeCustomerPassword = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { newPassword, confirmPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return next(new ApiError(400, 'Password must be at least 6 characters long'));
  }
  if (confirmPassword && newPassword !== confirmPassword) {
    return next(new ApiError(400, 'Passwords do not match'));
  }

  // Password rules validation
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    return next(new ApiError(400, 'Password must contain uppercase, lowercase, number, and special character'));
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return next(new ApiError(404, 'Customer not found'));

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password & increment tokenVersion to force logout from all devices
  const updated = await prisma.user.update({
    where: { id },
    data: {
      password: hashedPassword,
      tokenVersion: { increment: 1 }
    }
  });

  // Create customer notification
  await prisma.notification.create({
    data: {
      userId: id,
      title: 'Password Changed by Administrator',
      message: 'Your account password was reset by an administrator. Please log in using your new password.',
      type: 'SECURITY'
    }
  }).catch(() => {});

  await logAdminAction(req, user, 'PASSWORD_CHANGED', 'Admin manually changed customer password', 'Token version incremented to force logout');

  res.status(200).json({
    success: true,
    message: 'Password changed successfully! Customer has been logged out from all devices.',
    data: { id: updated.id, email: updated.email }
  });
});

// ==================== 5. RESET CUSTOMER PASSWORD (LINK/NOTIFICATION) ====================
exports.sendPasswordReset = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { channel = 'EMAIL' } = req.body; // 'EMAIL' | 'SMS' | 'WHATSAPP'

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return next(new ApiError(404, 'Customer not found'));

  // Generate temporary password
  const tempPass = 'Style' + Math.floor(100000 + Math.random() * 900000) + '!';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(tempPass, salt);

  await prisma.user.update({
    where: { id },
    data: {
      password: hashedPassword,
      tokenVersion: { increment: 1 }
    }
  });

  await prisma.notification.create({
    data: {
      userId: id,
      title: 'Password Reset Initiated',
      message: `Your temporary password is: ${tempPass}. Please log in and change your password immediately.`,
      type: 'SECURITY'
    }
  }).catch(() => {});

  await logAdminAction(req, user, `PASSWORD_RESET_${channel}`, `Admin reset password via ${channel}`, `Temp password generated: ${tempPass}`);

  res.status(200).json({
    success: true,
    message: `Password reset successfully! Temporary password generated & sent via ${channel}.`,
    data: { tempPassword: tempPass }
  });
});

// ==================== 6. BLOCK CUSTOMER ====================
exports.blockCustomer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason = 'Policy Violation', notes = '' } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return next(new ApiError(404, 'Customer not found'));

  const blockedUser = await prisma.user.update({
    where: { id },
    data: {
      status: 'BLOCKED',
      blockReason: reason,
      blockNotes: notes,
      canLogin: false,
      tokenVersion: { increment: 1 } // Instantly invalidates all active sessions
    }
  });

  await logAdminAction(req, user, 'ACCOUNT_BLOCKED', reason, notes);

  res.status(200).json({
    success: true,
    message: `Customer "${user.fullName}" has been blocked & logged out from all devices.`,
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
      suspendedUntil: null
    }
  });

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
      tokenVersion: { increment: 1 }
    }
  });

  await logAdminAction(req, user, 'ACCOUNT_SUSPENDED', reason, `Suspended until ${suspendedUntil.toISOString()}`);

  res.status(200).json({
    success: true,
    message: `Customer suspended until ${suspendedUntil.toLocaleDateString()}. Sessions terminated.`,
    data: suspendedUser
  });
});

// ==================== 9. ACTIVATE / DEACTIVATE CUSTOMER ====================
exports.toggleCustomerStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body; // 'ACTIVE' | 'INACTIVE'

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return next(new ApiError(404, 'Customer not found'));

  const updatedStatus = status ? status.toUpperCase() : (user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      status: updatedStatus,
      canLogin: updatedStatus === 'ACTIVE',
      tokenVersion: updatedStatus === 'INACTIVE' ? { increment: 1 } : user.tokenVersion
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
    canLogin, canPlaceOrders, canCancelOrders, canReturnProducts,
    canAddReviews, canAddWishlist, canUseCoupons, promoNotifications
  } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return next(new ApiError(404, 'Customer not found'));

  const updatedPermissions = await prisma.user.update({
    where: { id },
    data: {
      canLogin: canLogin !== undefined ? canLogin : user.canLogin,
      canPlaceOrders: canPlaceOrders !== undefined ? canPlaceOrders : user.canPlaceOrders,
      canCancelOrders: canCancelOrders !== undefined ? canCancelOrders : user.canCancelOrders,
      canReturnProducts: canReturnProducts !== undefined ? canReturnProducts : user.canReturnProducts,
      canAddReviews: canAddReviews !== undefined ? canAddReviews : user.canAddReviews,
      canAddWishlist: canAddWishlist !== undefined ? canAddWishlist : user.canAddWishlist,
      canUseCoupons: canUseCoupons !== undefined ? canUseCoupons : user.canUseCoupons,
      promoNotifications: promoNotifications !== undefined ? promoNotifications : user.promoNotifications,
    }
  });

  await logAdminAction(req, user, 'PERMISSIONS_UPDATED', 'Admin modified feature permission switches', JSON.stringify(req.body));

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

  await logAdminAction(req, user, 'FORCE_LOGOUT', 'Admin terminated all active customer sessions');

  res.status(200).json({
    success: true,
    message: `Customer "${user.fullName}" forcibly logged out from all active devices.`
  });
});

// ==================== 12. CASCADING DELETE CUSTOMER ====================
exports.deleteCustomer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const {
    deleteAccountOnly = false,
    deleteWishlist = false,
    deleteAddresses = false,
    deleteReviews = false,
    deleteMessages = false,
    deleteAll = true
  } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return next(new ApiError(404, 'Customer not found'));

  if (deleteAll || deleteReviews) {
    await prisma.review.deleteMany({ where: { userId: id } }).catch(() => {});
  }
  if (deleteAll || deleteWishlist) {
    await prisma.wishlist.deleteMany({ where: { userId: id } }).catch(() => {});
  }
  if (deleteAll || deleteAddresses) {
    await prisma.address.deleteMany({ where: { userId: id } }).catch(() => {});
  }
  if (deleteAll || deleteMessages) {
    await prisma.notification.deleteMany({ where: { userId: id } }).catch(() => {});
    await prisma.supportTicket.deleteMany({ where: { userId: id } }).catch(() => {});
  }

  // Always delete user
  await prisma.user.delete({ where: { id } });

  await logAdminAction(req, user, 'ACCOUNT_DELETED', 'Admin deleted customer account', JSON.stringify({ deleteAll, deleteReviews, deleteWishlist, deleteAddresses }));

  res.status(200).json({
    success: true,
    message: `Customer account "${user.fullName}" permanently removed.`,
    data: null
  });
});

// ==================== 13. GET CUSTOMER ACTIVITY & AUDIT LOGS ====================
exports.getCustomerLogs = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const activityLogs = await prisma.activityLog.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  const adminActionLogs = await prisma.adminActionLog.findMany({
    where: { targetUserId: id },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  res.status(200).json({
    success: true,
    data: { activityLogs, adminActionLogs }
  });
});
