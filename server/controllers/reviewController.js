const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// ==================== GET PRODUCT REVIEWS WITH STATS & FILTERS ====================
exports.getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, verifiedOnly, sortBy } = req.query;

  const whereClause = {
    productId,
    isApproved: true,
    isPublished: true,
  };

  if (rating) {
    whereClause.rating = parseInt(rating);
  }
  if (verifiedOnly === 'true') {
    whereClause.isVerified = true;
  }

  let orderBy = { createdAt: 'desc' };
  if (sortBy === 'highest') orderBy = { rating: 'desc' };
  if (sortBy === 'lowest') orderBy = { rating: 'asc' };
  if (sortBy === 'helpful') orderBy = { helpfulVotes: 'desc' };

  const [reviews, allProductReviews] = await Promise.all([
    prisma.review.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, fullName: true, avatar: true } },
      },
      orderBy,
    }),
    prisma.review.findMany({
      where: { productId, isApproved: true, isPublished: true },
      select: { rating: true, isVerified: true },
    }),
  ]);

  const totalReviews = allProductReviews.length;
  const verifiedCount = allProductReviews.filter((r) => r.isVerified).length;
  const avgRating = totalReviews > 0
    ? (allProductReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : 0;

  // Calculate rating distribution
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  allProductReviews.forEach((r) => {
    if (distribution[r.rating] !== undefined) {
      distribution[r.rating]++;
    }
  });

  res.status(200).json({
    success: true,
    data: {
      reviews,
      avgRating: parseFloat(avgRating),
      totalReviews,
      verifiedCount,
      distribution,
    },
  });
});

// ==================== CREATE VERIFIED CUSTOMER REVIEW ====================
exports.createReview = asyncHandler(async (req, res, next) => {
  const { productId, orderId, rating, title, comment, images, videoUrl, recommend, isAnonymous } = req.body;
  const userId = req.user.id;

  if (!productId || !rating || !comment) {
    return next(new ApiError(400, 'Product ID, Rating, and Comment are required.'));
  }

  // 1. Verify product exists
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return next(new ApiError(404, 'Product not found.'));

  // 2. Strict Verified Purchase Check: Customer MUST have a DELIVERED order containing this product
  let deliveredOrder = null;
  if (orderId) {
    deliveredOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        orderStatus: 'DELIVERED',
        items: { some: { productId } },
      },
    });
  } else {
    deliveredOrder = await prisma.order.findFirst({
      where: {
        userId,
        orderStatus: 'DELIVERED',
        items: { some: { productId } },
      },
    });
  }

  if (!deliveredOrder) {
    return next(
      new ApiError(
        400,
        'Only verified customers who have received a DELIVERED order for this product can write a review.'
      )
    );
  }

  // 3. Prevent duplicate reviews for the same delivered order item
  const existingReview = await prisma.review.findFirst({
    where: { userId, productId, orderId: deliveredOrder.id },
  });

  if (existingReview) {
    return next(new ApiError(400, 'You have already submitted a review for this delivered purchase.'));
  }

  // 4. Create Review
  const review = await prisma.review.create({
    data: {
      userId,
      productId,
      orderId: deliveredOrder.id,
      rating: parseInt(rating),
      title: title || 'Verified Experience',
      comment,
      images: images ? JSON.stringify(images) : '[]',
      videoUrl: videoUrl || null,
      recommend: recommend !== undefined ? !!recommend : true,
      isAnonymous: !!isAnonymous,
      isVerified: true,
      isApproved: true, // Auto-approve verified purchase reviews
      isPublished: true,
    },
    include: {
      user: { select: { id: true, fullName: true, avatar: true } },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Thank you! Your verified review has been published.',
    data: review,
  });
});

// ==================== VOTE HELPFUL / UNHELPFUL ====================
exports.voteReview = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { vote } = req.body; // 'helpful' | 'unhelpful'
  const userId = req.user.id;

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return next(new ApiError(404, 'Review not found.'));

  let votedUsers = [];
  try {
    votedUsers = JSON.parse(review.votedUserIds || '[]');
  } catch (e) {
    votedUsers = [];
  }

  if (votedUsers.includes(userId)) {
    return next(new ApiError(400, 'You have already voted on this review.'));
  }

  votedUsers.push(userId);

  const updatedReview = await prisma.review.update({
    where: { id },
    data: {
      helpfulVotes: vote === 'helpful' ? review.helpfulVotes + 1 : review.helpfulVotes,
      unhelpfulVotes: vote === 'unhelpful' ? review.unhelpfulVotes + 1 : review.unhelpfulVotes,
      votedUserIds: JSON.stringify(votedUsers),
    },
  });

  res.status(200).json({
    success: true,
    message: 'Thank you for your feedback!',
    data: updatedReview,
  });
});

// ==================== ADMIN: GET ALL REVIEWS ====================
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

// ==================== ADMIN: TOGGLE APPROVAL / STATUS ====================
exports.updateReviewStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { isApproved, isPublished, isFeatured } = req.body;

  const review = await prisma.review.update({
    where: { id },
    data: {
      isApproved: isApproved !== undefined ? isApproved : undefined,
      isPublished: isPublished !== undefined ? isPublished : undefined,
      isFeatured: isFeatured !== undefined ? isFeatured : undefined,
    },
  });

  res.status(200).json({ success: true, message: 'Review status updated', data: review });
});

// ==================== DELETE REVIEW ====================
exports.deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.review.delete({ where: { id } });
  res.status(200).json({ success: true, message: 'Review deleted' });
});
