/**
 * Enhanced Order Controller with WhatsApp order support, email notifications,
 * and full order status lifecycle management.
 */

const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const emailService = require('../services/emailService');

/* ─── Helper: get WhatsApp settings ─────────────────────────── */
const getWASettings = async () => {
  try {
    return await prisma.storeSettings.findUnique({ where: { id: 'default' } });
  } catch { return null; }
};

/* ─── Helper: generate order number ─────────────────────────── */
const genOrderNumber = () => `KV-${Date.now().toString().slice(-7)}`;

/* ─── Helper: build WhatsApp confirmation message ───────────── */
const buildWAConfirmMsg = (fullName, order, siteUrl) => {
  const items = (order.items || []).map(i =>
    `• ${i.product?.name || i.name}${i.color ? ' | ' + i.color : ''}${i.size ? ' | Size ' + i.size : ''} × ${i.quantity} = ₹${(i.price * i.quantity).toLocaleString('en-IN')}`
  ).join('\n');

  return encodeURIComponent(
    `Hello ${fullName},\n\n` +
    `✅ Your Order *#${order.orderNumber}* has been *Confirmed!*\n\n` +
    `📦 *Order Summary:*\n${items}\n\n` +
    `💰 *Total: ₹${order.totalAmount?.toLocaleString('en-IN')}*\n\n` +
    `🚚 Estimated Delivery: 3-5 Business Days\n\n` +
    `🔗 Track Order: ${siteUrl}/orders\n\n` +
    `Thank you for shopping with us! 🙏`
  );
};

// ==================== CREATE ONLINE ORDER ====================
exports.createOrder = asyncHandler(async (req, res, next) => {
  const {
    items, addressId, paymentMethod, couponCode,
    discountAmount, shippingFee, notes, whatsappNumber,
    razorpayPaymentId, razorpayOrderId, razorpaySignature
  } = req.body;

  // 1. Restriction Check: Blocked customers can view products but cannot place orders
  const customer = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { status: true, canPlaceOrders: true, canCheckout: true }
  });

  if (customer?.status === 'BLOCKED' || customer?.canPlaceOrders === false || customer?.canCheckout === false) {
    return next(new ApiError(403, 'Your account is currently restricted from placing orders by store administration. You may browse and view products, but checkout is disabled. Please contact customer support.'));
  }

  // If Razorpay payment proof is provided, verify signature before creating order
  if (razorpayPaymentId && razorpayOrderId && razorpaySignature) {
    const crypto = require('crypto');
    const env = require('../config/env');
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
    if (expectedSignature !== razorpaySignature) {
      return next(new ApiError(400, 'Payment verification failed — signature mismatch. Order not created.'));
    }
  }

  // STRICT: Online payment methods MUST have verified payment proof
  // Only COD orders are allowed without razorpayPaymentId
  const ONLINE_METHODS = ['RAZORPAY', 'UPI', 'CARD', 'NET_BANKING'];
  if (ONLINE_METHODS.includes(paymentMethod) && !razorpayPaymentId) {
    return next(new ApiError(400, 'Online payment orders require verified payment. Please complete payment first.'));
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new ApiError(400, 'Order must contain at least one item'));
  }
  if (!addressId) {
    return next(new ApiError(400, 'Please select a delivery address'));
  }

  let subtotal = 0;
  const orderItemsData = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId || item.id },
      include: { images: true }
    });
    if (!product) return next(new ApiError(404, `Product '${item.name}' not found`));
    if (product.stock < item.quantity) {
      return next(new ApiError(400, `Insufficient stock for '${product.name}'. Available: ${product.stock}`));
    }
    const itemPrice = product.discountPrice || product.price;
    subtotal += itemPrice * item.quantity;
    const primaryImg = product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url || (typeof product.images?.[0] === 'string' ? product.images?.[0] : null);
    orderItemsData.push({
      productId: product.id,
      productName: product.name,
      productImage: primaryImg || null,
      price: itemPrice,
      quantity: item.quantity,
      size: item.size || null,
      color: item.color || null,
    });
  }

  const calcDiscount = discountAmount ? parseFloat(discountAmount) : 0;
  // Per-product shipping: sum each product's shippingFee (freeShipping products contribute ₹0)
  // If client sends explicit shippingFee, use it; otherwise calculate from product data
  let calcShipping = 0;
  if (shippingFee !== undefined && shippingFee !== null) {
    calcShipping = parseFloat(shippingFee);
  } else {
    // Fallback: calculate from product-level shipping fees
    for (const item of orderItemsData) {
      const prod = await prisma.product.findUnique({ where: { id: item.productId }, select: { shippingFee: true, freeShipping: true } });
      if (prod && !prod.freeShipping) {
        calcShipping += (prod.shippingFee || 0) * item.quantity;
      }
    }
    // If no per-product fees set, fallback to global default
    if (calcShipping === 0 && subtotal <= 999) calcShipping = 99;
  }
  const totalAmount = Math.max(0, subtotal - calcDiscount + calcShipping);
  const orderNumber = genOrderNumber();

  // Idempotency check: prevent duplicate orders within 30 seconds
  const recentOrder = await prisma.order.findFirst({
    where: {
      userId: req.user.id,
      createdAt: { gte: new Date(Date.now() - 30000) },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (recentOrder) {
    return res.status(200).json({
      success: true,
      message: 'Order already placed!',
      data: recentOrder,
      duplicate: true,
    });
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        userId: req.user.id,
        addressId,
        subtotal,
        discountAmount: calcDiscount,
        shippingFee: calcShipping,
        totalAmount,
        orderStatus: 'PENDING_APPROVAL',
        approvalStatus: 'PENDING_APPROVAL',
        // If Razorpay payment proof is verified, mark as PAID immediately; otherwise PENDING
        paymentStatus: razorpayPaymentId ? 'PAID' : (paymentMethod === 'COD' ? 'PENDING' : 'PENDING'),
        paymentTxnId: razorpayPaymentId || null,
        paymentMethod: paymentMethod || 'COD',
        couponCode: couponCode || null,
        notes: notes || null,
        items: { create: orderItemsData },
      },
      include: {
        items: { include: { product: { include: { images: true } } } },
        address: true,
        user: { select: { id: true, fullName: true, email: true, phone: true, whatsappNumber: true } },
      },
    });

    // NOTE: Stock is NOT decremented at order placement.
    // Stock is only decremented when Admin marks the order as DELIVERED.
    // This prevents stock issues when orders are cancelled/rejected before delivery.

    // Customer notification (Before Admin Approval)
    await tx.notification.create({
      data: {
        userId: req.user.id,
        title: `⏳ Order Received — Sent for Admin Approval (#${orderNumber})`,
        message: `Your order #${orderNumber} for ₹${totalAmount.toLocaleString('en-IN')} has been received and sent to admin for approval. We will notify you once approved!`,
        type: 'ORDER',
        link: '/orders',
      },
    });

    // Admin & Super Admin notification
    const admins = await tx.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      select: { id: true },
    });
    for (const admin of admins) {
      await tx.notification.create({
        data: {
          userId: admin.id,
          title: `🛍️ New Order #${orderNumber}`,
          message: `${created.user?.fullName || 'Customer'} placed an order for ₹${totalAmount.toLocaleString('en-IN')}`,
          type: 'ADMIN_ORDER',
          link: '/admin/orders',
        },
      });
    }

    return created;
  });

  // Send confirmation email to Customer AND Super Admin (async, non-blocking)
  setImmediate(async () => {
    try {
      const orderPayload = {
        orderNumber: order.orderNumber,
        orderId: order.id,
        customerName: order.user?.fullName || 'Valued Customer',
        customerEmail: order.user?.email || '',
        customerPhone: order.user?.phone || order.address?.phone || 'N/A',
        paymentMethod: order.paymentMethod || 'Online Payment',
        items: order.items.map(i => {
          const primaryImg = i.product?.images?.find(img => img.isPrimary) || i.product?.images?.[0];
          const imgUrl = primaryImg?.url || i.product?.images?.[0]?.url || (typeof i.product?.images?.[0] === 'string' ? i.product?.images?.[0] : null);
          return {
            slug: i.product?.slug || i.productId || i.id,
            name: i.product?.name || 'Product Item',
            price: i.price,
            quantity: i.quantity,
            color: i.color,
            size: i.size,
            image: imgUrl,
            imgId: primaryImg?.id,
            productId: i.productId || i.product?.id,
          };
        }),
        subtotal: order.subtotal,
        discount: order.discountAmount,
        shippingCharge: order.shippingFee,
        total: order.totalAmount,
        paymentStatus: order.paymentStatus,
        paymentTxnId: order.paymentTxnId,
        shippingAddress: order.address
          ? `${order.address.fullName || order.user?.fullName || ''}, ${order.address.street}, ${order.address.city}, ${order.address.state} - ${order.address.postalCode} (Phone: ${order.address.phone || 'N/A'})`
          : 'N/A',
        estimatedDelivery: '3-5 Business Days',
      };

      // 1. Send Order Confirmation Email to Customer
      if (order.user?.email) {
        emailService.sendOrderPlacedEmail(order.user.email, order.user.fullName, orderPayload);
      }

      // 2. Send New Order Alert Email to Super Admin(s) & Admin(s)
      try {
        const admins = await prisma.user.findMany({
          where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
          select: { email: true },
        });

        const adminEmails = Array.from(new Set(admins.map(a => a.email).filter(Boolean)));
        if (process.env.SMTP_USER && !adminEmails.includes(process.env.SMTP_USER)) {
          adminEmails.push(process.env.SMTP_USER);
        }
        if (process.env.ADMIN_EMAIL && !adminEmails.includes(process.env.ADMIN_EMAIL)) {
          adminEmails.push(process.env.ADMIN_EMAIL);
        }

        console.log(`[ORDER CONTROLLER] Sending Admin Order Alert Email for #${orderPayload.orderNumber} to:`, adminEmails);

        for (const adminEmail of adminEmails) {
          emailService.sendAdminOrderAlertEmail(adminEmail, orderPayload);
        }
      } catch (adminErr) {
        console.error('[ORDER CONTROLLER] Failed to send admin order alert email:', adminErr.message);
      }
    } catch (err) {
      console.error('[ORDER CONTROLLER] Order email dispatch error:', err.message);
    }
  });

  res.status(201).json({ success: true, message: 'Order placed successfully!', data: order });
});

// ==================== CREATE WHATSAPP ORDER (Log only) ====================
exports.createWhatsappOrder = asyncHandler(async (req, res, next) => {
  const { items, addressId, paymentMethod, notes, whatsappNumber } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new ApiError(400, 'Order must contain at least one item'));
  }

  let subtotal = 0;
  const orderItemsData = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId || item.id },
      include: { images: true }
    });
    if (!product) return next(new ApiError(404, `Product '${item.name}' not found`));
    const itemPrice = product.discountPrice || product.price;
    subtotal += itemPrice * item.quantity;
    const primaryImg = product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url || (typeof product.images?.[0] === 'string' ? product.images?.[0] : null);
    orderItemsData.push({
      productId: product.id,
      productName: product.name,
      productImage: primaryImg || null,
      price: itemPrice,
      quantity: item.quantity,
      size: item.size || null,
      color: item.color || null,
    });
  }

  const calcShipping = subtotal > 999 ? 0 : 99;
  const totalAmount = subtotal + calcShipping;
  const orderNumber = genOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        userId: req.user.id,
        addressId: addressId || null,
        subtotal,
        shippingFee: calcShipping,
        totalAmount,
        orderStatus: 'WHATSAPP_PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: paymentMethod || 'COD',
        notes: `[WhatsApp Order] ${notes || ''}`.trim(),
        items: { create: orderItemsData },
      },
      include: {
        items: { include: { product: { include: { images: true } } } },
        address: true,
        user: { select: { fullName: true, email: true, phone: true, whatsappNumber: true } },
      },
    });

    // Notify admins & super admins
    const admins = await tx.user.findMany({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } }, select: { id: true } });
    for (const admin of admins) {
      await tx.notification.create({
        data: {
          userId: admin.id,
          title: `📱 New WhatsApp Order #${orderNumber}`,
          message: `${created.user?.fullName || 'Customer'} is placing a WhatsApp order for ₹${totalAmount.toLocaleString('en-IN')}`,
          type: 'ADMIN_ORDER',
          link: '/admin/orders',
        },
      });
    }

    return created;
  });

  res.status(201).json({
    success: true,
    message: 'WhatsApp order logged. Opening WhatsApp...',
    data: { orderId: order.id, orderNumber: order.orderNumber, totalAmount: order.totalAmount },
  });
});

// ==================== GET MY ORDERS ====================
exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: {
      items: { include: { product: { include: { images: true } } } },
      address: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json({ success: true, data: orders });
});

// ==================== GET ORDER DETAILS ====================
exports.getOrderById = asyncHandler(async (req, res, next) => {
  const isServerAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
  const whereClause = isServerAdmin ? { id: req.params.id } : { id: req.params.id, userId: req.user.id };

  const order = await prisma.order.findFirst({
    where: whereClause,
    include: {
      items: { include: { product: { include: { images: true } } } },
      address: true,
      user: { select: { fullName: true, email: true, phone: true, whatsappNumber: true } },
    },
  });
  if (!order) return next(new ApiError(404, 'Order not found'));
  res.status(200).json({ success: true, data: order });
});

// ==================== CANCEL ORDER (STRICT SERVER-SIDE VALIDATION) ====================
exports.cancelOrder = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: { items: true },
  });

  if (!order) return next(new ApiError(404, 'Order not found'));

  // 1. Disallow cancellation if in advanced fulfillment stage
  if (['PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REJECTED', 'RETURNED'].includes(order.orderStatus)) {
    return next(new ApiError(400, `Cannot cancel order in status '${order.orderStatus}'`));
  }

  // 2. Disallow if Admin disabled cancellation
  if (!order.cancellationAllowed) {
    return next(new ApiError(400, 'Cancellation is not enabled for this order by Admin.'));
  }

  // 3. Strict Server-Time Window Check
  const now = new Date();
  if (order.cancellationStart && now < new Date(order.cancellationStart)) {
    return next(new ApiError(400, 'Cancellation window has not started yet.'));
  }
  if (order.cancellationEnd && now > new Date(order.cancellationEnd)) {
    return next(new ApiError(400, 'Cancellation period has expired. The order is now being processed.'));
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        orderStatus: 'CANCELLED',
        cancelledBy: 'CUSTOMER',
        cancelledAt: now,
        cancellationAllowed: false,
        cancellationReason: reason || 'Cancelled by customer during cancellation window',
      },
    });

    // Stock restore is only needed if the order was previously DELIVERED
    // (stock is decremented only on delivery, not on order placement)
    if (order.orderStatus === 'DELIVERED') {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    // Customer Notification
    await tx.notification.create({
      data: {
        userId: req.user.id,
        title: `Order Cancelled (#${order.orderNumber})`,
        message: 'Your order has been cancelled successfully and refund initiated.',
        type: 'ORDER',
        link: '/orders',
      },
    });

    // Notify all admins and super admins about the cancellation
    const admins = await tx.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      select: { id: true },
    });
    for (const admin of admins) {
      await tx.notification.create({
        data: {
          userId: admin.id,
          title: `❌ Order Cancelled (#${order.orderNumber})`,
          message: `Customer cancelled order #${order.orderNumber}. Reason: ${reason || 'Not specified'}`,
          type: 'ADMIN_ORDER',
          link: '/admin/orders',
        },
      });
    }
  });

  res.status(200).json({ success: true, message: 'Order cancelled successfully.' });
});

// ==================== ADMIN: GET ALL ORDERS ====================
exports.adminGetAllOrders = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { deletedByAdmin: false };
  if (status && status !== 'ALL') where.orderStatus = status;
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { user: { fullName: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [orders, total, statusCounts] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: { include: { product: { include: { images: { take: 1 } } } } },
        address: true,
        user: { select: { fullName: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({
      by: ['orderStatus'],
      where: { deletedByAdmin: false },
      _count: { id: true }
    }),
  ]);

  const statusMap = (statusCounts || []).reduce((acc, cur) => {
    acc[cur.orderStatus] = cur._count.id;
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    data: orders || [],
    statusCounts: statusMap,
    meta: { total: total || 0, page: parseInt(page), limit: parseInt(limit) },
  });
});

// ==================== ADMIN: UPDATE ORDER STATUS ====================
exports.adminUpdateOrderStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const {
    orderStatus, courierName, trackingNumber, trackingUrl,
    cancelReason, expectedDeliveryDate, deliveryDate, deliveryTimeSlot, deliveryTime,
    packingDate, shippingDate, internalNotes,
    cancellationAllowed, cancellationDuration
  } = req.body;

  const updateData = {};
  if (orderStatus) updateData.orderStatus = orderStatus;
  if (courierName !== undefined) updateData.courierName = courierName;
  if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
  if (trackingUrl !== undefined) updateData.trackingUrl = trackingUrl;
  if (cancelReason !== undefined) updateData.cancelReason = cancelReason;
  if (expectedDeliveryDate !== undefined) updateData.deliveryDate = expectedDeliveryDate;
  if (deliveryDate !== undefined) updateData.deliveryDate = deliveryDate;
  if (deliveryTimeSlot !== undefined) updateData.deliveryTime = deliveryTimeSlot;
  if (deliveryTime !== undefined) updateData.deliveryTime = deliveryTime;
  if (packingDate !== undefined) updateData.packingDate = packingDate;
  if (shippingDate !== undefined) updateData.shippingDate = shippingDate;
  if (internalNotes !== undefined) updateData.notes = internalNotes;
  if (orderStatus === 'DELIVERED') updateData.deliveredAt = new Date();

  if (cancellationAllowed === true && cancellationDuration !== undefined) {
    updateData.cancellationAllowed = true;
    updateData.cancellationStart = new Date();
    updateData.cancellationEnd = new Date(Date.now() + cancellationDuration * 60 * 1000);
  } else if (cancellationAllowed === false) {
    updateData.cancellationAllowed = false;
    updateData.cancellationStart = null;
    updateData.cancellationEnd = null;
  }

  const order = await prisma.order.update({
    where: { id },
    data: updateData,
    include: {
      items: { include: { product: { include: { images: true } } } },
      address: true,
      user: { select: { fullName: true, email: true, phone: true, whatsappNumber: true } },
    },
  });

  // Decrement stock ONLY when order is marked as DELIVERED
  if (orderStatus === 'DELIVERED') {
    for (const item of order.items) {
      if (item.productId) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }
  }

  // In-app rich notification to customer
  const targetStatus = orderStatus || order.orderStatus;
  let notifTitle = `Order Update: ${targetStatus.replace(/_/g, ' ')} (#${order.orderNumber})`;
  let notifMessage = `Your order #${order.orderNumber} status has been updated to ${targetStatus.replace(/_/g, ' ')}.`;

  if (targetStatus === 'PROCESSING' || targetStatus === 'APPROVED' || targetStatus === 'CONFIRMED') {
    notifTitle = `✅ Order Confirmed! (#${order.orderNumber})`;
    notifMessage = `Great news! Your order #${order.orderNumber} has been verified and confirmed.${expectedDeliveryDate ? ' Expected Delivery: ' + expectedDeliveryDate : ' Preparing for dispatch!'}`;
  } else if (targetStatus === 'PACKED') {
    notifTitle = `📦 Order Packed (#${order.orderNumber})`;
    notifMessage = `Your items for order #${order.orderNumber} have been quality checked and safely packed.`;
  } else if (targetStatus === 'SHIPPED') {
    notifTitle = `🚚 Order Shipped & Dispatched (#${order.orderNumber})`;
    notifMessage = `Your order #${order.orderNumber} is on the way via ${courierName || 'our delivery partner'}.${trackingNumber ? ' Tracking ID: ' + trackingNumber : ''}`;
  } else if (targetStatus === 'OUT_FOR_DELIVERY') {
    notifTitle = `🛵 Out for Delivery (#${order.orderNumber})`;
    notifMessage = `Your package for order #${order.orderNumber} is out for delivery today. Please ensure someone is available to receive it.`;
  } else if (targetStatus === 'DELIVERED') {
    notifTitle = `🎉 Order Delivered (#${order.orderNumber})`;
    notifMessage = `Your order #${order.orderNumber} has been successfully delivered! We hope you love your purchase.`;
  } else if (targetStatus === 'CANCELLED') {
    notifTitle = `❌ Order Cancelled (#${order.orderNumber})`;
    notifMessage = `Your order #${order.orderNumber} has been cancelled.${cancelReason ? ' Reason: ' + cancelReason : ''}`;
  }

  await prisma.notification.create({
    data: {
      userId: order.userId,
      title: notifTitle,
      message: notifMessage,
      type: 'ORDER',
      link: '/orders',
    },
  });

  // Email notifications per status
  const settings = await getWASettings();
  const siteUrl = process.env.CLIENT_URL || 'http://localhost:3000';
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
    total: order.totalAmount,
    courierName: order.courierName,
    trackingNumber: order.trackingNumber,
    trackingUrl: order.trackingUrl,
    reason: order.cancelReason,
    estimatedDelivery: '2-3 Business Days',
  };

  setImmediate(() => {
    switch (orderStatus) {
      case 'CONFIRMED':
        emailService.sendOrderApprovedEmail(order.user.email, order.user.fullName, orderData);
        prisma.notification.create({
          data: {
            userId: order.userId,
            title: `✅ Order Approved & Confirmed (#${order.orderNumber})`,
            message: `Your order #${order.orderNumber} has been approved by admin! Expected Delivery: 3-5 Business Days.`,
            type: 'ORDER',
            link: '/orders',
          },
        }).catch(() => {});
        break;
      case 'SHIPPED':
        emailService.sendOrderShippedEmail(order.user.email, order.user.fullName, orderData);
        break;
      case 'DELIVERED':
        emailService.sendOrderDeliveredEmail(order.user.email, order.user.fullName, orderData);
        break;
      case 'CANCELLED':
        emailService.sendOrderCancelledEmail(order.user.email, order.user.fullName, orderData);
        break;
    }
  });

  // Build WhatsApp deeplink for admin to message customer (returned to frontend)
  let whatsappLink = null;
  const customerWA = order.user?.whatsappNumber;
  if (settings?.whatsappEnabled && customerWA) {
    const msgMap = {
      CONFIRMED: `Hello ${order.user.fullName},\n✅ Your order *#${order.orderNumber}* has been *Confirmed!*\n🚚 Estimated Delivery: 3-5 Business Days\n🔗 Track: ${siteUrl}/orders`,
      SHIPPED: `Hello ${order.user.fullName},\n🚚 Your order *#${order.orderNumber}* is *On the Way!*\n📦 Courier: ${order.courierName || 'Our Logistics'}\n🔢 Tracking: ${order.trackingNumber || 'Will be updated'}`,
      DELIVERED: `Hello ${order.user.fullName},\n🎁 Your order *#${order.orderNumber}* has been *Delivered!*\nWe hope you love it! Please leave a review. 🙏`,
      CANCELLED: `Hello ${order.user.fullName},\n❌ Your order *#${order.orderNumber}* has been *Cancelled.*\nReason: ${order.cancelReason || 'As requested'}\nFor help: ${siteUrl}/support`,
    };
    const msg = msgMap[orderStatus];
    if (msg) {
      const phone = customerWA.replace(/\D/g, '');
      whatsappLink = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    }
  }

  res.status(200).json({
    success: true,
    message: `Order status updated to ${orderStatus}`,
    data: order,
    whatsappLink,
  });
});

// ==================== ADMIN: APPROVE ORDER WITH CANCELLATION WINDOW ====================
exports.adminApproveOrder = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const {
    deliveryDate, deliveryTime, packingDate, shippingDate, deliveryNotes,
    cancellationAllowed, cancellationDurationMinutes,
    cancellationStart, cancellationEnd
  } = req.body;

  const now = new Date();
  let cStart = null;
  let cEnd = null;

  if (cancellationAllowed) {
    cStart = cancellationStart ? new Date(cancellationStart) : now;
    if (cancellationEnd) {
      cEnd = new Date(cancellationEnd);
    } else if (cancellationDurationMinutes) {
      cEnd = new Date(now.getTime() + parseInt(cancellationDurationMinutes) * 60 * 1000);
    } else {
      cEnd = new Date(now.getTime() + 60 * 60 * 1000); // Default 1 hour
    }
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      orderStatus: 'CONFIRMED',
      approvalStatus: 'APPROVED',
      approvedAt: now,
      approvedBy: req.user.id,
      deliveryDate: deliveryDate || null,
      deliveryTime: deliveryTime || null,
      packingDate: packingDate || null,
      shippingDate: shippingDate || null,
      deliveryNotes: deliveryNotes || null,
      cancellationAllowed: !!cancellationAllowed,
      cancellationStart: cStart,
      cancellationEnd: cEnd,
    },
    include: {
      items: { include: { product: { include: { images: true } } } },
      address: true,
      user: { select: { fullName: true, email: true, phone: true, whatsappNumber: true } },
    },
  });

  // Notify Customer (In-App & Email)
  await prisma.notification.create({
    data: {
      userId: order.userId,
      title: `✅ Order Approved (#${order.orderNumber})`,
      message: `Your order has been approved! Expected Delivery: ${deliveryDate || '3-5 Business Days'}.${
        cancellationAllowed ? ' Cancellation window is open.' : ''
      }`,
      type: 'ORDER',
      link: '/orders',
    },
  });

  setImmediate(async () => {
    try {
      const orderPayload = {
        orderNumber: order.orderNumber,
        orderId: order.id,
        customerName: order.user?.fullName || 'Valued Customer',
        customerEmail: order.user?.email || '',
        customerPhone: order.user?.phone || order.address?.phone || 'N/A',
        paymentMethod: order.paymentMethod || 'Online Payment',
        items: order.items.map(i => {
          const primaryImg = i.product?.images?.find(img => img.isPrimary) || i.product?.images?.[0];
          const imgUrl = i.productImage || primaryImg?.url || i.product?.images?.[0]?.url || (typeof i.product?.images?.[0] === 'string' ? i.product?.images?.[0] : null);
          return {
            slug: i.product?.slug || i.productId || i.id,
            name: i.productName || i.product?.name || 'Product Item',
            price: i.price,
            quantity: i.quantity,
            color: i.color,
            size: i.size,
            image: imgUrl,
            imgId: primaryImg?.id,
            productId: i.productId || i.product?.id,
          };
        }),
        subtotal: order.subtotal,
        discount: order.discountAmount,
        shippingCharge: order.shippingFee,
        total: order.totalAmount,
        shippingAddress: order.address
          ? `${order.address.fullName || order.user?.fullName || ''}, ${order.address.street}, ${order.address.city}, ${order.address.state} - ${order.address.postalCode}`
          : 'N/A',
        estimatedDelivery: deliveryDate || '3-5 Business Days',
        packingDate: packingDate || null,
        shippingDate: shippingDate || null,
        deliveryTime: deliveryTime || null,
      };
      if (order.user?.email) {
        await emailService.sendOrderApprovedEmail(order.user.email, order.user.fullName || 'Valued Customer', orderPayload);
      }
    } catch (mailErr) {
      console.error('[APPROVAL EMAIL ERROR]', mailErr.message);
    }
  });

  res.status(200).json({
    success: true,
    message: 'Order approved successfully with cancellation window configured',
    data: order,
  });
});

// ==================== ADMIN: REJECT ORDER ====================
exports.adminRejectOrder = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, user: { select: { email: true, fullName: true } } },
  });

  if (!order) return next(new ApiError(404, 'Order not found'));

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id },
      data: {
        orderStatus: 'REJECTED',
        approvalStatus: 'REJECTED',
        cancellationAllowed: false,
        cancellationReason: reason || 'Rejected by Admin',
      },
    });

    // Stock restore is only needed if the order was previously DELIVERED
    // (stock is decremented only on delivery, not on order placement)
    if (order.orderStatus === 'DELIVERED') {
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    }

    // Customer In-App Notification
    await tx.notification.create({
      data: {
        userId: order.userId,
        title: `❌ Order Rejected (#${order.orderNumber})`,
        message: `Your order was rejected by seller. Reason: ${reason || 'Stock unavailable / Verification failed'}`,
        type: 'ORDER',
        link: '/orders',
      },
    });
  });

  // Send Customer Rejection Email
  setImmediate(async () => {
    try {
      if (order.user?.email) {
        const orderPayload = {
          orderNumber: order.orderNumber,
          orderId: order.id,
          reason: reason || 'Order rejected by seller',
          items: (order.items || []).map(i => ({
            name: i.productName || 'Product Item',
            price: i.price,
            quantity: i.quantity,
          })),
          total: order.totalAmount,
        };
        await emailService.sendOrderCancelledEmail(order.user.email, order.user.fullName || 'Valued Customer', orderPayload);
      }
    } catch (mailErr) {
      console.error('[REJECTION EMAIL ERROR]', mailErr.message);
    }
  });

  res.status(200).json({ success: true, message: 'Order rejected and inventory restored.' });
});

// ==================== GET CANCELLATION ELIGIBILITY (LIVE TIMING) ====================
exports.getCancellationEligibility = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const isServerAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
  const whereClause = isServerAdmin ? { id } : { id, userId: req.user.id };
  const order = await prisma.order.findFirst({ where: whereClause });
  if (!order) return next(new ApiError(404, 'Order not found'));

  const now = new Date();
  let remainingSeconds = 0;
  let isEligible = false;

  if (
    order.cancellationAllowed &&
    !['PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REJECTED', 'RETURNED'].includes(order.orderStatus)
  ) {
    const cStart = order.cancellationStart ? new Date(order.cancellationStart) : null;
    const cEnd = order.cancellationEnd ? new Date(order.cancellationEnd) : null;

    if (cStart && now < cStart) {
      isEligible = false;
    } else if (cEnd && now <= cEnd) {
      isEligible = true;
      remainingSeconds = Math.max(0, Math.floor((cEnd.getTime() - now.getTime()) / 1000));
    } else {
      isEligible = false;
    }
  }

  res.status(200).json({
    success: true,
    data: {
      serverTime: now,
      cancellationAllowed: order.cancellationAllowed,
      cancellationStart: order.cancellationStart,
      cancellationEnd: order.cancellationEnd,
      remainingSeconds,
      isEligible,
      orderStatus: order.orderStatus,
    },
  });
});

// ==================== GET CANCELLATION STATUS ====================
exports.getOrderCancellationStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const isServerAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
  const whereClause = isServerAdmin ? { id } : { id, userId: req.user.id };
  const order = await prisma.order.findFirst({ where: whereClause });
  if (!order) return next(new ApiError(404, 'Order not found'));

  let { cancellationAllowed, cancellationEnd } = order;
  let timeRemainingMs = 0;

  if (cancellationAllowed && cancellationEnd) {
    const now = Date.now();
    const endMs = new Date(cancellationEnd).getTime();
    timeRemainingMs = endMs - now;

    if (timeRemainingMs <= 0) {
      cancellationAllowed = false;
      timeRemainingMs = 0;
      
      await prisma.order.update({
        where: { id },
        data: { cancellationAllowed: false },
      });
    }
  }

  res.status(200).json({
    success: true,
    data: {
      cancellationAllowed,
      cancellationEnd,
      timeRemainingMs,
    },
  });
});

// ==================== ADMIN / CUSTOMER: DELETE ORDER ====================
exports.deleteOrder = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const hardDelete = req.query.hardDelete === 'true';

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true }
  });

  if (!order) {
    return next(new ApiError(404, 'Order not found'));
  }
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return next(new ApiError(403, 'Only admins can delete orders'));
  }

  if (hardDelete) {
    // HARD DELETE: Remove order items first (FK constraint), then the order itself
    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId: id } });
      await tx.order.delete({ where: { id } });
    });

    res.status(200).json({
      success: true,
      message: `Order #${order.orderNumber || id} permanently deleted from database`,
    });
  } else {
    // SOFT DELETE: Mark as deleted by admin
    await prisma.order.update({
      where: { id },
      data: { deletedByAdmin: true }
    });

    res.status(200).json({
      success: true,
      message: `Order #${order.orderNumber || id} hidden from admin panel`,
    });
  }
});

// ==================== ADMIN: GET PENDING ORDERS COUNT FOR SIDEBAR BADGE ====================
exports.adminGetPendingCount = asyncHandler(async (req, res) => {
  const pendingCount = await prisma.order.count({
    where: {
      deletedByAdmin: false,
      orderStatus: { in: ['PENDING_APPROVAL', 'PENDING', 'WHATSAPP_PENDING'] }
    }
  });

  res.status(200).json({
    success: true,
    data: {
      pendingCount,
      hasPending: pendingCount > 0
    }
  });
});

// ==================== ADMIN: CANCEL ORDER WITH APOLOGY & EMAIL NOTIFICATION ====================
exports.adminCancelOrder = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { include: { images: true } } } },
      user: true,
      address: true
    }
  });

  if (!order) {
    return next(new ApiError(404, 'Order not found'));
  }

  if (order.orderStatus === 'CANCELLED') {
    return next(new ApiError(400, 'Order is already cancelled'));
  }

  const apologyReason = reason && reason.trim() ? reason.trim() : 'Cancelled by store administration';

  // 1. Update Order Status
  const updatedOrder = await prisma.order.update({
    where: { id },
    data: {
      orderStatus: 'CANCELLED',
      cancelledBy: 'ADMIN',
      cancelledAt: new Date(),
      cancellationAllowed: false,
      cancellationReason: apologyReason,
    },
    include: {
      items: { include: { product: { include: { images: true } } } },
      user: { select: { id: true, fullName: true, email: true, phone: true, whatsappNumber: true } },
      address: true
    }
  });

  // 2. Restore Product Inventory Stock (only if order was previously DELIVERED)
  if (order.orderStatus === 'DELIVERED') {
    for (const item of order.items) {
      if (item.productId) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        }).catch(() => {});
      }
    }
  }

  // 3. Create In-App Notification for Customer with strict refund guarantee
  await prisma.notification.create({
    data: {
      userId: order.userId,
      title: `❌ Order Cancelled (#${order.orderNumber})`,
      message: `Order #${order.orderNumber} Canceled. Your amount will be returned within 10 minutes strictly. Message: "${apologyReason}"`,
      type: 'ORDER',
      link: '/orders',
    }
  }).catch(() => {});

  // 4. Send Apology Email to Customer
  const orderData = {
    orderNumber: order.orderNumber,
    orderId: order.id,
    items: order.items.map(i => ({
      name: i.product?.name || i.productName || 'Item',
      price: i.price,
      quantity: i.quantity,
      color: i.color,
      size: i.size,
      image: i.product?.images?.[0]?.url || i.productImage,
    })),
    total: order.totalAmount,
    reason: apologyReason,
  };

  setImmediate(async () => {
    try {
      if (order.user?.email) {
        await emailService.sendOrderCancelledEmail(order.user.email, order.user.fullName || 'Valued Customer', orderData);
      }
    } catch (e) {
      console.warn('Failed to send apology email:', e.message);
    }
  });

  res.status(200).json({
    success: true,
    message: `Order #${order.orderNumber} cancelled successfully and apology email/notification dispatched to customer.`,
    data: updatedOrder
  });
});

