const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.getWishlist = asyncHandler(async (req, res, next) => {
    let wishlist = await prisma.wishlist.findUnique({
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

    if (!wishlist) {
        wishlist = await prisma.wishlist.create({
            data: { userId: req.user.id }
        });
        wishlist.items = [];
    }

    res.status(200).json({
        success: true,
        message: 'Wishlist fetched successfully',
        data: wishlist
    });
});

exports.addToWishlist = asyncHandler(async (req, res, next) => {
    const { productId } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return next(new ApiError(404, 'Product not found'));

    let wishlist = await prisma.wishlist.findUnique({ where: { userId: req.user.id } });
    if (!wishlist) {
        wishlist = await prisma.wishlist.create({ data: { userId: req.user.id } });
    }

    const existingItem = await prisma.wishlistItem.findFirst({
        where: { wishlistId: wishlist.id, productId }
    });

    if (!existingItem) {
        await prisma.wishlistItem.create({
            data: { wishlistId: wishlist.id, productId }
        });
    }

    res.status(200).json({
        success: true,
        message: 'Item added to wishlist',
        data: null
    });
});

exports.removeFromWishlist = asyncHandler(async (req, res, next) => {
    const { itemId } = req.params;

    await prisma.wishlistItem.delete({
        where: { id: itemId }
    });

    res.status(200).json({
        success: true,
        message: 'Item removed from wishlist',
        data: null
    });
});
