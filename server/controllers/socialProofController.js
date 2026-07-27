const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// ==================== GET SOCIAL PROOF SETTINGS ====================
exports.getSocialProofSettings = asyncHandler(async (req, res) => {
  let settings = await prisma.socialProofSetting.findUnique({ where: { id: 'default' } });
  if (!settings) {
    settings = await prisma.socialProofSetting.create({
      data: {
        id: 'default',
        isEnabled: false, // Disabled by default as requested!
        position: 'bottom-left',
        displayTimeMs: 5000,
        intervalTimeMs: 15000,
        onlyRealOrders: true
      }
    });
  }

  res.status(200).json({ success: true, data: settings });
});

// ==================== UPDATE SOCIAL PROOF SETTINGS (ADMIN) ====================
exports.updateSocialProofSettings = asyncHandler(async (req, res) => {
  const { isEnabled, position, displayTimeMs, intervalTimeMs, onlyRealOrders } = req.body;

  const settings = await prisma.socialProofSetting.upsert({
    where: { id: 'default' },
    update: {
      ...(isEnabled !== undefined && { isEnabled }),
      ...(position && { position }),
      ...(displayTimeMs && { displayTimeMs: parseInt(displayTimeMs) }),
      ...(intervalTimeMs && { intervalTimeMs: parseInt(intervalTimeMs) }),
      ...(onlyRealOrders !== undefined && { onlyRealOrders })
    },
    create: {
      id: 'default',
      isEnabled: isEnabled ?? false,
      position: position || 'bottom-left',
      displayTimeMs: displayTimeMs || 5000,
      intervalTimeMs: intervalTimeMs || 15000,
      onlyRealOrders: onlyRealOrders ?? true
    }
  });

  res.status(200).json({ success: true, message: 'Social proof settings updated', data: settings });
});

// ==================== GET REAL RECENT DELIVERED ORDERS ====================
exports.getRealDeliveredOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: {
      orderStatus: { in: ['DELIVERED', 'SHIPPED', 'PROCESSING'] }
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      user: { select: { fullName: true, city: true, state: true } },
      items: { include: { product: { include: { images: true } } }, take: 1 }
    }
  });

  const formatted = orders.map(order => {
    const firstItem = order.items[0];
    const user = order.user;
    const name = user?.fullName ? `${user.fullName.split(' ')[0]} ${user.fullName.split(' ')[1]?.[0] || ''}.` : 'Verified Customer';
    const city = user?.city || 'India';
    const productName = firstItem?.product?.name || 'Luxury Fashion Item';
    const image = firstItem?.product?.images?.[0]?.url || firstItem?.product?.images?.[0] || 'https://via.placeholder.com/150';

    return {
      id: order.id,
      name,
      city,
      productName,
      image,
      createdAt: order.createdAt
    };
  });

  res.status(200).json({ success: true, data: formatted });
});
