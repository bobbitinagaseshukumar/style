const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { generateToken } = require('../utils/generateToken');
const { createOTP, verifyOTPCode } = require('../services/otpService');
const { sendOTPEmail, sendWelcomeEmail, sendPasswordResetEmail, sendPasswordChangedEmail } = require('../services/emailService');

// Password complexity regex (min 8 chars, uppercase, lowercase, number, special char)
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// ==================== REGISTER ====================
exports.register = asyncHandler(async (req, res, next) => {
  const { fullName, email, phone, password, gender } = req.body;

  if (!fullName || !email || !password) {
    return next(new ApiError(400, 'Please provide Full Name, Email, and Password'));
  }

  // Check password strength
  if (!passwordRegex.test(password)) {
    return next(new ApiError(400, 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'));
  }

  // Check duplicate user
  const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existingUser) {
    if (existingUser.isVerified) {
      return next(new ApiError(400, 'An account with this email already exists. Please login.'));
    }
    // Delete unverified existing user to re-register
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      fullName,
      email: email.toLowerCase(),
      phone: phone || null,
      password: hashedPassword,
      gender: gender || null,
      role: 'CUSTOMER',
      isVerified: false,
    },
  });

  // Generate & send OTP
  const otp = await createOTP(user.id);
  await sendOTPEmail(user.email, user.fullName, otp);

  res.status(201).json({
    success: true,
    message: `Registration successful! Verification OTP sent to ${user.email}`,
    data: {
      userId: user.id,
      email: user.email,
    },
  });
});

// ==================== VERIFY OTP ====================
exports.verifyOTP = asyncHandler(async (req, res, next) => {
  const { userId, email, otp } = req.body;

  let targetUserId = userId;
  if (!targetUserId && email) {
    const found = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (found) targetUserId = found.id;
  }

  if (!targetUserId || !otp) {
    return next(new ApiError(400, 'User ID / Email and OTP code are required'));
  }

  const result = await verifyOTPCode(targetUserId, otp);
  if (!result.valid) {
    return next(new ApiError(400, result.message));
  }

  // Update user as verified
  const user = await prisma.user.update({
    where: { id: targetUserId },
    data: { isVerified: true, lastLoginAt: new Date() },
  });

  // Send Welcome Email asynchronously
  sendWelcomeEmail(user.email, user.fullName);

  // Generate JWT token
  const token = generateToken(user.id, user.role);

  res.status(200).json({
    success: true,
    message: 'Email verified successfully! Welcome to StyleVerse.',
    data: {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      token,
    },
  });
});

// ==================== LOGIN ====================
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password, loginType } = req.body;

  if (!email) {
    return next(new ApiError(400, 'Please provide email address'));
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return next(new ApiError(401, 'Invalid email or password'));
  }

  if (user.status === 'SUSPENDED') {
    return next(new ApiError(403, 'Your account has been suspended. Please contact support.'));
  }

  // Option A: Email OTP Login
  if (loginType === 'OTP') {
    const otp = await createOTP(user.id);
    await sendOTPEmail(user.email, user.fullName, otp);
    return res.status(200).json({
      success: true,
      message: `Login OTP sent to ${user.email}`,
      data: { userId: user.id, email: user.email, requiresOTP: true },
    });
  }

  // Option B: Password Login
  if (!password) {
    return next(new ApiError(400, 'Please provide password'));
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new ApiError(401, 'Invalid email or password'));
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Record Login History
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        details: `Login successful from ${userAgent}`,
        ipAddress: String(ip),
      },
    });
  } catch (err) {
    console.error('Failed to log login history:', err);
  }

  const token = generateToken(user.id, user.role);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      token,
    },
  });
});

// ==================== FORGOT PASSWORD ====================
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new ApiError(400, 'Please enter your email'));

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    // Return success to avoid email enumeration
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset OTP has been sent.',
    });
  }

  const otp = await createOTP(user.id);
  await sendPasswordResetEmail(user.email, user.fullName, otp);

  res.status(200).json({
    success: true,
    message: `Password reset OTP sent to ${user.email}`,
    data: { userId: user.id, email: user.email },
  });
});

// ==================== RESET PASSWORD ====================
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { userId, email, otp, newPassword } = req.body;

  let targetUserId = userId;
  if (!targetUserId && email) {
    const found = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (found) targetUserId = found.id;
  }

  if (!targetUserId || !otp || !newPassword) {
    return next(new ApiError(400, 'User ID / Email, OTP, and new password are required'));
  }

  if (!passwordRegex.test(newPassword)) {
    return next(new ApiError(400, 'New password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.'));
  }

  const result = await verifyOTPCode(targetUserId, otp);
  if (!result.valid) {
    return next(new ApiError(400, result.message));
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { password: hashedPassword },
  });

  // Fire password-changed confirmation email
  sendPasswordChangedEmail(updatedUser.email, updatedUser.fullName);

  res.status(200).json({
    success: true,
    message: 'Password reset successful! You can now login with your new password.',
  });
});

// ==================== GET ME ====================
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      gender: true,
      dob: true,
      role: true,
      isVerified: true,
      avatar: true,
      preferredLanguage: true,
      emailNotifications: true,
      smsNotifications: true,
      createdAt: true,
    },
  });

  if (!user) return next(new ApiError(44, 'User not found'));

  res.status(200).json({ success: true, data: user });
});

// ==================== LOGOUT ====================
exports.logout = asyncHandler(async (req, res) => {
  res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});
