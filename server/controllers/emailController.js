/**
 * Admin Email Campaign Controller
 * POST /api/admin/email/campaign       — Create & send campaign
 * POST /api/admin/email/test           — Send test email
 * GET  /api/admin/email/campaigns      — List campaigns
 * GET  /api/admin/email/campaigns/:id  — Get one
 * PUT  /api/admin/email/campaigns/:id  — Update
 * DELETE /api/admin/email/campaigns/:id
 */

const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const emailService = require('../services/emailService');
const templates = require('../emails/templates');

/* ─── Create & Send Campaign ────────────────────────────────── */
exports.createCampaign = asyncHandler(async (req, res, next) => {
  const {
    title,
    subject,
    type,           // 'offer' | 'newsletter' | 'new_arrivals' | 'custom'
    bodyHtml,
    // Offer specific
    offerTitle,
    discount,
    couponCode,
    endDate,
    description,
    // Audience
    target,         // 'all' | 'verified' | 'subscribed'
    sendNow,        // bool
    scheduledAt,    // ISO date string
    // Products (new arrivals)
    products,
  } = req.body;

  if (!title || !subject || !type) {
    return next(new ApiError(400, 'title, subject, and type are required'));
  }

  // Resolve recipients
  const whereClause = { isVerified: true };
  if (target === 'subscribed') whereClause.emailNotifications = true;

  const users = await prisma.user.findMany({
    where: whereClause,
    select: { id: true, email: true, fullName: true },
  });

  if (users.length === 0) {
    return res.status(200).json({ success: true, message: 'No eligible recipients found.' });
  }

  // Build HTML based on type
  let buildHtml;
  switch (type) {
    case 'offer':
      buildHtml = (name) => templates.offerEmail(name, { title: offerTitle, discount, couponCode, endDate, description });
      break;
    case 'new_arrivals':
      buildHtml = (name) => templates.newArrivalsEmail(name, products || []);
      break;
    case 'newsletter':
    case 'custom':
    default:
      buildHtml = (name) => templates.newsletterEmail(name, subject, bodyHtml || '');
  }

  const results = { sent: 0, failed: 0 };

  if (sendNow) {
    // Fire-and-forget in background
    setImmediate(async () => {
      for (const user of users) {
        try {
          await emailService.sendEmail({
            to: user.email,
            subject,
            html: buildHtml(user.fullName),
          });
          results.sent++;
        } catch {
          results.failed++;
        }
        await new Promise(r => setTimeout(r, 80)); // throttle
      }
      console.log(`[CAMPAIGN] "${title}" complete. Sent: ${results.sent}, Failed: ${results.failed}`);
    });

    return res.status(200).json({
      success: true,
      message: `Campaign "${title}" is sending to ${users.length} recipients in the background.`,
      data: { recipientCount: users.length },
    });
  }

  // Schedule for later (simple setTimeout — production use Bull queue)
  if (scheduledAt) {
    const delay = new Date(scheduledAt) - Date.now();
    if (delay <= 0) return next(new ApiError(400, 'scheduledAt must be in the future'));

    setTimeout(() => {
      users.forEach(user => emailService.sendEmail({
        to: user.email,
        subject,
        html: buildHtml(user.fullName),
      }));
      console.log(`[CAMPAIGN] Scheduled campaign "${title}" sent to ${users.length} users`);
    }, delay);

    return res.status(200).json({
      success: true,
      message: `Campaign "${title}" scheduled for ${new Date(scheduledAt).toLocaleString('en-IN')}`,
      data: { recipientCount: users.length, scheduledAt },
    });
  }

  return next(new ApiError(400, 'Either sendNow:true or scheduledAt is required'));
});

/* ─── Send Test Email ───────────────────────────────────────── */
exports.sendTestEmail = asyncHandler(async (req, res, next) => {
  const { to, type, data } = req.body;
  if (!to) return next(new ApiError(400, 'to email is required'));

  let html, subject;
  switch (type) {
    case 'otp':
      html = templates.otpEmail('Test User', '123456');
      subject = 'TEST — OTP Email';
      break;
    case 'welcome':
      html = templates.welcomeEmail('Test User', to);
      subject = 'TEST — Welcome Email';
      break;
    case 'order_placed':
      html = templates.orderPlacedEmail('Test User', {
        orderNumber: 'TEST001',
        items: [{ name: 'Designer Silk Saree', price: 2999, quantity: 1, color: 'Red', size: 'Free Size' }],
        subtotal: 2999, total: 2999, shippingCharge: 0,
        address: '123 Test Street, Hyderabad', estimatedDelivery: '3-5 Business Days',
      });
      subject = 'TEST — Order Confirmation Email';
      break;
    case 'offer':
      html = templates.offerEmail('Test User', { title: 'Festival Sale', discount: 30, couponCode: 'FEST30', description: 'Test offer description' });
      subject = 'TEST — Offer Email';
      break;
    case 'abandoned_cart':
      html = templates.abandonedCartEmail('Test User', [
        { name: 'Silk Saree', price: 2999, image: '' },
        { name: 'Gold Earrings', price: 1299, image: '' },
      ], 10);
      subject = 'TEST — Abandoned Cart Email';
      break;
    default:
      html = templates.newsletterEmail('Test User', 'Test Newsletter', '<p>This is a test newsletter body.</p>');
      subject = 'TEST — Newsletter Email';
  }

  await emailService.sendEmail({ to, subject, html, priority: 'high' });

  res.status(200).json({
    success: true,
    message: `Test email (${type}) sent to ${to}`,
  });
});

/* ─── Notify customers: Back in Stock ──────────────────────── */
exports.notifyBackInStock = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  // Find all users who requested alert (stored in a JSON meta table or notification table)
  const alerts = await prisma.notification.findMany({
    where: {
      type: 'BACK_IN_STOCK',
      data: { path: ['productId'], equals: productId },
    },
    include: { user: true },
  });

  let sent = 0;
  for (const alert of alerts) {
    if (alert.user?.email) {
      emailService.sendBackInStockEmail(alert.user.email, alert.user.fullName, {
        name: product.name,
        price: product.discountPrice || product.price,
        slug: product.slug,
        image: product.images?.[0]?.url,
      });
      sent++;
    }
  }

  res.status(200).json({ success: true, message: `Back-in-stock alert sent to ${sent} customers` });
});

/* ─── Send order emails (called from orderController) ─────── */
exports.sendOrderStatusEmail = asyncHandler(async (req, res) => {
  const { orderId, status } = req.body;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: { include: { product: { include: { images: true } } } },
      address: true,
    },
  });

  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  const email = order.user?.email;
  const fullName = order.user?.fullName;
  const orderData = {
    orderNumber: order.orderNumber,
    orderId: order.id,
    items: order.items.map(i => ({
      name: i.product?.name,
      price: i.price,
      quantity: i.quantity,
      color: i.color,
      size: i.size,
      image: i.product?.images?.[0]?.url,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    shippingCharge: order.shippingCharge,
    total: order.total,
    address: order.address ? `${order.address.addressLine1}, ${order.address.city}, ${order.address.state}` : '',
    estimatedDelivery: '3-5 Business Days',
    courierName: order.courierName,
    trackingNumber: order.trackingNumber,
    trackingUrl: order.trackingUrl,
    reason: order.cancelReason,
    refundStatus: order.refundStatus,
  };

  switch (status) {
    case 'CONFIRMED':
      emailService.sendOrderPlacedEmail(email, fullName, orderData);
      break;
    case 'SHIPPED':
      emailService.sendOrderShippedEmail(email, fullName, orderData);
      break;
    case 'DELIVERED':
      emailService.sendOrderDeliveredEmail(email, fullName, orderData);
      break;
    case 'CANCELLED':
      emailService.sendOrderCancelledEmail(email, fullName, orderData);
      break;
    default:
      return res.status(400).json({ success: false, message: 'Unknown status' });
  }

  res.status(200).json({ success: true, message: `${status} email sent to ${email}` });
});
