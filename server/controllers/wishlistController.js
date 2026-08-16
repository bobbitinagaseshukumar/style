const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const formatWishlistResponse = (wishlist) => {
  if (!wishlist) return { items: [] };
  const formattedItems = (wishlist.items || [])
    .filter(wi => wi.product)
    .map((wi) => {
      const p = wi.product || {};
      const imgUrl = (p.images && p.images.length > 0)
        ? (typeof p.images[0] === 'object' ? p.images[0].url : p.images[0])
        : '';
      const price = p.discountPrice || p.price || 0;

      return {
        id: p.id,
        wishlistItemId: wi.id,
        name: p.name || 'Product',
        slug: p.slug || '',
        price: parseFloat(price),
        originalPrice: parseFloat(p.price || price),
        image: imgUrl,
      };
    });

  return {
    id: wishlist.id,
    userId: wishlist.userId,
    items: formattedItems,
  };
};

const getFreshWishlist = async (userId) => {
  return prisma.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, slug: true, price: true, discountPrice: true, stock: true, images: { take: 1 } }
          }
        }
      }
    }
  });
};

exports.getWishlist = asyncHandler(async (req, res, next) => {
  let wishlist = await getFreshWishlist(req.user.id);

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { userId: req.user.id }
    });
    wishlist.items = [];
  }

  res.status(200).json({
    success: true,
    message: 'Wishlist fetched successfully',
    data: formatWishlistResponse(wishlist)
  });
});

exports.addToWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;
  const pId = productId || req.body.id;

  if (!pId) return next(new ApiError(400, 'Product ID is required'));

  const product = await prisma.product.findUnique({ where: { id: pId } });
  if (!product) return next(new ApiError(404, 'Product not found'));

  let wishlist = await prisma.wishlist.findUnique({ where: { userId: req.user.id } });
  if (!wishlist) {
    wishlist = await prisma.wishlist.create({ data: { userId: req.user.id } });
  }

  const existingItem = await prisma.wishlistItem.findFirst({
    where: { wishlistId: wishlist.id, productId: pId }
  });

  if (!existingItem) {
    await prisma.wishlistItem.create({
      data: { wishlistId: wishlist.id, productId: pId }
    });
  }

  const updated = await getFreshWishlist(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Item added to wishlist',
    data: formatWishlistResponse(updated)
  });
});

exports.removeFromWishlist = asyncHandler(async (req, res, next) => {
  const { itemId } = req.params;
  const { productId } = req.query;

  const wishlist = await prisma.wishlist.findUnique({ where: { userId: req.user.id } });
  if (wishlist) {
    if (itemId && itemId !== 'by-product') {
      await prisma.wishlistItem.deleteMany({
        where: {
          OR: [
            { id: itemId, wishlistId: wishlist.id },
            { productId: itemId, wishlistId: wishlist.id }
          ]
        }
      });
    } else if (productId) {
      await prisma.wishlistItem.deleteMany({
        where: { productId, wishlistId: wishlist.id }
      });
    }
  }

  const updated = await getFreshWishlist(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Item removed from wishlist',
    data: formatWishlistResponse(updated)
  });
});
