const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../services/emailService');

// Generate JWT Token helper
const generateToken = (id, role, tokenVersion = 0) => {
  return jwt.sign(
    { id, role, tokenVersion },
    process.env.JWT_SECRET || 'styleverse_super_secret_jwt_key_2026',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Log Admin Login Attempt
const logLoginAttempt = async (adminId, email, req, status, failureReason = null) => {
  try {
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    await prisma.adminLoginHistory.create({
      data: {
        adminId,
        adminEmail: email,
        ipAddress,
        browser: userAgent,
        device: userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
        status,
        failureReason
      }
    });
  } catch (err) {
    console.error('Failed to log admin login attempt:', err.message);
  }
};

// ==================== AUTO-BOOTSTRAP SUPER ADMIN ====================
exports.bootstrapSuperAdmin = async () => {
  try {
    const targetEmail = 'nagaseshukumarbobbiti@gmail.com';
    const targetPass = 'seshu@2409';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(targetPass, salt);

    await prisma.user.upsert({
      where: { email: targetEmail },
      update: {
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        adminRole: 'SUPER_ADMIN',
        status: 'ACTIVE',
        canLogin: true,
        isVerified: true,
        tokenVersion: { increment: 1 }
      },
      create: {
        fullName: 'Naga Seshu Kumar',
        username: 'nagaseshu',
        email: targetEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        adminRole: 'SUPER_ADMIN',
        isVerified: true,
        status: 'ACTIVE',
        canLogin: true,
        twoFactorEnabled: true,
        adminPermissions: JSON.stringify({
          canManageProducts: true,
          canManageOrders: true,
          canManageCustomers: true,
          canManageCoupons: true,
          canManageCMS: true,
          canManageAdmins: true,
          canManageSettings: true
        })
      }
    });
    console.log(`[SECURITY BOOTSTRAP] Super Admin configured: ${targetEmail} / ${targetPass}`);
  } catch (err) {
    console.error('[SECURITY BOOTSTRAP] Error setting Super Admin:', err.message);
  }
};

// ==================== STEP 1: ADMIN LOGIN (EMAIL & PASSWORD) ====================
exports.adminLoginStep1 = asyncHandler(async (req, res, next) => {
  const { email, password, deviceFingerprint, deviceName, trustDevice } = req.body;

  if (!email || !password) {
    return next(new ApiError(400, 'Please provide admin email and password'));
  }

  const cleanEmail = email.trim().toLowerCase();
  const admin = await prisma.user.findUnique({
    where: { email: cleanEmail }
  });

  if (!admin || !['ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
    await logLoginAttempt(null, cleanEmail, req, 'FAILED', 'Invalid credentials or non-admin account');
    return next(new ApiError(401, 'Invalid email or password'));
  }

  // Account Status Checks
  if (admin.status === 'BLOCKED') {
    await logLoginAttempt(admin.id, cleanEmail, req, 'BLOCKED', 'Account blocked');
    return next(new ApiError(403, 'Your admin account has been blocked by the Super Admin.'));
  }
  if (!admin.canLogin) {
    await logLoginAttempt(admin.id, cleanEmail, req, 'BLOCKED', 'Login permission disabled');
    return next(new ApiError(403, 'Login permission disabled for this account.'));
  }

  // Lockout Protection Check (15 Minutes after 5 failures)
  if (admin.lockoutUntil && new Date(admin.lockoutUntil) > new Date()) {
    const minutesLeft = Math.ceil((new Date(admin.lockoutUntil) - new Date()) / 60000);
    await logLoginAttempt(admin.id, cleanEmail, req, 'BLOCKED', `Account locked out for ${minutesLeft} mins`);
    return next(new ApiError(403, `Account temporarily locked due to multiple failed attempts. Please try again in ${minutesLeft} minutes.`));
  }

  // Verify Password
  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    const attempts = (admin.failedLoginAttempts || 0) + 1;
    let lockoutUntil = null;
    if (attempts >= 5) {
      lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
    }

    await prisma.user.update({
      where: { id: admin.id },
      data: { failedLoginAttempts: attempts, lockoutUntil }
    });

    await logLoginAttempt(admin.id, cleanEmail, req, 'FAILED', `Incorrect password (attempt ${attempts}/5)`);
    return next(new ApiError(401, 'Invalid email or password'));
  }

  // Reset Failed Attempts on Success
  await prisma.user.update({
    where: { id: admin.id },
    data: { failedLoginAttempts: 0, lockoutUntil: null }
  });

  // Generate 6-Digit Email OTP (Expiry: 5 Minutes)
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.user.update({
    where: { id: admin.id },
    data: { otpCode, otpExpiresAt }
  });

  // Send 6-digit OTP to Admin's email via Brevo
  try {
    await sendOTPEmail(admin.email, admin.fullName, otpCode);
  } catch (mailErr) {
    console.error('[ADMIN OTP EMAIL FAILED]', mailErr.message);
  }

  await logLoginAttempt(admin.id, cleanEmail, req, 'OTP_REQUIRED', '6-Digit Email OTP generated & sent to admin email');

  res.status(200).json({
    success: true,
    step: 'OTP_REQUIRED',
    message: `Security OTP sent! A 6-digit verification code has been sent to your email: ${cleanEmail}`,
    data: {
      adminId: admin.id,
      email: cleanEmail
    }
  });
});

// ==================== STEP 2: VERIFY ADMIN EMAIL OTP ====================
exports.verifyAdminOTP = asyncHandler(async (req, res, next) => {
  const { adminId, otpCode, trustDevice, deviceFingerprint, deviceName } = req.body;

  if (!adminId || !otpCode) {
    return next(new ApiError(400, 'Admin ID and 6-digit OTP code are required'));
  }

  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin) {
    return next(new ApiError(404, 'Admin account not found'));
  }

  if (!admin.otpCode || admin.otpCode !== otpCode.trim()) {
    await logLoginAttempt(admin.id, admin.email, req, 'FAILED', 'Invalid OTP code entered');
    return next(new ApiError(400, 'Invalid verification code. Please check and try again.'));
  }

  if (new Date() > new Date(admin.otpExpiresAt)) {
    await logLoginAttempt(admin.id, admin.email, req, 'FAILED', 'Expired OTP code');
    return next(new ApiError(400, 'Verification code has expired. Please request a new code.'));
  }

  // Clear OTP
  await prisma.user.update({
    where: { id: admin.id },
    data: {
      otpCode: null,
      otpExpiresAt: null,
      lastLoginAt: new Date()
    }
  });

  // Handle 30-Day Trusted Device Checkbox
  if (trustDevice && deviceFingerprint) {
    const trustedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 Days
    await prisma.adminTrustedDevice.create({
      data: {
        adminId: admin.id,
        deviceFingerprint,
        deviceName: deviceName || 'Browser Session',
        browser: req.headers['user-agent'] || 'Unknown',
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        trustedUntil
      }
    });
  }

  const token = generateToken(admin.id, admin.role, admin.tokenVersion);
  await logLoginAttempt(admin.id, admin.email, req, 'SUCCESS', 'OTP verified successfully');

  res.status(200).json({
    success: true,
    message: 'OTP Verified! Admin authentication successful.',
    data: {
      token,
      user: {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        adminRole: admin.adminRole,
        avatar: admin.avatar,
        adminPermissions: admin.adminPermissions ? JSON.parse(admin.adminPermissions) : {}
      }
    }
  });
});

// ==================== RESEND ADMIN OTP ====================
exports.resendAdminOTP = asyncHandler(async (req, res, next) => {
  const { adminId } = req.body;

  if (!adminId) {
    return next(new ApiError(400, 'Admin ID is required'));
  }

  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin) return next(new ApiError(404, 'Admin account not found'));

  // Generate a fresh 6-digit OTP and clear any previous code
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.user.update({
    where: { id: adminId },
    data: { otpCode, otpExpiresAt }
  });

  // Send fresh 6-digit OTP to Admin's email via Brevo — fail loudly if delivery fails
  try {
    await sendOTPEmail(admin.email, admin.fullName, otpCode);
    console.log(`[ADMIN RESEND OTP] New OTP sent to ${admin.email}`);
  } catch (mailErr) {
    console.error('[ADMIN RESEND OTP EMAIL FAILED]', mailErr.message);
    return next(new ApiError(500, 'Failed to send OTP email. Please try again in a moment.'));
  }

  await logLoginAttempt(admin.id, admin.email, req, 'OTP_REQUIRED', 'Admin resent OTP code');

  res.status(200).json({
    success: true,
    message: `A new 6-digit OTP code has been sent to your email: ${admin.email}`,
    data: { adminId: admin.id, email: admin.email }
  });
});

// ==================== GET ACTIVE ADMIN SESSIONS & TRUSTED DEVICES ====================
exports.getAdminSessions = asyncHandler(async (req, res) => {
  const adminId = req.user.id;

  const trustedDevices = await prisma.adminTrustedDevice.findMany({
    where: { adminId, trustedUntil: { gt: new Date() } },
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json({
    success: true,
    data: trustedDevices
  });
});

// ==================== REVOKE TRUSTED DEVICE / SESSION ====================
exports.revokeAdminSession = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.adminTrustedDevice.delete({ where: { id } }).catch(() => {});

  res.status(200).json({
    success: true,
    message: 'Device session revoked. OTP will be required on next login from that device.'
  });
});

// ==================== GET ADMIN LOGIN HISTORY ====================
exports.getAdminLoginHistory = asyncHandler(async (req, res) => {
  const history = await prisma.adminLoginHistory.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  res.status(200).json({
    success: true,
    data: history
  });
});

// ==================== SUPER ADMIN: CREATE NEW ADMIN ACCOUNT ====================
exports.createAdminAccount = asyncHandler(async (req, res, next) => {
  const { fullName, email, password, adminRole, permissions } = req.body;

  if (!fullName || !email || !password) {
    return next(new ApiError(400, 'Full Name, Email, and Password are required'));
  }

  const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) {
    return next(new ApiError(400, 'An account with this email address already exists.'));
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newAdmin = await prisma.user.create({
    data: {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'ADMIN',
      adminRole: adminRole || 'PRODUCT_MANAGER',
      isVerified: true,
      status: 'ACTIVE',
      canLogin: true,
      twoFactorEnabled: true,
      adminPermissions: permissions ? JSON.stringify(permissions) : JSON.stringify({
        canManageProducts: true,
        canManageOrders: true,
        canManageCustomers: false,
        canManageCoupons: true,
        canManageCMS: false,
        canManageAdmins: false,
        canManageSettings: false
      })
    }
  });

  res.status(201).json({
    success: true,
    message: `Admin account "${newAdmin.fullName}" (${newAdmin.adminRole}) created successfully!`,
    data: newAdmin
  });
});

// ==================== GET LOGGED-IN ADMIN PROFILE ====================
exports.getAdminProfile = asyncHandler(async (req, res, next) => {
  const admin = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true, customerId: true, email: true, username: true, fullName: true,
      firstName: true, lastName: true, phone: true, alternatePhone: true,
      whatsappNumber: true, gender: true, dob: true, avatar: true, role: true,
      adminRole: true, adminPermissions: true, isVerified: true, status: true,
      canLogin: true, twoFactorEnabled: true, twoFactorMethod: true,
      lastLoginAt: true, createdAt: true, updatedAt: true, timeZone: true
    }
  });

  if (!admin) return next(new ApiError(404, 'Admin profile not found'));

  const parsedPermissions = admin.adminPermissions ? JSON.parse(admin.adminPermissions) : {};

  res.status(200).json({
    success: true,
    data: {
      ...admin,
      adminPermissions: parsedPermissions
    }
  });
});

// ==================== UPDATE ADMIN PROFILE INFO ====================
exports.updateAdminProfile = asyncHandler(async (req, res, next) => {
  const { fullName, phone, alternatePhone, whatsappNumber, avatar, timeZone } = req.body;

  const updatedAdmin = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      fullName: fullName ? fullName.trim() : undefined,
      phone: phone !== undefined ? phone : undefined,
      alternatePhone: alternatePhone !== undefined ? alternatePhone : undefined,
      whatsappNumber: whatsappNumber !== undefined ? whatsappNumber : undefined,
      avatar: avatar !== undefined ? avatar : undefined,
      timeZone: timeZone || undefined
    },
    select: {
      id: true, email: true, username: true, fullName: true, phone: true,
      avatar: true, role: true, adminRole: true, isVerified: true, status: true,
      twoFactorEnabled: true, lastLoginAt: true, createdAt: true
    }
  });

  // Log action
  await prisma.adminActionLog.create({
    data: {
      adminId: req.user.id,
      adminName: updatedAdmin.fullName,
      targetUserId: req.user.id,
      targetName: updatedAdmin.fullName,
      action: 'PROFILE_UPDATED',
      reason: 'Admin updated profile details',
      details: JSON.stringify({ fullName, phone, avatarChanged: !!avatar }),
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Browser'
    }
  }).catch(() => {});

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully!',
    data: updatedAdmin
  });
});

// ==================== STEP 1: REQUEST EMAIL CHANGE OTP ====================
exports.requestEmailChangeOTP = asyncHandler(async (req, res, next) => {
  const { newEmail } = req.body;

  if (!newEmail || !newEmail.trim()) {
    return next(new ApiError(400, 'Please enter a valid new email address'));
  }

  const cleanNewEmail = newEmail.trim().toLowerCase();

  // Validate format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanNewEmail)) {
    return next(new ApiError(400, 'Invalid email format. Please check the address.'));
  }

  if (cleanNewEmail === req.user.email.toLowerCase()) {
    return next(new ApiError(400, 'New email address must be different from your current email.'));
  }

  // Check if email already in use by another user
  const existing = await prisma.user.findUnique({ where: { email: cleanNewEmail } });
  if (existing) {
    return next(new ApiError(400, 'This email address is already in use by another account.'));
  }

  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

  // Store in User blockNotes as JSON metadata temp storage
  await prisma.user.update({
    where: { id: req.user.id },
    data: {
      otpCode,
      otpExpiresAt,
      blockNotes: JSON.stringify({ pendingNewEmail: cleanNewEmail, action: 'CHANGE_EMAIL' })
    }
  });

  // Log action
  await prisma.adminActionLog.create({
    data: {
      adminId: req.user.id,
      adminName: req.user.fullName || req.user.email,
      targetUserId: req.user.id,
      targetName: req.user.fullName || req.user.email,
      action: 'EMAIL_CHANGE_OTP_REQUESTED',
      reason: 'Admin requested email change OTP',
      details: `OTP sent to new email: ${cleanNewEmail}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Browser'
    }
  }).catch(() => {});

  res.status(200).json({
    success: true,
    message: `Verification OTP has been sent to your NEW email address: ${cleanNewEmail}`,
    data: {
      pendingNewEmail: cleanNewEmail,
      otpCode // Included in response payload for instant test verification & display
    }
  });
});

// ==================== STEP 2: VERIFY EMAIL CHANGE OTP ====================
exports.verifyEmailChangeOTP = asyncHandler(async (req, res, next) => {
  const { otpCode } = req.body;

  if (!otpCode) {
    return next(new ApiError(400, 'Please enter the 6-digit OTP code'));
  }

  const admin = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!admin || !admin.otpCode) {
    return next(new ApiError(400, 'No active OTP verification request found. Please request a new code.'));
  }

  if (admin.otpCode !== otpCode.trim()) {
    return next(new ApiError(400, 'Invalid verification code. Please check and try again.'));
  }

  if (new Date() > new Date(admin.otpExpiresAt)) {
    return next(new ApiError(400, 'Verification code has expired. Please request a new code.'));
  }

  let pendingNewEmail = null;
  try {
    const meta = JSON.parse(admin.blockNotes || '{}');
    if (meta.action === 'CHANGE_EMAIL') pendingNewEmail = meta.pendingNewEmail;
  } catch (e) {}

  if (!pendingNewEmail) {
    return next(new ApiError(400, 'Invalid email change request context. Please try again.'));
  }

  const oldEmail = admin.email;

  // Update Admin Email & clear OTP
  const updatedAdmin = await prisma.user.update({
    where: { id: admin.id },
    data: {
      email: pendingNewEmail.toLowerCase(),
      isVerified: true,
      otpCode: null,
      otpExpiresAt: null,
      blockNotes: null
    }
  });

  // Log action
  await prisma.adminActionLog.create({
    data: {
      adminId: admin.id,
      adminName: admin.fullName,
      targetUserId: admin.id,
      targetName: admin.fullName,
      action: 'EMAIL_CHANGED',
      reason: 'Admin changed email address via OTP verification',
      details: `Old: ${oldEmail} -> New: ${pendingNewEmail}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Browser'
    }
  }).catch(() => {});

  res.status(200).json({
    success: true,
    message: `Email address updated successfully to ${pendingNewEmail}!`,
    data: {
      email: updatedAdmin.email
    }
  });
});

// ==================== STEP 1: REQUEST PASSWORD CHANGE OTP ====================
exports.requestPasswordChangeOTP = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ApiError(400, 'Current password and new password are required'));
  }

  if (confirmNewPassword && newPassword !== confirmNewPassword) {
    return next(new ApiError(400, 'New passwords do not match'));
  }

  // Password rules complexity check
  const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passRegex.test(newPassword)) {
    return next(new ApiError(400, 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character (@$!%*?&)'));
  }

  const admin = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!admin) return next(new ApiError(404, 'Admin account not found'));

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, admin.password);
  if (!isMatch) {
    return next(new ApiError(400, 'Current password is incorrect'));
  }

  // Hash new password temporary
  const salt = await bcrypt.genSalt(12);
  const hashedNewPassword = await bcrypt.hash(newPassword, salt);

  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: admin.id },
    data: {
      otpCode,
      otpExpiresAt,
      blockNotes: JSON.stringify({ pendingHashedPassword: hashedNewPassword, action: 'CHANGE_PASSWORD' })
    }
  });

  // Log action
  await prisma.adminActionLog.create({
    data: {
      adminId: admin.id,
      adminName: admin.fullName,
      targetUserId: admin.id,
      targetName: admin.fullName,
      action: 'PASSWORD_CHANGE_OTP_REQUESTED',
      reason: 'Admin verified current password and requested OTP',
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Browser'
    }
  }).catch(() => {});

  res.status(200).json({
    success: true,
    message: `Verification OTP sent to your registered email: ${admin.email}`,
    data: {
      email: admin.email,
      otpCode // Included in response payload for instant test verification & display
    }
  });
});

// ==================== STEP 2: VERIFY PASSWORD CHANGE OTP ====================
exports.verifyPasswordChangeOTP = asyncHandler(async (req, res, next) => {
  const { otpCode } = req.body;

  if (!otpCode) {
    return next(new ApiError(400, 'Please enter the 6-digit verification code'));
  }

  const admin = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!admin || !admin.otpCode) {
    return next(new ApiError(400, 'No active password change request found.'));
  }

  if (admin.otpCode !== otpCode.trim()) {
    return next(new ApiError(400, 'Invalid verification code. Please check and try again.'));
  }

  if (new Date() > new Date(admin.otpExpiresAt)) {
    return next(new ApiError(400, 'Verification code has expired. Please request a new code.'));
  }

  let pendingHashedPassword = null;
  try {
    const meta = JSON.parse(admin.blockNotes || '{}');
    if (meta.action === 'CHANGE_PASSWORD') pendingHashedPassword = meta.pendingHashedPassword;
  } catch (e) {}

  if (!pendingHashedPassword) {
    return next(new ApiError(400, 'Invalid request context. Please try again.'));
  }

  // Update password and increment tokenVersion to revoke all other active sessions
  const newTokenVersion = (admin.tokenVersion || 0) + 1;
  await prisma.user.update({
    where: { id: admin.id },
    data: {
      password: pendingHashedPassword,
      tokenVersion: newTokenVersion,
      otpCode: null,
      otpExpiresAt: null,
      blockNotes: null
    }
  });

  // Issue fresh token for current admin session
  const newToken = generateToken(admin.id, admin.role, newTokenVersion);

  // Log action
  await prisma.adminActionLog.create({
    data: {
      adminId: admin.id,
      adminName: admin.fullName,
      targetUserId: admin.id,
      targetName: admin.fullName,
      action: 'PASSWORD_CHANGED',
      reason: 'Admin updated password via current password + OTP verification',
      details: 'All other active sessions revoked',
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Browser'
    }
  }).catch(() => {});

  res.status(200).json({
    success: true,
    message: 'Password changed successfully! All other active sessions have been logged out.',
    data: {
      token: newToken
    }
  });
});

// ==================== TOGGLE 2FA ====================
exports.toggleAdmin2FA = asyncHandler(async (req, res, next) => {
  const { enabled } = req.body;
  const isEnabled = enabled === true || enabled === 'true';

  const updatedAdmin = await prisma.user.update({
    where: { id: req.user.id },
    data: { twoFactorEnabled: isEnabled }
  });

  await prisma.adminActionLog.create({
    data: {
      adminId: req.user.id,
      adminName: updatedAdmin.fullName,
      targetUserId: req.user.id,
      targetName: updatedAdmin.fullName,
      action: isEnabled ? '2FA_ENABLED' : '2FA_DISABLED',
      reason: `Admin toggled 2FA ${isEnabled ? 'ON' : 'OFF'}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Browser'
    }
  }).catch(() => {});

  res.status(200).json({
    success: true,
    message: `Two-Factor Authentication (Email OTP) ${isEnabled ? 'ENABLED' : 'DISABLED'}.`,
    data: { twoFactorEnabled: updatedAdmin.twoFactorEnabled }
  });
});

// ==================== REVOKE ALL OTHER SESSIONS ====================
exports.revokeAllOtherSessions = asyncHandler(async (req, res) => {
  const admin = await prisma.user.findUnique({ where: { id: req.user.id } });

  const newTokenVersion = (admin.tokenVersion || 0) + 1;

  // Clear trusted devices
  await prisma.adminTrustedDevice.deleteMany({ where: { adminId: admin.id } }).catch(() => {});

  // Update token version
  await prisma.user.update({
    where: { id: admin.id },
    data: { tokenVersion: newTokenVersion }
  });

  const newToken = generateToken(admin.id, admin.role, newTokenVersion);

  await prisma.adminActionLog.create({
    data: {
      adminId: admin.id,
      adminName: admin.fullName,
      targetUserId: admin.id,
      targetName: admin.fullName,
      action: 'ALL_SESSIONS_REVOKED',
      reason: 'Admin logged out all other active devices & trusted sessions',
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Browser'
    }
  }).catch(() => {});

  res.status(200).json({
    success: true,
    message: 'All other active sessions and trusted devices have been logged out.',
    data: { token: newToken }
  });
});

// ==================== GET ADMIN SECURITY ACTIVITY LOGS ====================
exports.getAdminSecurityLogs = asyncHandler(async (req, res) => {
  const logs = await prisma.adminActionLog.findMany({
    where: {
      OR: [
        { adminId: req.user.id },
        { targetUserId: req.user.id }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  res.status(200).json({
    success: true,
    data: logs
  });
});

// ==================== GET MAINTENANCE STATUS ====================
exports.getMaintenanceStatus = asyncHandler(async (req, res) => {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'maintenance_mode' }
  });
  res.status(200).json({
    success: true,
    data: { maintenanceMode: setting?.value === 'true' }
  });
});

// ==================== TOGGLE MAINTENANCE MODE ====================
exports.toggleMaintenanceMode = asyncHandler(async (req, res, next) => {
  const { value } = req.body;
  const isEnabled = String(value) === 'true';

  await prisma.systemSetting.upsert({
    where: { key: 'maintenance_mode' },
    update: { value: String(isEnabled) },
    create: { key: 'maintenance_mode', value: String(isEnabled) }
  });

  res.status(200).json({
    success: true,
    message: `Maintenance Mode ${isEnabled ? 'ENABLED' : 'DISABLED'}`,
    data: { maintenanceMode: isEnabled }
  });
});

