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
    discountAmount, shippingFee, notes, whatsappNumber
  } = req.body;

  // 1. Restriction Check: Blocked customers can view products but cannot place orders
  const customer = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { status: true, canPlaceOrders: true, canCheckout: true }
  });

  if (customer?.status === 'BLOCKED' || customer?.canPlaceOrders === false || customer?.canCheckout === false) {
    return next(new ApiError(403, 'Your account is currently restricted from placing orders by store administration. You may browse and view products, but checkout is disabled. Please contact customer support.'));
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
    const product = await prisma.product.findUnique({ where: { id: item.productId || item.id } });
    if (!product) return next(new ApiError(404, `Product '${item.name}' not found`));
    if (product.stock < item.quantity) {
      return next(new ApiError(400, `Insufficient stock for '${product.name}'. Available: ${product.stock}`));
    }
    const itemPrice = product.discountPrice || product.price;
    subtotal += itemPrice * item.quantity;
    orderItemsData.push({
      productId: product.id,
      price: itemPrice,
      quantity: item.quantity,
      size: item.size || null,
      color: item.color || null,
    });
  }

  const calcDiscount = discountAmount ? parseFloat(discountAmount) : 0;
  const calcShipping = shippingFee !== undefined ? parseFloat(shippingFee) : (subtotal > 999 ? 0 : 99);
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
        paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
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

    // Deduct stock
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId || item.id },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // Customer notification
    await tx.notification.create({
      data: {
        userId: req.user.id,
        title: `Order Placed! (#${orderNumber})`,
        message: `Your order for ₹${totalAmount.toLocaleString('en-IN')} is being processed.`,
        type: 'ORDER',
        link: '/orders',
      },
    });

    // Admin notification
    const admins = await tx.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    for (const admin of admins) {
      await tx.notification.create({
        data: {
          userId: admin.id,
          title: `🛍️ New Order #${orderNumber}`,
          message: `${created.user.fullName} placed an order for ₹${totalAmount.toLocaleString('en-IN')}`,
          type: 'ADMIN_ORDER',
          link: '/admin/orders',
        },
      });
    }

    return created;
  });

  // Send confirmation email (async, non-blocking)
  setImmediate(() => {
    emailService.sendOrderPlacedEmail(order.user.email, order.user.fullName, {
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
      discount: order.discountAmount,
      shippingCharge: order.shippingFee,
      total: order.totalAmount,
      address: order.address
        ? `${order.address.street}, ${order.address.city}, ${order.address.state} - ${order.address.postalCode}`
        : '',
      estimatedDelivery: '3-5 Business Days',
    });
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
    const product = await prisma.product.findUnique({ where: { id: item.productId || item.id } });
    if (!product) return next(new ApiError(404, `Product '${item.name}' not found`));
    const itemPrice = product.discountPrice || product.price;
    subtotal += itemPrice * item.quantity;
    orderItemsData.push({
      productId: product.id,
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

    // Notify admins
    const admins = await tx.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    for (const admin of admins) {
      await tx.notification.create({
        data: {
          userId: admin.id,
          title: `📱 New WhatsApp Order #${orderNumber}`,
          message: `${created.user.fullName} is placing a WhatsApp order for ₹${totalAmount.toLocaleString('en-IN')}`,
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

    // Restore Inventory Stock
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
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

    // Notify all admins about the cancellation
    const admins = await tx.user.findMany({
      where: { role: 'ADMIN' },
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

  const where = {};
  if (status && status !== 'ALL') where.orderStatus = status;
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { user: { fullName: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [orders, total] = await Promise.all([
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
  ]);

  res.status(200).json({
    success: true,
    data: orders || [],
    meta: { total: total || 0, page: parseInt(page), limit: parseInt(limit) },
  });
});

// ==================== ADMIN: UPDATE ORDER STATUS ====================
exports.adminUpdateOrderStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const {
    orderStatus, courierName, trackingNumber, trackingUrl,
    cancelReason, expectedDeliveryDate, deliveryTimeSlot, internalNotes,
    cancellationAllowed, cancellationDuration
  } = req.body;

  const updateData = {};
  if (orderStatus) updateData.orderStatus = orderStatus;
  if (courierName !== undefined) updateData.courierName = courierName;
  if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
  if (trackingUrl !== undefined) updateData.trackingUrl = trackingUrl;
  if (cancelReason !== undefined) updateData.cancelReason = cancelReason;
  if (expectedDeliveryDate !== undefined) updateData.expectedDeliveryDate = expectedDeliveryDate;
  if (deliveryTimeSlot !== undefined) updateData.deliveryTimeSlot = deliveryTimeSlot;
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
        emailService.sendOrderPlacedEmail(order.user.email, order.user.fullName, orderData);
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
    deliveryDate, deliveryTime, deliveryNotes,
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

  // Notify Customer
  await prisma.notification.create({
    data: {
      userId: order.userId,
      title: `Order Approved (#${order.orderNumber})`,
      message: `Your order has been approved! Expected Delivery: ${deliveryDate || '3-5 Business Days'}.${
        cancellationAllowed ? ' Cancellation window is open.' : ''
      }`,
      type: 'ORDER',
      link: '/orders',
    },
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
    include: { items: true },
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

    // Restore Stock
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    // Customer Notification
    await tx.notification.create({
      data: {
        userId: order.userId,
        title: `Order Rejected (#${order.orderNumber})`,
        message: `Your order was rejected by Admin. Reason: ${reason || 'Stock unavailable'}`,
        type: 'ORDER',
        link: '/orders',
      },
    });
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

// ==================== ADMIN: DELETE ORDER ====================
exports.deleteOrder = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { hardDelete } = req.query;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true }
  });

  if (!order) {
    return next(new ApiError(404, 'Order not found'));
  }

  if (hardDelete === 'true') {
    // Hard delete: remove order items and order record inside a transaction
    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId: id } });
      try {
        await tx.notification.deleteMany({ where: { link: { contains: id } } });
      } catch {
        // Notification cleanup optional
      }
      await tx.order.delete({ where: { id } });
    });

    res.status(200).json({
      success: true,
      message: `Order #${order.orderNumber || id} permanently deleted from database`,
    });
  } else {
    // Soft delete / cancel order
    await prisma.order.update({
      where: { id },
      data: {
        orderStatus: 'CANCELLED',
        cancellationAllowed: false,
        cancelledAt: new Date(),
        cancellationReason: 'Cancelled & Soft Removed by Admin',
      },
    });

    res.status(200).json({
      success: true,
      message: `Order #${order.orderNumber || id} cancelled and soft removed`,
    });
  }
});
