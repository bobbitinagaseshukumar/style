const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// Get user's notifications
exports.getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  res.status(200).json({
    success: true,
    data: { notifications, unreadCount },
  });
});

// Mark single notification read
exports.markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  res.status(200).json({ success: true, message: 'Notification marked as read' });
});

// Mark all as read
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });

  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});

// Delete single notification
exports.deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.notification.deleteMany({
    where: { id, userId: req.user.id },
  });

  res.status(200).json({ success: true, message: 'Notification deleted' });
});

// Clear all notifications for user
exports.clearAllNotifications = asyncHandler(async (req, res) => {
  await prisma.notification.deleteMany({
    where: { userId: req.user.id },
  });

  res.status(200).json({ success: true, message: 'All notifications cleared successfully' });
});

// Admin Broadcast notification to all active customers
exports.broadcastNotification = asyncHandler(async (req, res, next) => {
  const { title, message, link, type } = req.body;
  if (!title || !message) {
    return next(new ApiError(400, 'Title and Message are required for broadcast'));
  }

  const users = await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      role: { notIn: ['ADMIN', 'SUPER_ADMIN'] },
      promoNotifications: true
    },
    select: { id: true }
  });

  const notificationsData = users.map(u => ({
    userId: u.id,
    title,
    message,
    link: link || null,
    type: type || 'PROMOTIONAL',
  }));

  await prisma.notification.createMany({ data: notificationsData });

  res.status(201).json({
    success: true,
    message: `Broadcast sent successfully to ${users.length} registered customers!`,
  });
});

// Get real admin system notifications (Real orders, stock alerts, user registrations)
exports.getAdminNotifications = asyncHandler(async (req, res) => {
  const notifications = [];

  try {
    // 1. Fetch real recent customer orders (last 10)
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        user: { select: { fullName: true } }
      }
    });

    recentOrders.forEach((ord) => {
      notifications.push({
        id: `ord-${ord.id}`,
        title: `Order #${ord.orderNumber || ord.id.slice(0, 8)}`,
        text: `${ord.user?.fullName || 'Customer'} placed order for ₹${ord.totalAmount} (${ord.status})`,
        time: ord.createdAt,
        type: 'ORDER',
        unread: ord.status === 'PENDING' || ord.status === 'PROCESSING',
        link: '/admin/orders'
      });
    });

    // 2. Fetch real low stock / out-of-stock products
    const lowStockProducts = await prisma.product.findMany({
      where: { stock: { lte: 5 } },
      take: 5,
      select: { id: true, title: true, stock: true, updatedAt: true }
    });

    lowStockProducts.forEach((prod) => {
      notifications.push({
        id: `stock-${prod.id}`,
        title: prod.stock === 0 ? 'Out of Stock Alert' : 'Low Stock Alert',
        text: `"${prod.title}" has ${prod.stock} units remaining`,
        time: prod.updatedAt,
        type: 'STOCK',
        unread: true,
        link: '/admin/inventory'
      });
    });

    // 3. Fetch recent customer registrations (last 5)
    const recentCustomers = await prisma.user.findMany({
      where: { role: { notIn: ['ADMIN', 'SUPER_ADMIN'] } },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, fullName: true, email: true, authProvider: true, createdAt: true }
    });

    recentCustomers.forEach((cust) => {
      notifications.push({
        id: `cust-${cust.id}`,
        title: 'New Customer Registered',
        text: `${cust.fullName || cust.email} joined via ${cust.authProvider || 'Email'}`,
        time: cust.createdAt,
        type: 'CUSTOMER',
        unread: false,
        link: '/admin/customers'
      });
    });

    // Sort all by timestamp descending
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

  } catch (err) {
    console.error('[ADMIN NOTIFICATIONS ERR]', err.message);
  }

  const unreadCount = notifications.filter(n => n.unread).length;

  res.status(200).json({
    success: true,
    data: { notifications, unreadCount }
  });
});
