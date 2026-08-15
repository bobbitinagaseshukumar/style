const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// ==================== ADD / RECORD RECENTLY VIEWED PRODUCT ====================
exports.addRecentlyViewed = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;
  const userId = req.user?.id;

  if (!productId) {
    return next(new ApiError(400, 'Product ID is required'));
  }

  // Verify product exists
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return next(new ApiError(404, 'Product not found'));
  }

  if (!userId) {
    // Unauthenticated user preview response
    return res.status(200).json({ success: true, message: 'View recorded locally' });
  }

  // Upsert RecentlyViewed record
  const existing = await prisma.recentlyViewed.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    await prisma.recentlyViewed.update({
      where: { id: existing.id },
      data: {
        viewCount: existing.viewCount + 1,
        updatedAt: new Date(),
      },
    });
  } else {
    await prisma.recentlyViewed.create({
      data: {
        userId,
        productId,
        viewCount: 1,
      },
    });
  }

  // Enforce Max 100 Limit Per User
  const userViewsCount = await prisma.recentlyViewed.count({ where: { userId } });
  if (userViewsCount > 100) {
    const oldest = await prisma.recentlyViewed.findMany({
      where: { userId },
      orderBy: { updatedAt: 'asc' },
      take: userViewsCount - 100,
    });
    const oldestIds = oldest.map((o) => o.id);
    await prisma.recentlyViewed.deleteMany({
      where: { id: { in: oldestIds } },
    });
  }

  res.status(200).json({ success: true, message: 'Recently viewed updated' });
});

// ==================== GET CUSTOMER RECENTLY VIEWED PRODUCTS ====================
exports.getRecentlyViewed = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(200).json({ success: true, data: [] });
  }

  const items = await prisma.recentlyViewed.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 30,
    include: {
      product: {
        include: {
          images: true,
          category: true,
          brand: true,
        },
      },
    },
  });

  // Filter out deleted/null/hidden products and only show strictly published ones
  const formattedProducts = items
    .filter((item) => item.product && item.product.status === 'PUBLISHED' && item.product.isVisible !== false)
    .map((item) => ({
      ...item.product,
      viewedAt: item.updatedAt,
      viewCount: item.viewCount,
    }));

  res.status(200).json({ success: true, data: formattedProducts });
});

// ==================== DELETE ONE RECENTLY VIEWED PRODUCT ====================
exports.deleteOneRecentlyViewed = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const userId = req.user.id;

  await prisma.recentlyViewed.deleteMany({
    where: { userId, productId },
  });

  res.status(200).json({ success: true, message: 'Item removed from recently viewed history' });
});

// ==================== CLEAR ALL RECENTLY VIEWED ====================
exports.clearRecentlyViewed = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await prisma.recentlyViewed.deleteMany({
    where: { userId },
  });

  res.status(200).json({ success: true, message: 'Recently viewed history cleared' });
});

// ==================== ADMIN: MOST VIEWED ANALYTICS ====================
exports.getMostViewedAnalytics = asyncHandler(async (req, res) => {
  const mostViewed = await prisma.recentlyViewed.groupBy({
    by: ['productId'],
    _sum: { viewCount: true },
    _count: { userId: true },
    orderBy: { _sum: { viewCount: 'desc' } },
    take: 20,
  });

  const productIds = mostViewed.map((m) => m.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { images: true, category: true, brand: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  const result = mostViewed.map((item) => ({
    product: productMap.get(item.productId),
    totalViews: item._sum.viewCount || 0,
    uniqueViewers: item._count.userId || 0,
  }));

  res.status(200).json({ success: true, data: result });
});
