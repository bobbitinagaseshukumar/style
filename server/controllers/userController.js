const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// ==================== PROFILE MANAGEMENT ====================
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { fullName, phone, gender, dob, preferredLanguage, emailNotifications, smsNotifications } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      fullName: fullName || undefined,
      phone: phone || undefined,
      gender: gender || undefined,
      dob: dob ? new Date(dob) : undefined,
      preferredLanguage: preferredLanguage || undefined,
      emailNotifications: emailNotifications !== undefined ? emailNotifications : undefined,
      smsNotifications: smsNotifications !== undefined ? smsNotifications : undefined,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      gender: true,
      dob: true,
      role: true,
      isVerified: true,
      preferredLanguage: true,
      emailNotifications: true,
      smsNotifications: true,
    },
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser,
  });
});

exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ApiError(400, 'Current password and new password are required'));
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return next(new ApiError(400, 'Incorrect current password'));
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return next(new ApiError(400, 'New password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.'));
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword },
  });

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
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
    take: 15,
  });
  res.status(200).json({ success: true, data: logs });
});
