const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// Get approved reviews for a product
exports.getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const reviews = await prisma.review.findMany({
    where: { productId, isApproved: true },
    include: {
      user: { select: { id: true, fullName: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate average rating
  const total = reviews.length;
  const avgRating = total > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1)
    : 0;

  res.status(200).json({
    success: true,
    data: {
      reviews,
      avgRating: parseFloat(avgRating),
      totalReviews: total,
    },
  });
});

// Add review (Authenticated user)
exports.createReview = asyncHandler(async (req, res, next) => {
  const { productId, rating, title, comment } = req.body;

  if (!productId || !rating || !comment) {
    return next(new ApiError(400, 'Product ID, Rating, and Comment are required'));
  }

  // Check if product exists
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return next(new ApiError(404, 'Product not found'));

  const review = await prisma.review.create({
    data: {
      userId: req.user.id,
      productId,
      rating: parseInt(rating),
      title: title || '',
      comment,
      isApproved: true, // Auto-approve for seamless testing
    },
    include: {
      user: { select: { id: true, fullName: true, avatar: true } },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Thank you! Your review has been submitted.',
    data: review,
  });
});

// Admin get all reviews
exports.getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await prisma.review.findMany({
    include: {
      user: { select: { fullName: true, email: true } },
      product: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json({ success: true, data: reviews });
});

// Admin toggle approval or delete
exports.deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.review.delete({ where: { id } });
  res.status(200).json({ success: true, message: 'Review deleted' });
});
