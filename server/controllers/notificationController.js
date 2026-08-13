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
