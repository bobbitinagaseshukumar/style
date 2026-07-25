const prisma = require('../config/db');
const generateOTP = require('../utils/generateOTP');

// Generate 6-digit numeric OTP with 5-minute expiration
const createOTP = async (userId) => {
  // Delete existing OTPs for user
  await prisma.emailOTP.deleteMany({ where: { userId } });

  const otp = generateOTP(6);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await prisma.emailOTP.create({
    data: {
      userId,
      otp,
      expiresAt,
      attempts: 0,
    },
  });

  return otp;
};

// Verify OTP
const verifyOTPCode = async (userId, inputOTP) => {
  const otpRecord = await prisma.emailOTP.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    return { valid: false, message: 'No OTP requested or OTP expired' };
  }

  // Expiration check
  if (new Date() > new Date(otpRecord.expiresAt)) {
    await prisma.emailOTP.delete({ where: { id: otpRecord.id } });
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }

  // Max attempts check (5 attempts)
  if (otpRecord.attempts >= 5) {
    await prisma.emailOTP.delete({ where: { id: otpRecord.id } });
    return { valid: false, message: 'Maximum verification attempts exceeded. Please request a new OTP.' };
  }

  // Match check
  if (otpRecord.otp !== inputOTP.trim()) {
    await prisma.emailOTP.update({
      where: { id: otpRecord.id },
      data: { attempts: otpRecord.attempts + 1 },
    });
    return { valid: false, message: `Invalid OTP. ${4 - otpRecord.attempts} attempts remaining.` };
  }

  // Success - clear OTP
  await prisma.emailOTP.delete({ where: { id: otpRecord.id } });
  return { valid: true, message: 'OTP verified successfully' };
};

module.exports = {
  createOTP,
  verifyOTPCode,
};
