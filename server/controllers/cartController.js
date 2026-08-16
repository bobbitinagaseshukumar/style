const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * Format Cart DB record to standardized client cart items structure
 */
const formatCartResponse = (cart) => {
  if (!cart) return { items: [] };
  const formattedItems = (cart.items || [])
    .filter(ci => ci.product) // exclude deleted products
    .map((ci) => {
      const p = ci.product || {};
      const imgUrl = (p.images && p.images.length > 0)
        ? (typeof p.images[0] === 'object' ? p.images[0].url : p.images[0])
        : '';
      const price = p.discountPrice || p.price || 0;

      return {
        id: p.id || ci.productId,
        cartItemId: ci.id,
        name: p.name || 'Product',
        slug: p.slug || '',
        price: parseFloat(price),
        originalPrice: parseFloat(p.price || price),
        image: imgUrl,
        size: ci.size || '',
        color: ci.color || '',
        quantity: ci.quantity || 1,
        stock: p.stock !== undefined ? p.stock : 999,
      };
    });

  return {
    id: cart.id,
    userId: cart.userId,
    items: formattedItems,
    updatedAt: cart.updatedAt,
  };
};

const getFreshCart = async (userId) => {
  return prisma.cart.findUnique({
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

// ==================== 1. GET CART ====================
exports.getCart = asyncHandler(async (req, res, next) => {
  let cart = await getFreshCart(req.user.id);

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: req.user.id }
    });
    cart.items = [];
  }

  res.status(200).json({
    success: true,
    message: 'Cart fetched successfully',
    data: formatCartResponse(cart)
  });
});

// ==================== 2. ADD TO CART ====================
exports.addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity = 1, size = '', color = '' } = req.body;
  const pId = productId || req.body.id;

  if (!pId) return next(new ApiError(400, 'Product ID is required'));

  const product = await prisma.product.findUnique({ where: { id: pId } });
  if (!product) return next(new ApiError(404, 'Product not found'));

  let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: req.user.id } });
  }

  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId: pId,
      size: size || null,
      color: color || null
    }
  });

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + parseInt(quantity || 1, 10) }
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: pId,
        quantity: parseInt(quantity || 1, 10),
        size: size || null,
        color: color || null
      }
    });
  }

  const updatedCart = await getFreshCart(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Item added to cart',
    data: formatCartResponse(updatedCart)
  });
});

// ==================== 3. SYNC CART (MULTI-DEVICE / LOGIN SYNC) ====================
exports.syncCart = asyncHandler(async (req, res, next) => {
  const { items = [] } = req.body;

  let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: req.user.id } });
  }

  if (Array.isArray(items) && items.length > 0) {
    for (const item of items) {
      const pId = item.productId || item.id;
      if (!pId) continue;

      const product = await prisma.product.findUnique({ where: { id: pId } });
      if (!product) continue;

      const size = item.size || null;
      const color = item.color || null;
      const quantity = Math.max(1, parseInt(item.quantity || 1, 10));

      const existing = await prisma.cartItem.findFirst({
        where: { cartId: cart.id, productId: pId, size, color }
      });

      if (existing) {
        // Keep highest quantity
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: Math.max(existing.quantity, quantity) }
        });
      } else {
        await prisma.cartItem.create({
          data: { cartId: cart.id, productId: pId, quantity, size, color }
        });
      }
    }
  }

  const updatedCart = await getFreshCart(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Cart synchronized successfully',
    data: formatCartResponse(updatedCart)
  });
});

// ==================== 4. UPDATE CART ITEM ====================
exports.updateCartItem = asyncHandler(async (req, res, next) => {
  const { itemId, productId, size, color, quantity } = req.body;
  const newQty = parseInt(quantity, 10);

  if (isNaN(newQty) || newQty <= 0) {
    return next(new ApiError(400, 'Valid positive quantity required'));
  }

  let cartItem = null;

  if (itemId) {
    cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId: req.user.id } }
    });
  } else if (productId) {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (cart) {
      cartItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
          size: size || null,
          color: color || null
        }
      });
    }
  }

  if (cartItem) {
    await prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity: newQty }
    });
  }

  const updatedCart = await getFreshCart(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Cart item updated',
    data: formatCartResponse(updatedCart)
  });
});

// ==================== 5. REMOVE CART ITEM ====================
exports.removeCartItem = asyncHandler(async (req, res, next) => {
  const { itemId } = req.params;
  const { productId, size, color } = req.query;

  if (itemId && itemId !== 'by-product') {
    await prisma.cartItem.deleteMany({
      where: { id: itemId, cart: { userId: req.user.id } }
    });
  } else if (productId) {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (cart) {
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          productId,
          size: size ? String(size) : undefined,
          color: color ? String(color) : undefined
        }
      });
    }
  }

  const updatedCart = await getFreshCart(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Item removed from cart',
    data: formatCartResponse(updatedCart)
  });
});

// ==================== 6. CLEAR CART ====================
exports.clearCart = asyncHandler(async (req, res, next) => {
  const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });

  if (cart) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });
  }

  res.status(200).json({
    success: true,
    message: 'Cart cleared',
    data: { items: [] }
  });
});
