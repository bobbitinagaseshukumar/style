const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const slugify = require('slugify');

exports.getAllProducts = asyncHandler(async (req, res, next) => {
    const { search, category, featured, trending, newArrival, bestSeller, sort, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let whereClause = { isVisible: true };

    if (search) {
        whereClause.OR = [
            { name: { contains: search } },
            { description: { contains: search } }
        ];
    }

    if (category) {
        whereClause.categoryId = category;
    }

    if (featured === 'true') whereClause.featured = true;
    if (trending === 'true') whereClause.trending = true;
    if (newArrival === 'true') whereClause.newArrival = true;
    if (bestSeller === 'true') whereClause.bestSeller = true;

    let orderByClause = { createdAt: 'desc' };
    if (sort === 'price_asc') orderByClause = { price: 'asc' };
    else if (sort === 'price_desc') orderByClause = { price: 'desc' };

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where: whereClause,
            orderBy: orderByClause,
            skip: parseInt(skip),
            take: parseInt(limit),
            include: {
                images: true,
                category: { select: { id: true, name: true, slug: true } },
                brand: { select: { id: true, name: true } }
            }
        }),
        prisma.product.count({ where: whereClause })
    ]);

    res.status(200).json({
        success: true,
        message: 'Products fetched successfully',
        data: {
            products,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        }
    });
});

exports.getProductBySlug = asyncHandler(async (req, res, next) => {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
        where: { slug },
        include: {
            images: true,
            category: true,
            subCategory: true,
            brand: true,
            reviews: {
                include: { user: { select: { id: true, fullName: true, avatar: true } } },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!product) {
        return next(new ApiError(404, 'Product not found'));
    }

    res.status(200).json({
        success: true,
        message: 'Product fetched successfully',
        data: product
    });
});

exports.createProduct = asyncHandler(async (req, res, next) => {
    const { name, description, shortDesc, price, discountPercent, discountPrice, stock, sku, categoryId, subCategoryId, brandId, tags, featured, trending, newArrival, bestSeller, sizes, colors, material, occasion, gender, images } = req.body;
    
    let slug = slugify(name, { lower: true, strict: true });
    
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
        slug = `${slug}-${Date.now()}`;
    }

    const calculatedDiscountPrice = discountPrice ? parseFloat(discountPrice) : (discountPercent ? parseFloat(price) * (1 - parseFloat(discountPercent) / 100) : parseFloat(price));

    const product = await prisma.product.create({
        data: {
            name,
            slug,
            sku: sku || `SV-PROD-${Date.now()}`,
            price: parseFloat(price),
            discountPercent: discountPercent ? parseFloat(discountPercent) : 0,
            discountPrice: calculatedDiscountPrice,
            stock: parseInt(stock || 0),
            categoryId,
            subCategoryId: subCategoryId || null,
            brandId: brandId || null,
            shortDesc: shortDesc || '',
            description: description || '',
            sizes: typeof sizes === 'string' ? sizes : JSON.stringify(sizes || []),
            colors: typeof colors === 'string' ? colors : JSON.stringify(colors || []),
            material: material || null,
            occasion: occasion || null,
            gender: gender || null,
            tags: typeof tags === 'string' ? tags : JSON.stringify(tags || []),
            featured: featured === 'true' || featured === true,
            trending: trending === 'true' || trending === true,
            newArrival: newArrival === 'true' || newArrival === true,
            bestSeller: bestSeller === 'true' || bestSeller === true,
        }
    });

    // Handle images if provided as URLs
    if (images && Array.isArray(images)) {
        const imageRecords = images.map((url, index) => ({
            productId: product.id,
            url,
            isPrimary: index === 0
        }));
        await prisma.productImage.createMany({ data: imageRecords });
    }

    const fullProduct = await prisma.product.findUnique({
        where: { id: product.id },
        include: { images: true, category: true }
    });

    res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: fullProduct
    });
});

exports.updateProduct = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    if (updateData.name) {
        updateData.slug = slugify(updateData.name, { lower: true, strict: true });
    }
    
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.discountPercent !== undefined) updateData.discountPercent = parseFloat(updateData.discountPercent);
    if (updateData.discountPrice) updateData.discountPrice = parseFloat(updateData.discountPrice);
    if (updateData.stock) updateData.stock = parseInt(updateData.stock);
    if (updateData.featured !== undefined) updateData.featured = updateData.featured === 'true' || updateData.featured === true;
    if (updateData.trending !== undefined) updateData.trending = updateData.trending === 'true' || updateData.trending === true;
    if (updateData.newArrival !== undefined) updateData.newArrival = updateData.newArrival === 'true' || updateData.newArrival === true;
    if (updateData.bestSeller !== undefined) updateData.bestSeller = updateData.bestSeller === 'true' || updateData.bestSeller === true;

    if (Array.isArray(updateData.sizes)) updateData.sizes = JSON.stringify(updateData.sizes);
    if (Array.isArray(updateData.colors)) updateData.colors = JSON.stringify(updateData.colors);
    if (Array.isArray(updateData.tags)) updateData.tags = JSON.stringify(updateData.tags);

    const product = await prisma.product.update({
        where: { id },
        data: updateData,
        include: { images: true, category: true }
    });

    res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product
    });
});

exports.deleteProduct = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });

    res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
        data: null
    });
});
