const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// ==================== TRACK CUSTOMER BEHAVIOR ====================
exports.trackCustomerBehavior = asyncHandler(async (req, res) => {
  const { action, productId, categoryId, searchQuery, size, color, device } = req.body;
  const userId = req.user?.id || null;

  if (!action) {
    return res.status(400).json({ success: false, message: 'Action type is required' });
  }

  // 1. Log Behavior Record
  await prisma.customerBehaviorLog.create({
    data: {
      userId,
      action,
      productId: productId || null,
      categoryId: categoryId || null,
      searchQuery: searchQuery || null,
      size: size || null,
      color: color || null,
      device: device || 'DESKTOP',
    },
  });

  // 2. Increment Recommendation Score for logged-in user
  if (userId && productId) {
    const WEIGHTS = {
      VIEW_PRODUCT: 1.0,
      CLICK_PRODUCT: 1.5,
      ADD_WISHLIST: 3.0,
      ADD_CART: 5.0,
      PURCHASE: 10.0,
    };

    const addedScore = WEIGHTS[action] || 1.0;

    const existingScore = await prisma.productRecommendationScore.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existingScore) {
      await prisma.productRecommendationScore.update({
        where: { id: existingScore.id },
        data: { score: existingScore.score + addedScore },
      });
    } else {
      await prisma.productRecommendationScore.create({
        data: { userId, productId, score: addedScore },
      });
    }
  }

  res.status(200).json({ success: true, message: 'Behavior tracked successfully' });
});

// ==================== GET PERSONALIZED RECOMMENDATIONS ====================
exports.getPersonalizedRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;

  let continueShopping = [];
  let inspiredByBrowsing = [];
  let recommendedForYou = [];
  let frequentlyBoughtTogether = [];
  let becauseYouPurchased = [];

  const publishedFilter = {
    status: { notIn: ['DELETED', 'ARCHIVED', 'DRAFT', 'deleted', 'archived', 'draft'] },
    isVisible: true,
  };

  const allProducts = await prisma.product.findMany({
    where: { ...publishedFilter, stock: { gt: 0 } },
    include: { images: true, category: true },
    take: 20,
    orderBy: { createdAt: 'desc' },
  });

  if (userId) {
    // 1. High Score Recommendations for logged-in user
    const userScores = await prisma.productRecommendationScore.findMany({
      where: { userId },
      orderBy: { score: 'desc' },
      take: 10,
    });

    const scoredProductIds = userScores.map((s) => s.productId);

    if (scoredProductIds.length > 0) {
      recommendedForYou = await prisma.product.findMany({
        where: { id: { in: scoredProductIds }, ...publishedFilter },
        include: { images: true, category: true },
        take: 8,
      });

      continueShopping = recommendedForYou.slice(0, 4);
    }

    // 2. Category affinity from behavior logs
    const recentLogs = await prisma.customerBehaviorLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    const categoryIds = recentLogs.map((l) => l.categoryId).filter(Boolean);

    if (categoryIds.length > 0) {
      inspiredByBrowsing = await prisma.product.findMany({
        where: { categoryId: { in: categoryIds }, ...publishedFilter },
        include: { images: true, category: true },
        take: 8,
      });
    }
  }

  // Fallbacks if user has no history yet
  if (recommendedForYou.length === 0) recommendedForYou = allProducts.slice(0, 8);
  if (continueShopping.length === 0) continueShopping = allProducts.slice(0, 4);
  if (inspiredByBrowsing.length === 0) inspiredByBrowsing = allProducts.slice(4, 12);
  frequentlyBoughtTogether = allProducts.slice(2, 10);
  becauseYouPurchased = allProducts.slice(6, 14);

  res.status(200).json({
    success: true,
    data: {
      continueShopping,
      inspiredByBrowsing,
      recommendedForYou,
      frequentlyBoughtTogether,
      becauseYouPurchased,
    },
  });
});

// ==================== ADMIN RECOMMENDATION ANALYTICS ====================
exports.getAdminRecommendationAnalytics = asyncHandler(async (req, res) => {
  const [totalLogs, topViews, topCarts, topWishlists] = await Promise.all([
    prisma.customerBehaviorLog.count(),
    prisma.customerBehaviorLog.groupBy({
      by: ['productId'],
      where: { action: 'VIEW_PRODUCT', productId: { not: null } },
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: 5,
    }),
    prisma.customerBehaviorLog.groupBy({
      by: ['productId'],
      where: { action: 'ADD_CART', productId: { not: null } },
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: 5,
    }),
    prisma.customerBehaviorLog.groupBy({
      by: ['productId'],
      where: { action: 'ADD_WISHLIST', productId: { not: null } },
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: 5,
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalLogs,
      topViews,
      topCarts,
      topWishlists,
    },
  });
});
