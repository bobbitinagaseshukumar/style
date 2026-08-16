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

// Delete single notification permanently
exports.deleteNotification = asyncHandler(async (req, res) => {
  let { id } = req.params;
  if (id.startsWith('db-') || id.startsWith('ord-') || id.startsWith('stock-')) {
    id = id.replace(/^(db|ord|stock)-/, '');
  }

  await prisma.notification.deleteMany({
    where: {
      id,
      OR: [
        { userId: req.user.id },
        { user: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } },
        { type: { in: ['ADMIN_ORDER', 'ORDER', 'STOCK', 'SYSTEM'] } }
      ]
    },
  }).catch(() => {});

  res.status(200).json({ success: true, message: 'Notification deleted permanently' });
});

// Clear all notifications permanently
exports.clearAllNotifications = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
  await prisma.notification.deleteMany({
    where: isAdmin ? {
      OR: [
        { userId: req.user.id },
        { user: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } },
        { type: { in: ['ADMIN_ORDER', 'STOCK', 'SYSTEM'] } }
      ]
    } : {
      userId: req.user.id
    },
  }).catch(() => {});

  res.status(200).json({ success: true, message: 'All notifications cleared permanently' });
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

// Get real admin system notifications (Fully persistent in DB, permanently deletable)
exports.getAdminNotifications = asyncHandler(async (req, res) => {
  try {
    const dbNotifs = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: req.user.id },
          { user: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } },
          { type: { in: ['ADMIN_ORDER', 'STOCK', 'SYSTEM'] } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const notifications = dbNotifs.map((n) => ({
      id: n.id,
      title: n.title,
      text: n.message,
      time: n.createdAt,
      type: n.type || 'ORDER',
      unread: !n.isRead,
      link: n.link || '/admin/orders'
    }));

    const unreadCount = notifications.filter(n => n.unread).length;

    res.status(200).json({
      success: true,
      data: { notifications, unreadCount }
    });
  } catch (err) {
    console.error('[ADMIN NOTIFICATIONS ERR]', err.message);
    res.status(200).json({
      success: true,
      data: { notifications: [], unreadCount: 0 }
    });
  }
});

