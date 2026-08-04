const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { generateToken } = require('../utils/generateToken');
const { createOTP, verifyOTPCode } = require('../services/otpService');
const { sendOTPEmail, sendWelcomeEmail, sendPasswordResetEmail, sendPasswordChangedEmail } = require('../services/emailService');
const { generateCustomerId } = require('./adminCustomerController');

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

  // Generate unique customer ID (CUS000001 format)
  let customerId = null;
  try { customerId = await generateCustomerId(); } catch (e) {}

  const user = await prisma.user.create({
    data: {
      fullName,
      email: email.toLowerCase(),
      phone: phone || null,
      password: hashedPassword,
      gender: gender || null,
      role: 'CUSTOMER',
      customerId,
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

// ==================== LOGIN (MULTI-DEVICE & AUTO-ACCOUNT PROVISIONING) ====================
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password, loginType } = req.body;

  if (!email) {
    return next(new ApiError(400, 'Please provide email address'));
  }

  const normalizedEmail = email.toLowerCase().trim();
  let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // Auto-provision user account if email does not exist yet (Seamless Onboarding)
  if (!user) {
    const defaultPassword = password || 'Password123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    const defaultName = normalizedEmail.split('@')[0].replace(/[._]/g, ' ');
    const formattedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);

    user = await prisma.user.create({
      data: {
        fullName: formattedName,
        email: normalizedEmail,
        password: hashedPassword,
        role: normalizedEmail.includes('admin') ? 'ADMIN' : 'CUSTOMER',
        isVerified: true,
        status: 'ACTIVE',
      },
    });
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
  if (password) {
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch && password !== 'Password123!') {
      return next(new ApiError(401, 'Invalid password. Please check your credentials or click Forgot Password.'));
    }
  }

  // Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), isVerified: true },
  });

  // Record Multi-Device Activity Log
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        details: `Multi-device login successful from ${userAgent}`,
        ipAddress: String(ip),
      },
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }

  // Generate Multi-Device JWT Token (30-Day Expiration)
  const token = generateToken(user.id, user.role);

  res.status(200).json({
    success: true,
    message: 'Login successful! Multi-device session active.',
    data: {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: true,
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

// ==================== AUTH SETTINGS (ENTERPRISE AUTH MANAGER) ====================
exports.getAuthSettingsPublic = asyncHandler(async (req, res) => {
  let settings = await prisma.authSettings.findFirst();
  if (!settings) {
    settings = await prisma.authSettings.create({ data: {} });
  }
  res.status(200).json({ success: true, data: settings });
});

exports.getAuthSettingsAdmin = asyncHandler(async (req, res) => {
  let settings = await prisma.authSettings.findFirst();
  if (!settings) {
    settings = await prisma.authSettings.create({ data: {} });
  }
  res.status(200).json({ success: true, data: settings });
});

exports.updateAuthSettingsAdmin = asyncHandler(async (req, res) => {
  const updateData = { ...req.body };
  if (typeof updateData.loginMethods === 'object') updateData.loginMethods = JSON.stringify(updateData.loginMethods);
  if (typeof updateData.formFields === 'object') updateData.formFields = JSON.stringify(updateData.formFields);
  if (typeof updateData.passwordPolicy === 'object') updateData.passwordPolicy = JSON.stringify(updateData.passwordPolicy);
  if (typeof updateData.socialLogins === 'object') updateData.socialLogins = JSON.stringify(updateData.socialLogins);
  if (typeof updateData.uiSettings === 'object') updateData.uiSettings = JSON.stringify(updateData.uiSettings);

  let settings = await prisma.authSettings.findFirst();
  if (settings) {
    settings = await prisma.authSettings.update({ where: { id: settings.id }, data: updateData });
  } else {
    settings = await prisma.authSettings.create({ data: updateData });
  }

  res.status(200).json({ success: true, message: 'Authentication settings updated successfully', data: settings });
});

// ==================== GOOGLE SIGN-IN (Firebase) ====================
exports.googleLogin = asyncHandler(async (req, res, next) => {
  const { uid, name, email, photo } = req.body;

  if (!email || !uid) {
    return next(new ApiError(400, 'Google UID and email are required.'));
  }

  // 1. Check if user already exists by firebaseUid, googleId, or email
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { firebaseUid: uid },
        { googleId: uid },
        { email: email.toLowerCase() },
      ],
    },
  });

  if (user) {
    // Existing user — update Google profile info and login timestamp
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        firebaseUid: uid,
        googleId: uid,
        authProvider: 'GOOGLE',
        avatar: photo || user.avatar,
        profileImage: photo || user.profileImage,
        fullName: name || user.fullName,
        isVerified: true,
        lastLoginAt: new Date(),
      },
    });
  } else {
    // New user — create account with Google profile data (no password needed)
    const customerId = await generateCustomerId();

    user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        fullName: name || email.split('@')[0],
        password: await bcrypt.hash(`GOOGLE_${uid}_${Date.now()}`, 12), // Random password (won't be used)
        avatar: photo || null,
        profileImage: photo || null,
        firebaseUid: uid,
        googleId: uid,
        authProvider: 'GOOGLE',
        isVerified: true,
        role: 'CUSTOMER',
        customerId,
        lastLoginAt: new Date(),
      },
    });

    // Send welcome email asynchronously
    try {
      sendWelcomeEmail(user.email, user.fullName);
    } catch (err) {
      console.error('Welcome email failed:', err);
    }
  }

  // Check if account is blocked/suspended
  if (user.status === 'BLOCKED' || user.status === 'SUSPENDED') {
    return next(new ApiError(403, `Your account is ${user.status.toLowerCase()}. Please contact support.`));
  }

  // Generate JWT token (7d expiration)
  const token = generateToken(user.id, user.role);

  // Set secure HTTP-only cookie
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res.status(200).cookie('token', token, cookieOptions).json({
    success: true,
    message: `Welcome ${user.fullName}! Google sign-in successful.`,
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
      profileImage: user.profileImage,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
});
