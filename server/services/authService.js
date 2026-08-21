const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');

/**
 * Enterprise Modular Authentication Service
 * Decoupled provider layer ready for Firebase Auth / Nodemailer integration
 */
class AuthService {
  /**
   * Register with Email & Password
   */
  async registerWithEmail({ fullName, email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      throw new ApiError(400, 'An account with this email address already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Auto-generate CUS customer ID
    const userCount = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const customerId = `CUS${String(userCount + 1).padStart(6, '0')}`;

    const user = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        customerId,
        role: 'CUSTOMER',
        authProvider: 'LOCAL',
        status: 'ACTIVE',
        isVerified: false,
      },
      select: {
        id: true, customerId: true, fullName: true, email: true, role: true,
        avatar: true, authProvider: true, isVerified: true, createdAt: true,
      }
    });

    const token = this.generateToken(user);
    return { user, token };
  }

  /**
   * Login with Email & Password
   */
  async loginWithEmail({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    if (user.status === 'BLOCKED') {
      throw new ApiError(403, `Account blocked: ${user.blockReason || 'Contact support'}`);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const token = this.generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  /**
   * Social Authentication (Google / GitHub Placeholder ready for Firebase Auth)
   */
  async loginWithSocial({ provider, email, fullName, avatar, firebaseUid }) {
    const normalizedEmail = email.trim().toLowerCase();

    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      // Auto-register new social user
      const userCount = await prisma.user.count({ where: { role: 'CUSTOMER' } });
      const customerId = `CUS${String(userCount + 1).padStart(6, '0')}`;

      // Random secure password for social accounts
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);

      user = await prisma.user.create({
        data: {
          fullName: fullName || 'Social User',
          email: normalizedEmail,
          password: randomPassword,
          customerId,
          avatar: avatar || null,
          role: 'CUSTOMER',
          authProvider: provider.toUpperCase(), // GOOGLE | GITHUB
          firebaseUid: firebaseUid || null,
          isVerified: true,
          status: 'ACTIVE',
        }
      });
    } else {
      // Update existing user's social info
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          avatar: avatar || user.avatar,
          firebaseUid: firebaseUid || user.firebaseUid,
          authProvider: user.authProvider === 'LOCAL' ? provider.toUpperCase() : user.authProvider,
        }
      });
    }

    const token = this.generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  /**
   * Helper: Generate JWT Token
   */
  generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion || 0 },
      process.env.JWT_SECRET || 'styleverse_super_secret_jwt_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '4d' }
    );
  }
}

module.exports = new AuthService();
