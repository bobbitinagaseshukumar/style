const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    const existingSuperAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { role: 'SUPER_ADMIN' },
          { adminRole: 'SUPER_ADMIN' }
        ]
      }
    });

    if (!existingSuperAdmin) {
      const defaultEmail = 'admin@styleverse.com';
      const defaultPass = 'StyleVerseAdmin2026!';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultPass, salt);

      const superAdmin = await prisma.user.create({
        data: {
          fullName: 'Super Administrator',
          username: 'superadmin',
          email: defaultEmail,
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
      console.log(`[SECURITY BOOTSTRAP] Default Super Admin auto-created: ${defaultEmail} / ${defaultPass}`);
      return superAdmin;
    }
  } catch (err) {
    console.error('[SECURITY BOOTSTRAP] Error creating Super Admin:', err.message);
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

  // Check 30-Day Trusted Device
  if (deviceFingerprint) {
    const trustedDevice = await prisma.adminTrustedDevice.findFirst({
      where: {
        adminId: admin.id,
        deviceFingerprint,
        trustedUntil: { gt: new Date() }
      }
    });

    if (trustedDevice) {
      // Bypasses OTP for trusted device
      const token = generateToken(admin.id, admin.role, admin.tokenVersion);
      await prisma.user.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() }
      });

      await logLoginAttempt(admin.id, cleanEmail, req, 'SUCCESS', 'Bypassed OTP via 30-Day Trusted Device');

      return res.status(200).json({
        success: true,
        step: 'AUTHENTICATED',
        message: 'Welcome back, Administrator!',
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
    }
  }

  // Generate 6-Digit Email OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 Minutes Expiry

  await prisma.user.update({
    where: { id: admin.id },
    data: { otpCode, otpExpiresAt }
  });

  await logLoginAttempt(admin.id, cleanEmail, req, 'OTP_REQUIRED', '6-Digit Email OTP generated');

  res.status(200).json({
    success: true,
    step: 'OTP_REQUIRED',
    message: `A 6-digit verification code has been sent to your registered email: ${cleanEmail}`,
    data: {
      adminId: admin.id,
      email: cleanEmail,
      otpCode // Returning in response payload for instant testing & display
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

  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin) return next(new ApiError(404, 'Admin account not found'));

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.user.update({
    where: { id: adminId },
    data: { otpCode, otpExpiresAt }
  });

  res.status(200).json({
    success: true,
    message: `A new 6-digit OTP code has been sent to ${admin.email}`,
    data: { otpCode }
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

// ==================== MAINTENANCE MODE TOGGLE ====================
exports.getMaintenanceStatus = asyncHandler(async (req, res) => {
  const setting = await prisma.systemSetting.findUnique({ where: { key: 'MAINTENANCE_MODE' } });
  res.status(200).json({
    success: true,
    data: {
      maintenanceMode: setting?.value === 'true',
      updatedAt: setting?.updatedAt
    }
  });
});

exports.toggleMaintenanceMode = asyncHandler(async (req, res) => {
  const { enabled } = req.body;
  const value = enabled === true || enabled === 'true' ? 'true' : 'false';

  const setting = await prisma.systemSetting.upsert({
    where: { key: 'MAINTENANCE_MODE' },
    update: { value },
    create: { key: 'MAINTENANCE_MODE', value }
  });

  res.status(200).json({
    success: true,
    message: `Maintenance Mode ${value === 'true' ? 'ENABLED (Customers will see maintenance page)' : 'DISABLED (Public access restored)'}`,
    data: { maintenanceMode: value === 'true' }
  });
});
