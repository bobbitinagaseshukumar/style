const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// ==================== PUBLIC VENDOR REGISTRATION ====================
exports.registerVendor = asyncHandler(async (req, res, next) => {
  const { storeName, ownerName, email, phone, gstin } = req.body;

  if (!storeName || !ownerName || !email || !phone || !gstin) {
    return next(new ApiError(400, 'Please fill in Store Name, Owner Name, Email, Phone, and GSTIN'));
  }

  const existing = await prisma.vendor.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return next(new ApiError(400, 'A vendor application with this email address already exists.'));
  }

  const vendor = await prisma.vendor.create({
    data: {
      storeName,
      ownerName,
      email: email.toLowerCase(),
      phone,
      gstin,
      status: 'PENDING',
    },
  });

  res.status(201).json({
    success: true,
    message: 'Vendor application submitted! Our merchant onboarding team will review your details within 24 hours.',
    data: vendor,
  });
});

// ==================== ADMIN: GET VENDORS & STORES ====================
exports.adminGetVendors = asyncHandler(async (req, res) => {
  const vendors = await prisma.vendor.findMany({ orderBy: { createdAt: 'desc' } });
  res.status(200).json({ success: true, data: vendors });
});

exports.adminUpdateVendorStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, commissionRate } = req.body;

  const vendor = await prisma.vendor.update({
    where: { id },
    data: {
      status,
      commissionRate: commissionRate !== undefined ? parseFloat(commissionRate) : undefined,
    },
  });

  res.status(200).json({
    success: true,
    message: `Vendor '${vendor.storeName}' status updated to ${status}!`,
    data: vendor,
  });
});

// ==================== PAYOUT REQUESTS ====================
exports.requestPayout = asyncHandler(async (req, res, next) => {
  const { vendorId, amount } = req.body;
  if (!vendorId || !amount || amount <= 0) {
    return next(new ApiError(400, 'Vendor ID and valid Payout Amount are required'));
  }

  const payout = await prisma.payoutRequest.create({
    data: { vendorId, amount: parseFloat(amount), status: 'PENDING' },
  });

  res.status(201).json({
    success: true,
    message: 'Payout request submitted for Super Admin approval.',
    data: payout,
  });
});

exports.adminGetPayouts = asyncHandler(async (req, res) => {
  const payouts = await prisma.payoutRequest.findMany({ orderBy: { createdAt: 'desc' } });
  res.status(200).json({ success: true, data: payouts });
});

// ==================== BRANCH LOCATIONS ====================
exports.getBranches = asyncHandler(async (req, res) => {
  const branches = await prisma.branch.findMany({ orderBy: { createdAt: 'desc' } });
  res.status(200).json({ success: true, data: branches });
});

exports.createBranch = asyncHandler(async (req, res) => {
  const { name, city, address, manager } = req.body;
  const branch = await prisma.branch.create({
    data: { name, city, address, manager },
  });
  res.status(201).json({ success: true, message: 'Branch location added', data: branch });
});
