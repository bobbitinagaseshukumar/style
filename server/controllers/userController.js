const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// ==================== PROFILE MANAGEMENT ====================
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const body = req.body?.user || req.body || {};
  const {
    fullName, phone, alternatePhone, altPhone, gender, dob, avatar,
    preferredLanguage, emailNotifications, smsNotifications, promoNotifications,
    address, street, city, district, state, country, zipCode, postalCode
  } = body;

  const updatePayload = {};
  if (fullName !== undefined) updatePayload.fullName = String(fullName).trim();
  if (phone !== undefined) updatePayload.phone = String(phone).trim();
  if (alternatePhone !== undefined || altPhone !== undefined) {
    updatePayload.alternatePhone = String(alternatePhone || altPhone).trim();
  }
  if (gender !== undefined) updatePayload.gender = String(gender).trim();
  if (dob !== undefined) updatePayload.dob = dob ? new Date(dob) : null;
  if (avatar !== undefined) updatePayload.avatar = String(avatar).trim();
  if (preferredLanguage !== undefined) updatePayload.preferredLanguage = String(preferredLanguage).trim();
  if (emailNotifications !== undefined) updatePayload.emailNotifications = Boolean(emailNotifications);
  if (smsNotifications !== undefined) updatePayload.smsNotifications = Boolean(smsNotifications);
  if (promoNotifications !== undefined) updatePayload.promoNotifications = Boolean(promoNotifications);

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: updatePayload,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      alternatePhone: true,
      gender: true,
      dob: true,
      role: true,
      isVerified: true,
      avatar: true,
      preferredLanguage: true,
      emailNotifications: true,
      smsNotifications: true,
      promoNotifications: true,
    },
  });

  // If address info is provided, update or create default Address record
  const streetAddress = address || street;
  const zip = zipCode || postalCode;
  if (streetAddress !== undefined || city !== undefined || zip !== undefined || state !== undefined || country !== undefined) {
    const existingDefault = await prisma.address.findFirst({
      where: { userId: req.user.id, isDefault: true }
    }) || await prisma.address.findFirst({
      where: { userId: req.user.id }
    });

    if (existingDefault) {
      await prisma.address.update({
        where: { id: existingDefault.id },
        data: {
          fullName: fullName || updatedUser.fullName,
          phone: phone || updatedUser.phone || '',
          street: streetAddress !== undefined ? String(streetAddress).trim() : existingDefault.street,
          city: city !== undefined ? String(city).trim() : existingDefault.city,
          state: state !== undefined ? String(state).trim() : existingDefault.state,
          postalCode: zip !== undefined ? String(zip).trim() : existingDefault.postalCode,
          country: country !== undefined ? String(country).trim() : existingDefault.country,
        }
      });
    } else if (streetAddress || city || zip) {
      await prisma.address.create({
        data: {
          userId: req.user.id,
          fullName: fullName || updatedUser.fullName,
          phone: phone || updatedUser.phone || '',
          street: streetAddress ? String(streetAddress).trim() : '',
          city: city ? String(city).trim() : '',
          state: state ? String(state).trim() : '',
          postalCode: zip ? String(zip).trim() : '',
          country: country ? String(country).trim() : 'India',
          isDefault: true
        }
      });
    }
  }

  // Fetch primary address to include in returned data
  const primaryAddress = await prisma.address.findFirst({
    where: { userId: req.user.id, isDefault: true }
  }) || await prisma.address.findFirst({
    where: { userId: req.user.id }
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      ...updatedUser,
      primaryAddress,
      address: primaryAddress?.street || '',
      city: primaryAddress?.city || '',
      state: primaryAddress?.state || '',
      zipCode: primaryAddress?.postalCode || '',
      country: primaryAddress?.country || 'India',
    },
  });
});

// ==================== PASSWORD MANAGEMENT WITH MANDATORY OTP ====================
exports.requestPasswordOTP = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword, isForgotFlow } = req.body;

  if (!newPassword) {
    return next(new ApiError(400, 'New password is required'));
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return next(new ApiError(404, 'User not found'));

  // Verify current password only if not in forgot password flow
  if (!isForgotFlow && currentPassword) {
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return next(new ApiError(400, 'Current password is incorrect. Click "Forgot Current Password?" if you forgot it.'));
    }
  } else if (!isForgotFlow && !currentPassword) {
    return next(new ApiError(400, 'Current password is required or click "Forgot Current Password?"'));
  }

  if (currentPassword && currentPassword === newPassword) {
    return next(new ApiError(400, 'New password cannot be the same as your current password.'));
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return next(new ApiError(400, 'New password must be at least 8 characters long and contain uppercase, lowercase, number, and a special character.'));
  }

  // Generate 6-digit OTP code
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  await prisma.user.update({
    where: { id: req.user.id },
    data: {
      otpCode,
      otpExpiresAt,
    },
  });

  // Send OTP Email
  try {
    const { sendOTPEmail } = require('../services/emailService');
    await sendOTPEmail(user.email, user.fullName, otpCode);
  } catch (e) {
    console.error('Failed to send password OTP email:', e);
  }

  res.status(200).json({
    success: true,
    message: `Security OTP sent to your registered email (${user.email}). Please enter the 6-digit code to complete password change.`,
    data: { email: user.email, otpCode }
  });
});

exports.verifyPasswordOTP = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword, otpCode, isForgotFlow } = req.body;

  if (!newPassword || !otpCode) {
    return next(new ApiError(400, 'New password and OTP verification code are required'));
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return next(new ApiError(404, 'User not found'));

  // Verify current password only if provided and not in forgot-password mode
  if (currentPassword && !isForgotFlow) {
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return next(new ApiError(400, 'Current password is incorrect. Click "Forgot Password?" if you forgot it.'));
    }
  }

  if (!user.otpCode || user.otpCode !== String(otpCode).trim()) {
    return next(new ApiError(400, 'Invalid verification OTP code. Please check the code sent to your email.'));
  }

  if (!user.otpExpiresAt || new Date() > new Date(user.otpExpiresAt)) {
    return next(new ApiError(400, 'OTP code has expired. Please request a new OTP.'));
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 12);

  // Store current password in previousPassword, update password, and clear OTP
  await prisma.user.update({
    where: { id: req.user.id },
    data: {
      password: hashedNewPassword,
      otpCode: null,
      otpExpiresAt: null,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'PASSWORD_CHANGED',
      details: 'Security password changed successfully via OTP verification.',
      ipAddress: req.ip || 'Unknown IP',
    },
  });

  res.status(200).json({
    success: true,
    message: 'Password updated successfully! Please use your new password for future logins.',
  });
});

exports.updatePassword = exports.verifyPasswordOTP;

// ==================== FORCE LOGOUT ALL DEVICES ====================
exports.logoutAllDevices = asyncHandler(async (req, res, next) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return next(new ApiError(404, 'User not found'));

  // Increment tokenVersion to invalidate all active JWT tokens across all devices
  await prisma.user.update({
    where: { id: user.id },
    data: { tokenVersion: { increment: 1 } },
  });

  // Purge all user session records
  try {
    await prisma.userSession.deleteMany({
      where: { userId: user.id },
    });
  } catch (e) {}

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'LOGOUT_ALL_DEVICES',
      details: `Forced multi-device logout completed for ${user.email}. All active sessions terminated.`,
      ipAddress: req.ip || 'Unknown IP',
    },
  });

  res.status(200).json({
    success: true,
    message: 'Successfully logged out from all devices and sessions.',
  });
});

// ==================== ADDRESS MANAGEMENT ====================
exports.getAddresses = asyncHandler(async (req, res) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user.id },
    orderBy: { isDefault: 'desc' },
  });
  res.status(200).json({ success: true, data: addresses });
});

exports.addAddress = asyncHandler(async (req, res, next) => {
  const { fullName, phone, street, city, state, postalCode, country, addressType, isDefault } = req.body;

  if (!fullName || !phone || !street || !city || !state || !postalCode) {
    return next(new ApiError(400, 'Please fill in all required address fields'));
  }

  // If this address is set as default, reset all other user addresses
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user.id },
      data: { isDefault: false },
    });
  }

  // If first address, make it default automatically
  const existingCount = await prisma.address.count({ where: { userId: req.user.id } });
  const shouldBeDefault = isDefault || existingCount === 0;

  const address = await prisma.address.create({
    data: {
      userId: req.user.id,
      fullName,
      phone,
      street,
      city,
      state,
      postalCode,
      country: country || 'India',
      addressType: addressType || 'HOME',
      isDefault: shouldBeDefault,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Address added successfully',
    data: address,
  });
});

exports.updateAddress = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  const existing = await prisma.address.findFirst({
    where: { id, userId: req.user.id },
  });
  if (!existing) return next(new ApiError(404, 'Address not found'));

  if (updateData.isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user.id },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.update({
    where: { id },
    data: updateData,
  });

  res.status(200).json({
    success: true,
    message: 'Address updated successfully',
    data: address,
  });
});

exports.deleteAddress = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const existing = await prisma.address.findFirst({
    where: { id, userId: req.user.id },
  });
  if (!existing) return next(new ApiError(404, 'Address not found'));

  await prisma.address.delete({ where: { id } });

  res.status(200).json({
    success: true,
    message: 'Address deleted successfully',
  });
});

exports.setDefaultAddress = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  await prisma.address.updateMany({
    where: { userId: req.user.id },
    data: { isDefault: false },
  });

  const address = await prisma.address.update({
    where: { id },
    data: { isDefault: true },
  });

  res.status(200).json({
    success: true,
    message: 'Default address updated',
    data: address,
  });
});

// ==================== ACTIVITY & SECURITY LOGS ====================
exports.getActivityLogs = asyncHandler(async (req, res) => {
  const logs = await prisma.activityLog.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  res.status(200).json({ success: true, data: logs });
});

exports.deleteActivityLog = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const existing = await prisma.activityLog.findFirst({
    where: { id, userId: req.user.id },
  });
  if (!existing) return next(new ApiError(404, 'Activity log entry not found'));

  await prisma.activityLog.delete({ where: { id } });

  res.status(200).json({
    success: true,
    message: 'Activity log entry permanently deleted',
  });
});

exports.clearActivityLogs = asyncHandler(async (req, res) => {
  await prisma.activityLog.deleteMany({
    where: { userId: req.user.id },
  });

  res.status(200).json({
    success: true,
    message: 'All activity logs permanently cleared',
  });
});
