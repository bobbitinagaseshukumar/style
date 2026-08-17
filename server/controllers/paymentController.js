/**
 * Payment Controller — Razorpay Standard Checkout
 * Creates orders on Razorpay and verifies payment signatures.
 * Credentials are read from environment variables only.
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

/* ─── Initialize Razorpay instance ──────────────────────────── */
const getRazorpayInstance = () => {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.');
  }
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
};

/* ─── POST /api/v1/payments/create-order ────────────────────── */
exports.createRazorpayOrder = asyncHandler(async (req, res, next) => {
  const { amount, currency = 'INR', receipt, notes } = req.body;

  // Validate amount (Razorpay requires amount in paise, min 100 paise = ₹1)
  const amountInPaise = Math.round(Number(amount));
  if (!amountInPaise || amountInPaise < 100) {
    return next(new ApiError(400, 'Amount must be at least ₹1 (100 paise)'));
  }

  try {
    const razorpay = getRazorpayInstance();

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: currency.toUpperCase(),
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || { userId: req.user.id },
    });

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: env.RAZORPAY_KEY_ID, // Public key — safe to send to frontend
      },
    });
  } catch (err) {
    console.error('[RAZORPAY CREATE ORDER ERROR]:', err.message);

    if (err.statusCode === 401) {
      return next(new ApiError(401, 'Razorpay authentication failed. Check your API credentials.'));
    }
    return next(new ApiError(500, `Failed to create Razorpay order: ${err.error?.description || err.message}`));
  }
});

/* ─── POST /api/v1/payments/verify ──────────────────────────── */
exports.verifyPayment = asyncHandler(async (req, res, next) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId, // Our internal order ID (if order was already created in DB)
  } = req.body;

  // Validate required fields
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return next(new ApiError(400, 'Missing payment verification fields: razorpay_order_id, razorpay_payment_id, razorpay_signature'));
  }

  // Generate expected signature using HMAC-SHA256
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  // Compare signatures
  const isValid = expectedSignature === razorpay_signature;

  if (!isValid) {
    console.error('[RAZORPAY VERIFY] Signature mismatch!', {
      expected: expectedSignature.substring(0, 10) + '...',
      received: razorpay_signature.substring(0, 10) + '...',
    });
    return res.status(400).json({
      success: false,
      message: 'Payment verification failed — signature mismatch. Do NOT mark as paid.',
    });
  }

  // If an internal order ID is provided, update its payment status
  if (orderId) {
    try {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          paymentTxnId: razorpay_payment_id,
          paymentMethod: 'RAZORPAY',
        },
      });
    } catch (updateErr) {
      console.warn('[RAZORPAY VERIFY] Order update warning:', updateErr.message);
      // Payment is verified even if order update fails — don't fail the response
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Payment verified successfully',
    data: {
      razorpay_order_id,
      razorpay_payment_id,
      verified: true,
    },
  });
});

/* ─── GET /api/v1/payments/key ──────────────────────────────── */
exports.getRazorpayKey = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    data: { keyId: env.RAZORPAY_KEY_ID || '' },
  });
});
