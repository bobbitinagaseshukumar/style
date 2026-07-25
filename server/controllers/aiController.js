const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// ==================== AUTO-SUGGEST & SEARCH ANALYTICS ====================
exports.getSearchSuggestions = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length === 0) {
    return res.status(200).json({ success: true, data: { suggestions: [], products: [] } });
  }

  const query = q.trim();

  // Log search query
  try {
    await prisma.searchLog.create({
      data: { query: query.toLowerCase(), userId: req.user?.id || null },
    });
  } catch (err) {
    console.error('Search log error:', err);
  }

  // Fetch matching products
  const products = await prisma.product.findMany({
    where: {
      isVisible: true,
      OR: [
        { name: { contains: query } },
        { description: { contains: query } },
        { tags: { contains: query } },
      ],
    },
    select: { id: true, name: true, slug: true, price: true, discountPrice: true, images: true, category: { select: { name: true } } },
    take: 5,
  });

  // Fetch matching categories
  const categories = await prisma.category.findMany({
    where: { isVisible: true, name: { contains: query } },
    select: { name: true, slug: true },
    take: 3,
  });

  res.status(200).json({
    success: true,
    data: {
      query,
      suggestions: categories.map(c => c.name),
      products,
    },
  });
});

// ==================== RECOMMENDATION ENGINE ====================
exports.getRecommendations = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;

  const currentProduct = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: true },
  });

  if (!currentProduct) {
    return next(new ApiError(404, 'Product not found'));
  }

  // 1. Frequently Bought Together (Same subcategory or related category items)
  const frequentlyBought = await prisma.product.findMany({
    where: {
      isVisible: true,
      id: { not: productId },
      categoryId: currentProduct.categoryId,
    },
    include: { images: true },
    take: 2,
  });

  // 2. Similar Products (Same category, sorted by rating/popularity)
  const similarProducts = await prisma.product.findMany({
    where: {
      isVisible: true,
      id: { not: productId },
      categoryId: currentProduct.categoryId,
    },
    include: { images: true, category: true },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  res.status(200).json({
    success: true,
    data: {
      currentProduct: { id: currentProduct.id, name: currentProduct.name, price: currentProduct.discountPrice || currentProduct.price },
      frequentlyBoughtTogether: frequentlyBought,
      similarProducts,
    },
  });
});

// ==================== BACK IN STOCK SUBSCRIPTION ====================
exports.subscribeBackInStock = asyncHandler(async (req, res, next) => {
  const { productId, email } = req.body;

  if (!productId || !email) {
    return next(new ApiError(400, 'Product ID and Email are required'));
  }

  const existing = await prisma.backInStockSubscription.findFirst({
    where: { productId, email: email.toLowerCase() },
  });

  if (existing) {
    return res.status(200).json({
      success: true,
      message: 'You are already subscribed for stock alerts on this item!',
    });
  }

  const sub = await prisma.backInStockSubscription.create({
    data: { productId, email: email.toLowerCase() },
  });

  res.status(201).json({
    success: true,
    message: 'Stock alert set! We will email you as soon as this item is restocked.',
    data: sub,
  });
});

// ==================== SEARCH ANALYTICS (ADMIN) ====================
exports.getSearchAnalytics = asyncHandler(async (req, res) => {
  const topSearches = await prisma.searchLog.groupBy({
    by: ['query'],
    _count: { query: true },
    orderBy: { _count: { query: 'desc' } },
    take: 10,
  });

  res.status(200).json({
    success: true,
    data: topSearches.map(s => ({ query: s.query, count: s._count.query })),
  });
});
