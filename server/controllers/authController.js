const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { generateToken } = require('../utils/generateToken');
const { createOTP, verifyOTPCode } = require('../services/otpService');
const { sendOTPEmail, sendWelcomeEmail, sendPasswordResetEmail, sendPasswordChangedEmail } = require('../services/emailService');
const { generateCustomerId } = require('./adminCustomerController');

// Dynamic Password Policy Validator
const validatePasswordAgainstPolicy = async (password) => {
  let policy = {
    minLength: 6,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: false,
    requireSymbols: false,
    customRules: [],
  };

  try {
    const authSettings = await prisma.authSettings.findUnique({ where: { id: 'default' } });
    if (authSettings?.passwordPolicy) {
      const parsed = typeof authSettings.passwordPolicy === 'string'
        ? JSON.parse(authSettings.passwordPolicy)
        : authSettings.passwordPolicy;
      if (parsed && typeof parsed === 'object') {
        policy = { ...policy, ...parsed };
      }
    }
  } catch (e) {}

  const errors = [];

  // Minimum Length
  const minLen = parseInt(policy.minLength) || 6;
  if (!password || password.length < minLen) {
    errors.push(`At least ${minLen} characters long`);
  }

  // Uppercase / Capital letter
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('At least one capital / uppercase letter (A-Z)');
  }

  // Lowercase letter
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter (a-z)');
  }

  // Numeric digit
  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('At least one numeric digit (0-9)');
  }

  // Special symbol
  if (policy.requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('At least one special character (!@#$%^&*)');
  }

  // Custom Rules
  if (Array.isArray(policy.customRules)) {
    policy.customRules.filter(r => r && r.enabled).forEach(rule => {
      if (rule.pattern) {
        try {
          const reg = new RegExp(rule.pattern);
          if (!reg.test(password)) {
            errors.push(rule.message || rule.name || 'Password does not meet custom rule');
          }
        } catch (e) {}
      }
    });
  }

  return errors;
};

// ==================== REGISTER ====================
exports.register = asyncHandler(async (req, res, next) => {
  const { fullName, email, phone, password, gender } = req.body;

  if (!fullName || !email || !password) {
    return next(new ApiError(400, 'Please provide Full Name, Email, and Password'));
  }

  // Check password against dynamic admin password policy
  const passwordErrors = await validatePasswordAgainstPolicy(password);
  if (passwordErrors.length > 0) {
    return next(new ApiError(400, `Password does not meet security requirements: ${passwordErrors.join(', ')}`));
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

  // Generate & send OTP via Brevo
  const otp = await createOTP(user.id);
  try {
    await sendOTPEmail(user.email, user.fullName, otp);
    console.log(`[CUSTOMER REGISTER OTP] 6-digit OTP (${otp}) successfully emailed to ${user.email}`);
  } catch (mailErr) {
    console.error('[CUSTOMER REGISTER OTP EMAIL FAILED]', mailErr);
    return next(new ApiError(500, `Failed to send verification email to ${user.email}: ${mailErr.message}`));
  }

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

  // Fetch existing user to check previous verification state
  const existingUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  const wasVerified = existingUser?.isVerified;

  // Update user as verified
  const user = await prisma.user.update({
    where: { id: targetUserId },
    data: { isVerified: true, lastLoginAt: new Date() },
  });

  // Send Welcome Email asynchronously on first verification
  if (!wasVerified) {
    sendWelcomeEmail(user.email, user.fullName).catch(err => {
      console.error('[WELCOME EMAIL FAILED]', err.message);
    });
  }

  // Generate JWT token
  const token = generateToken(user.id, user.role, user.tokenVersion || 0);

  // Save or update UserSession record
  try {
    const deviceFingerprint = req.body.deviceFingerprint || `fp-${req.headers['user-agent']?.replace(/[^a-zA-Z0-9]/g, '').substring(0, 30) || 'default'}`;
    const deviceName = req.body.deviceName || 'Web Session';
    const existingSession = await prisma.userSession.findFirst({
      where: { userId: user.id, deviceFingerprint }
    });

    if (existingSession) {
      await prisma.userSession.update({
        where: { id: existingSession.id },
        data: { token, lastActiveAt: new Date() }
      });
    } else {
      await prisma.userSession.create({
        data: {
          userId: user.id,
          deviceFingerprint,
          deviceName,
          browser: req.headers['user-agent'] || 'Web Browser',
          ipAddress: req.ip || 'Unknown IP',
          token,
          lastActiveAt: new Date()
        }
      });
    }

    // Clean up any duplicate sessions with same fingerprint but different token
    await prisma.userSession.deleteMany({
      where: {
        userId: user.id,
        deviceFingerprint,
        token: { not: token }
      }
    }).catch(() => {});
  } catch (sessErr) {
    console.warn('[VERIFY OTP SESSION SAVE NOTICE]', sessErr.message);
  }

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
  const { identifier, email, phone, username, password, loginType } = req.body;
  const rawInput = (identifier || email || phone || username || '').trim();

  if (!rawInput) {
    return next(new ApiError(400, 'Please provide email, mobile number, or username'));
  }

  // Find user by email, phone, or username
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: rawInput.toLowerCase() },
        { phone: rawInput },
        { phone: rawInput.replace(/\D/g, '') },
        { username: rawInput }
      ]
    }
  });

  // Account must exist
  if (!user) {
    return next(new ApiError(401, 'No account found with these credentials. Please register first.'));
  }

  if (user.status === 'SUSPENDED') {
    return next(new ApiError(403, 'Your account has been suspended. Please contact customer support.'));
  }

  // 1. Passwordless OTP Login flow
  if (loginType === 'OTP' || loginType === 'MOBILE_OTP' || loginType === 'EMAIL_OTP') {
    const otp = await createOTP(user.id);
    try {
      await sendOTPEmail(user.email, user.fullName, otp);
      console.log(`[LOGIN OTP] 6-digit OTP (${otp}) generated for ${user.email}`);
    } catch (mailErr) {
      console.warn('[LOGIN OTP EMAIL FAILED]', mailErr.message);
    }
    return res.status(200).json({
      success: true,
      message: `Login OTP code sent to ${user.email}. Enter the 6-digit code to complete sign in.`,
      data: { userId: user.id, email: user.email, requiresOTP: true }
    });
  }

  // 2. Standard Password Login flow
  if (!password) {
    return next(new ApiError(400, 'Password is required'));
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new ApiError(401, 'Invalid password. Please check your credentials or click Forgot Password.'));
  }

  // Password matched! Issue 6-digit OTP code to email for login verification
  const otp = await createOTP(user.id);
  try {
    await sendOTPEmail(user.email, user.fullName, otp);
    console.log(`[LOGIN 2FA OTP] 6-digit OTP (${otp}) successfully emailed to ${user.email}`);
  } catch (mailErr) {
    console.error('[LOGIN 2FA OTP EMAIL FAILED]', mailErr);
    return next(new ApiError(500, `Failed to send OTP verification email to ${user.email}: ${mailErr.message}`));
  }

  return res.status(200).json({
    success: true,
    message: `Authentication code sent to ${user.email}. Please enter the 6-digit code to complete sign in.`,
    data: { userId: user.id, email: user.email, requiresOTP: true }
  });
});

// ==================== TERMINATE SESSION (LOG OUT FROM SPECIFIC DEVICE) ====================
exports.terminateSession = asyncHandler(async (req, res, next) => {
  const { sessionId, userId, email, terminateAllExceptCurrent } = req.body;

  if (terminateAllExceptCurrent && (userId || email)) {
    let targetId = userId;
    if (!targetId && email) {
      const u = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (u) targetId = u.id;
    }
    if (targetId) {
      await prisma.userSession.deleteMany({ where: { userId: targetId } });
    }
  } else if (sessionId) {
    await prisma.userSession.delete({ where: { id: sessionId } }).catch(() => {});
  }

  res.status(200).json({
    success: true,
    message: 'Selected device session terminated successfully. You can now sign in.'
  });
});

// ==================== RESEND CUSTOMER OTP ====================
exports.resendOTP = asyncHandler(async (req, res, next) => {
  const { userId, email } = req.body;

  let user = null;
  if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId } });
  } else if (email) {
    user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  }

  if (!user) {
    return next(new ApiError(404, 'Account not found. Please register first.'));
  }

  if (user.status === 'SUSPENDED' || user.status === 'BLOCKED') {
    return next(new ApiError(403, `Your account is ${user.status.toLowerCase()}. Please contact support.`));
  }

  // Generate fresh OTP — createOTP automatically deletes all previous OTPs for this user
  const otp = await createOTP(user.id);

  // Send OTP email via Brevo — fail loudly if delivery fails
  try {
    await sendOTPEmail(user.email, user.fullName, otp);
    console.log(`[CUSTOMER RESEND OTP] New OTP sent to ${user.email}`);
  } catch (mailErr) {
    console.error('[CUSTOMER RESEND OTP EMAIL FAILED]', mailErr.message);
    return next(new ApiError(500, 'Failed to send OTP email. Please try again in a moment.'));
  }

  res.status(200).json({
    success: true,
    message: `A new 6-digit OTP code has been sent to ${user.email}`,
    data: { userId: user.id, email: user.email },
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

// ==================== VERIFY RESET OTP ====================
exports.verifyResetOTP = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) return next(new ApiError(400, 'Email and OTP code are required'));

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return next(new ApiError(404, 'Account not found with this email'));

  const result = await verifyOTPCode(user.id, otp);
  if (!result.valid) {
    return next(new ApiError(400, result.message));
  }

  res.status(200).json({
    success: true,
    message: 'OTP code verified successfully! You can now enter your new password.',
    data: { email: user.email, verified: true }
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

  const passwordErrors = await validatePasswordAgainstPolicy(newPassword);
  if (passwordErrors.length > 0) {
    return next(new ApiError(400, `New password does not meet security requirements: ${passwordErrors.join(', ')}`));
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
      createdAt: true,
      addresses: {
        where: { isDefault: true },
        take: 1,
      },
    },
  });

  if (!user) return next(new ApiError(404, 'User not found'));

  let primaryAddress = user.addresses?.[0];
  if (!primaryAddress) {
    primaryAddress = await prisma.address.findFirst({
      where: { userId: req.user.id }
    });
  }

  res.status(200).json({
    success: true,
    data: {
      ...user,
      altPhone: user.alternatePhone || '',
      primaryAddress,
      address: primaryAddress?.street || '',
      city: primaryAddress?.city || '',
      state: primaryAddress?.state || '',
      zipCode: primaryAddress?.postalCode || '',
      country: primaryAddress?.country || 'India',
    }
  });
});

// ==================== LOGOUT ====================
exports.logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
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
  const { idToken, uid, name, email, photo } = req.body;

  // Extract verified identity
  let verifiedEmail = email;
  let verifiedUid = uid;
  let verifiedName = name;
  let verifiedPhoto = photo;

  // If firebase-admin is available, verify the ID token server-side
  try {
    const firebaseAdmin = require('../config/firebase');
    if (firebaseAdmin && idToken) {
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
      verifiedEmail = decodedToken.email;
      verifiedUid = decodedToken.uid;
      verifiedName = decodedToken.name || name;
      verifiedPhoto = decodedToken.picture || photo;
      console.log(`[GOOGLE AUTH] Firebase token verified for: ${verifiedEmail}`);
    }
  } catch (firebaseError) {
    // If firebase-admin not configured, fall back to trusting frontend data
    // This allows the system to work while firebase-admin is being set up
    console.warn('[GOOGLE AUTH] Firebase Admin not available, using frontend-supplied data:', firebaseError.message);
  }

  if (!verifiedEmail || !verifiedUid) {
    return next(new ApiError(400, 'Google UID and email are required.'));
  }

  console.log(`[GOOGLE AUTH] Checking database for: ${verifiedEmail} (UID: ${verifiedUid})`);

  // Check if user already exists by firebaseUid, googleId, or email
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { firebaseUid: verifiedUid },
        { googleId: verifiedUid },
        { email: verifiedEmail.toLowerCase() },
      ],
    },
  });

  if (!user) {
    // ACCOUNT NOT FOUND — Auto-provision new customer account seamlessly
    console.log(`[GOOGLE AUTH] Auto-creating customer account for: ${verifiedEmail}`);
    let customerId = null;
    try { customerId = await generateCustomerId(); } catch (e) {}

    const displayName = verifiedName || verifiedEmail.split('@')[0] || 'Valued Customer';
    // Google users don't use password auth, but Prisma schema requires the field
    const randomPassword = await bcrypt.hash(`google_${verifiedUid}_${Date.now()}`, 12);
    user = await prisma.user.create({
      data: {
        fullName: displayName,
        email: verifiedEmail.toLowerCase(),
        password: randomPassword,
        firebaseUid: verifiedUid,
        googleId: verifiedUid,
        authProvider: 'GOOGLE',
        avatar: verifiedPhoto || null,
        profileImage: verifiedPhoto || null,
        isVerified: true,
        role: 'CUSTOMER',
        customerId,
        lastLoginAt: new Date(),
      },
    });

    // Send Welcome Email asynchronously
    sendWelcomeEmail(user.email, user.fullName).catch(err => {
      console.error('[GOOGLE WELCOME EMAIL FAILED]', err.message);
    });
  }

  // ACCOUNT EXISTS — Login
  console.log(`[GOOGLE AUTH] Account found for: ${verifiedEmail}, ID: ${user.id}`);

  // Check if account is blocked/suspended
  if (user.status === 'BLOCKED' || user.status === 'SUSPENDED') {
    return next(new ApiError(403, `Your account is ${user.status.toLowerCase()}. Please contact support.`));
  }

  // Update Google profile info and login timestamp
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      firebaseUid: verifiedUid,
      googleId: verifiedUid,
      authProvider: user.authProvider === 'LOCAL' ? user.authProvider : 'GOOGLE',
      avatar: verifiedPhoto || user.avatar,
      profileImage: verifiedPhoto || user.profileImage,
      isVerified: true,
      lastLoginAt: new Date(),
    },
  });

  const token = generateToken(updatedUser.id, updatedUser.role, updatedUser.tokenVersion || 0);

  // Save or update UserSession record
  try {
    const deviceFingerprint = req.body.deviceFingerprint || `fp-${req.headers['user-agent']?.replace(/[^a-zA-Z0-9]/g, '').substring(0, 30) || 'default'}`;
    const deviceName = req.body.deviceName || 'Google Web Session';
    const existingSession = await prisma.userSession.findFirst({
      where: { userId: updatedUser.id, deviceFingerprint }
    });

    if (existingSession) {
      await prisma.userSession.update({
        where: { id: existingSession.id },
        data: { token, lastActiveAt: new Date() }
      });
    } else {
      await prisma.userSession.create({
        data: {
          userId: updatedUser.id,
          deviceFingerprint,
          deviceName,
          browser: req.headers['user-agent'] || 'Web Browser',
          ipAddress: req.ip || 'Unknown IP',
          token,
          lastActiveAt: new Date()
        }
      });
    }
  } catch (sessErr) {
    console.warn('[GOOGLE AUTH SESSION SAVE NOTICE]', sessErr.message);
  }

  // Set secure HTTP-only cookie
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res.status(200).cookie('token', token, cookieOptions).json({
    success: true,
    status: 'LOGIN_SUCCESS',
    message: `Welcome back ${updatedUser.fullName}! Google sign-in successful.`,
    token,
    user: {
      id: updatedUser.id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      profileImage: updatedUser.profileImage,
      role: updatedUser.role,
      isVerified: updatedUser.isVerified,
    },
  });
});

// ==================== GOOGLE REGISTER (Complete Account) ====================
exports.googleRegister = asyncHandler(async (req, res, next) => {
  const { idToken, uid, email, name, fullName, photo, phone, mobile, whatsappNumber, gender, street, city, state, postalCode, village, landmark, alternatePhone } = req.body;

  const targetName = (fullName || name || '').trim();
  const targetPhone = (phone || mobile || '').trim();

  // Extract verified identity
  let verifiedEmail = email;
  let verifiedUid = uid;

  // If firebase-admin is available, verify the ID token server-side
  try {
    const firebaseAdmin = require('../config/firebase');
    if (firebaseAdmin && idToken) {
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
      verifiedEmail = decodedToken.email;
      verifiedUid = decodedToken.uid;
      console.log(`[GOOGLE REGISTER] Firebase token verified for: ${verifiedEmail}`);
    }
  } catch (firebaseError) {
    console.warn('[GOOGLE REGISTER] Firebase Admin not available, using frontend-supplied data:', firebaseError.message);
  }

  if (!verifiedEmail || !verifiedUid) {
    return next(new ApiError(400, 'Google UID and email are required.'));
  }

  if (!targetName) {
    return next(new ApiError(400, 'Full name is required.'));
  }

  // Check AGAIN if account already exists (prevents race conditions/duplicates)
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { firebaseUid: verifiedUid },
        { googleId: verifiedUid },
        { email: verifiedEmail.toLowerCase() },
      ],
    },
  });

  if (existingUser) {
    console.log(`[GOOGLE REGISTER] Account already exists for: ${verifiedEmail}`);
    // Account already exists — just log them in instead of erroring
    const token = generateToken(existingUser.id, existingUser.role);

    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    };

    return res.status(200).cookie('token', token, cookieOptions).json({
      success: true,
      status: 'LOGIN_SUCCESS',
      message: 'Account already exists. You have been logged in.',
      token,
      user: {
        id: existingUser.id,
        fullName: existingUser.fullName,
        email: existingUser.email,
        avatar: existingUser.avatar,
        role: existingUser.role,
        isVerified: existingUser.isVerified,
      },
    });
  }

  // Create new customer account
  const customerId = await generateCustomerId();

  const newUser = await prisma.user.create({
    data: {
      email: verifiedEmail.toLowerCase(),
      fullName: targetName,
      password: await bcrypt.hash(`GOOGLE_${verifiedUid}_${Date.now()}`, 12),
      phone: targetPhone || null,
      whatsappNumber: whatsappNumber || null,
      gender: gender || null,
      avatar: photo || null,
      profileImage: photo || null,
      firebaseUid: verifiedUid,
      googleId: verifiedUid,
      authProvider: 'GOOGLE',
      isVerified: true,
      role: 'CUSTOMER',
      customerId,
      lastLoginAt: new Date(),
    },
  });

  console.log(`[GOOGLE REGISTER] New account created: ${newUser.email}, ID: ${newUser.id}, CustomerId: ${customerId}`);

  // Auto-create address if address data was provided during registration
  if (street && city && state && postalCode) {
    try {
      await prisma.address.create({
        data: {
          userId: newUser.id,
          fullName: targetName,
          phone: targetPhone || '',
          street,
          city,
          state,
          postalCode,
          country: 'India',
          addressType: 'HOME',
          isDefault: true,
        },
      });
      console.log(`[GOOGLE REGISTER] Default address saved for: ${newUser.email}`);
    } catch (addrErr) {
      console.error('[GOOGLE REGISTER] Failed to save address:', addrErr.message);
    }
  }

  // Send welcome email asynchronously
  try {
    sendWelcomeEmail(newUser.email, newUser.fullName);
  } catch (err) {
    console.error('Welcome email failed:', err);
  }

  // Generate JWT token
  const token = generateToken(newUser.id, newUser.role);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res.status(201).cookie('token', token, cookieOptions).json({
    success: true,
    status: 'ACCOUNT_CREATED',
    message: `Welcome ${newUser.fullName}! Your account has been created successfully.`,
    token,
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      avatar: newUser.avatar,
      role: newUser.role,
      isVerified: newUser.isVerified,
    },
  });
});
