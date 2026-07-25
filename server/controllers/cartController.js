const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.getCart = asyncHandler(async (req, res, next) => {
    let cart = await prisma.cart.findUnique({
        where: { userId: req.user.id },
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

    if (!cart) {
        cart = await prisma.cart.create({
            data: { userId: req.user.id }
        });
        cart.items = [];
    }

    res.status(200).json({
        success: true,
        message: 'Cart fetched successfully',
        data: cart
    });
});

exports.addToCart = asyncHandler(async (req, res, next) => {
    const { productId, quantity = 1, size, color } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return next(new ApiError(404, 'Product not found'));
    
    if (product.stock < quantity) return next(new ApiError(400, 'Not enough stock available'));

    let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) {
        cart = await prisma.cart.create({ data: { userId: req.user.id } });
    }

    const priceToUse = product.discountPrice || product.price;

    const existingItem = await prisma.cartItem.findFirst({
        where: { cartId: cart.id, productId, size, color }
    });

    if (existingItem) {
        if (product.stock < existingItem.quantity + quantity) {
            return next(new ApiError(400, 'Not enough stock available for total quantity'));
        }
        await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + quantity }
        });
    } else {
        await prisma.cartItem.create({
            data: {
                cartId: cart.id,
                productId,
                quantity,
                size,
                color
            }
        });
    }

    res.status(200).json({
        success: true,
        message: 'Item added to cart',
        data: null
    });
});

exports.updateCartItem = asyncHandler(async (req, res, next) => {
    const { itemId, quantity } = req.body;

    const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { product: true }
    });

    if (!cartItem) return next(new ApiError(404, 'Cart item not found'));

    if (cartItem.product.stock < quantity) {
        return next(new ApiError(400, 'Not enough stock available'));
    }

    await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity }
    });

    res.status(200).json({
        success: true,
        message: 'Cart item updated',
        data: null
    });
});

exports.removeCartItem = asyncHandler(async (req, res, next) => {
    const { itemId } = req.params;

    await prisma.cartItem.delete({
        where: { id: itemId }
    });

    res.status(200).json({
        success: true,
        message: 'Item removed from cart',
        data: null
    });
});

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
        data: null
    });
});
