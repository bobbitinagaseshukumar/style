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
        orderStatus: 'PENDING',
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
  const order = await prisma.order.findFirst({
    where: { id: req.params.id },
    include: {
      items: { include: { product: { include: { images: true } } } },
      address: true,
      user: { select: { fullName: true, email: true, phone: true, whatsappNumber: true } },
    },
  });
  if (!order) return next(new ApiError(404, 'Order not found'));
  res.status(200).json({ success: true, data: order });
});

// ==================== CANCEL ORDER ====================
exports.cancelOrder = asyncHandler(async (req, res, next) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: { items: true },
  });
  if (!order) return next(new ApiError(404, 'Order not found'));
  if (['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.orderStatus)) {
    return next(new ApiError(400, `Cannot cancel order in status '${order.orderStatus}'`));
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { orderStatus: 'CANCELLED' } });
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
    await tx.notification.create({
      data: {
        userId: req.user.id,
        title: `Order Cancelled (#${order.orderNumber})`,
        message: 'Your order has been cancelled and stock restored.',
        type: 'ORDER',
        link: '/orders',
      },
    });
  });

  res.status(200).json({ success: true, message: 'Order cancelled successfully.' });
});

// ==================== ADMIN: GET ALL ORDERS ====================
exports.adminGetAllOrders = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (status) where.orderStatus = status;
  if (search) {
    where.OR = [
      { orderNumber: { contains: search } },
      { user: { fullName: { contains: search } } },
      { user: { email: { contains: search } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: { include: { product: { include: { images: true } } } },
        address: true,
        user: { select: { fullName: true, email: true, phone: true, whatsappNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.order.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: orders,
    meta: { total, page: parseInt(page), limit: parseInt(limit) },
  });
});

// ==================== ADMIN: UPDATE ORDER STATUS ====================
exports.adminUpdateOrderStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { orderStatus, courierName, trackingNumber, trackingUrl, cancelReason } = req.body;

  const updateData = { orderStatus };
  if (courierName) updateData.courierName = courierName;
  if (trackingNumber) updateData.trackingNumber = trackingNumber;
  if (trackingUrl) updateData.trackingUrl = trackingUrl;
  if (cancelReason) updateData.cancelReason = cancelReason;
  if (orderStatus === 'DELIVERED') updateData.deliveredAt = new Date();

  const order = await prisma.order.update({
    where: { id },
    data: updateData,
    include: {
      items: { include: { product: { include: { images: true } } } },
      address: true,
      user: { select: { fullName: true, email: true, phone: true, whatsappNumber: true } },
    },
  });

  // In-app notification to customer
  await prisma.notification.create({
    data: {
      userId: order.userId,
      title: `Order Update: ${orderStatus.replace(/_/g, ' ')} — #${order.orderNumber}`,
      message: `Your order #${order.orderNumber} status is now: ${orderStatus.replace(/_/g, ' ')}`,
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
