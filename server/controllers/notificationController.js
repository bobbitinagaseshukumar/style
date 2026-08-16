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

// Get real admin system notifications (Real orders, stock alerts, user registrations, and stored DB notifications)
exports.getAdminNotifications = asyncHandler(async (req, res) => {
  const notifications = [];

  try {
    // 0. Fetch stored DB notifications specifically created for this admin
    const dbNotifs = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    dbNotifs.forEach((n) => {
      notifications.push({
        id: `db-${n.id}`,
        title: n.title,
        text: n.message,
        time: n.createdAt,
        type: n.type || 'ORDER',
        unread: !n.isRead,
        link: n.link || '/admin/orders'
      });
    });

    // 1. Fetch real recent customer orders (last 10)
    const recentOrders = await prisma.order.findMany({
      where: { deletedByAdmin: false },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        orderStatus: true,
        createdAt: true,
        user: { select: { fullName: true, email: true } }
      }
    });

    recentOrders.forEach((ord) => {
      if (!notifications.some(n => n.id.includes(ord.id))) {
        notifications.push({
          id: `ord-${ord.id}`,
          title: `🛍️ Order #${ord.orderNumber || ord.id.slice(0, 8)}`,
          text: `${ord.user?.fullName || ord.user?.email || 'Customer'} placed order for ₹${(ord.totalAmount || 0).toLocaleString('en-IN')} (${ord.orderStatus})`,
          time: ord.createdAt,
          type: 'ORDER',
          unread: ord.orderStatus === 'PENDING_APPROVAL' || ord.orderStatus === 'PENDING',
          link: '/admin/orders'
        });
      }
    });

    // 2. Fetch real low stock / out-of-stock products
    const lowStockProducts = await prisma.product.findMany({
      where: { stock: { lte: 5 }, isDeleted: false },
      take: 5,
      select: { id: true, name: true, stock: true, updatedAt: true }
    });

    lowStockProducts.forEach((prod) => {
      notifications.push({
        id: `stock-${prod.id}`,
        title: prod.stock === 0 ? '⚠️ Out of Stock Alert' : '📦 Low Stock Alert',
        text: `"${prod.name}" has ${prod.stock} units remaining`,
        time: prod.updatedAt,
        type: 'STOCK',
        unread: true,
        link: '/admin/inventory'
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
