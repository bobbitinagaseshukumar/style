const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const slugify = require('slugify');

// ==================== GET ALL PRODUCTS ====================
exports.getAllProducts = asyncHandler(async (req, res, next) => {
  const {
    search,
    category,
    subCategory,
    subCategoryId,
    featured,
    trending,
    newArrival,
    bestSeller,
    isRecommended,
    isPremium,
    isFestival,
    showOnHomepage,
    status,
    includeAll,
    sort,
    page = 1,
    limit = 12
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Where Clause Filtering
  let whereClause = {};
  const andConditions = [];

  // Admin view (includeAll=true) vs Customer & Guest view
  if (includeAll === 'true') {
    if (status && status !== 'ALL') {
      whereClause.status = status.toUpperCase();
    }
  } else {
    // Guest & Customer public storefront view: Show all published/active products without requiring login
    whereClause.status = { in: ['PUBLISHED', 'ACTIVE', 'published', 'active'] };
  }

  // Text Search
  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDesc: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    });
  }

  // Category & Subcategory
  if (category) {
    andConditions.push({
      OR: [
        { categoryId: category },
        { category: { slug: category } }
      ]
    });
  }

  if (subCategory || subCategoryId) {
    andConditions.push({
      OR: [
        { subCategoryId: subCategory || subCategoryId },
        { subCategory: { slug: subCategory } }
      ]
    });
  }

  // Section Badges / Toggles
  if (featured === 'true') whereClause.featured = true;
  if (trending === 'true') whereClause.trending = true;
  if (newArrival === 'true') whereClause.newArrival = true;
  if (bestSeller === 'true') whereClause.bestSeller = true;
  if (isRecommended === 'true') whereClause.isRecommended = true;
  if (isPremium === 'true') whereClause.isPremium = true;
  if (isFestival === 'true') whereClause.isFestival = true;

  // Combine AND conditions
  if (andConditions.length > 0) {
    whereClause.AND = andConditions;
  }

  // Sorting
  let orderByClause = [{ displayOrder: 'asc' }, { createdAt: 'desc' }];
  if (sort === 'price_asc') orderByClause = { price: 'asc' };
  else if (sort === 'price_desc') orderByClause = { price: 'desc' };
  else if (sort === 'newest') orderByClause = { createdAt: 'desc' };
  else if (sort === 'oldest') orderByClause = { createdAt: 'asc' };
  else if (sort === 'name_asc') orderByClause = { name: 'asc' };
  else if (sort === 'name_desc') orderByClause = { name: 'desc' };
  else if (sort === 'stock_asc') orderByClause = { stock: 'asc' };
  else if (sort === 'stock_desc') orderByClause = { stock: 'desc' };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      orderBy: orderByClause,
      skip: parseInt(skip),
      take: parseInt(limit),
      include: {
        images: true,
        category: { select: { id: true, name: true, slug: true } },
        subCategory: { select: { id: true, name: true, slug: true } },
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
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    }
  });
});

// ==================== GET PRODUCT BY SLUG / ID / SKU ====================
exports.getProductBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;

  let product = await prisma.product.findFirst({
    where: {
      OR: [
        { slug: slug },
        { id: slug },
        { sku: slug }
      ]
    },
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

// ==================== CREATE PRODUCT ====================
exports.createProduct = asyncHandler(async (req, res, next) => {
  const {
    name, description, shortDesc, price, discountPercent, discountPrice, stock, sku,
    categoryId, subCategoryId, brandId, tags,
    featured, trending, newArrival, bestSeller, isRecommended, isPremium, isFestival,
    showOnHomepage, status, displayOrder,
    sizes, colors, material, occasion, gender, images,
    colorGalleries, colorSizeInventory
  } = req.body;

  if (!name || !price || !categoryId) {
    return next(new ApiError(400, 'Product name, price, and categoryId are required'));
  }

  let slug = slugify(name, { lower: true, strict: true });
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  const calculatedDiscountPrice = discountPrice
    ? parseFloat(discountPrice)
    : (discountPercent ? parseFloat(price) * (1 - parseFloat(discountPercent) / 100) : parseFloat(price));

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
      colorGalleries: typeof colorGalleries === 'string' ? colorGalleries : JSON.stringify(colorGalleries || []),
      colorSizeInventory: typeof colorSizeInventory === 'string' ? colorSizeInventory : JSON.stringify(colorSizeInventory || []),
      material: material || null,
      occasion: occasion || null,
      gender: gender || null,
      tags: typeof tags === 'string' ? tags : JSON.stringify(tags || []),
      featured: featured === 'true' || featured === true,
      trending: trending === 'true' || trending === true,
      newArrival: newArrival === 'true' || newArrival === true || true,
      bestSeller: bestSeller === 'true' || bestSeller === true,
      isRecommended: isRecommended === 'true' || isRecommended === true,
      isPremium: isPremium === 'true' || isPremium === true,
      isFestival: isFestival === 'true' || isFestival === true,
      showOnHomepage: showOnHomepage === undefined ? true : (showOnHomepage === 'true' || showOnHomepage === true),
      status: (status || 'PUBLISHED').toUpperCase(),
      displayOrder: displayOrder ? parseInt(displayOrder) : 0,
      isVisible: true,
    }
  });

  // Attach images
  if (images && Array.isArray(images) && images.length > 0) {
    const imageRecords = images.map((item, index) => ({
      productId: product.id,
      url: typeof item === 'string' ? item : (item.url || ''),
      isPrimary: typeof item === 'object' && item.isPrimary !== undefined ? Boolean(item.isPrimary) : index === 0,
      color: typeof item === 'object' ? item.color || null : null,
      sortOrder: typeof item === 'object' && item.sortOrder !== undefined ? parseInt(item.sortOrder) : index,
    })).filter(i => i.url);

    if (imageRecords.length > 0) {
      await prisma.productImage.createMany({ data: imageRecords });
    }
  }

  const fullProduct = await prisma.product.findUnique({
    where: { id: product.id },
    include: { images: true, category: true, subCategory: true }
  });

  res.status(201).json({
    success: true,
    message: 'Product created and published successfully',
    data: fullProduct
  });
});

// ==================== UPDATE PRODUCT ====================
exports.updateProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { images, ...rawUpdate } = req.body;
  const updateData = { ...rawUpdate };

  if (updateData.name) {
    updateData.slug = slugify(updateData.name, { lower: true, strict: true });
  }

  if (updateData.price !== undefined) updateData.price = parseFloat(updateData.price);
  if (updateData.discountPercent !== undefined) updateData.discountPercent = parseFloat(updateData.discountPercent);
  if (updateData.discountPrice !== undefined) updateData.discountPrice = parseFloat(updateData.discountPrice);
  if (updateData.stock !== undefined) updateData.stock = parseInt(updateData.stock);
  if (updateData.displayOrder !== undefined) updateData.displayOrder = parseInt(updateData.displayOrder);

  // Boolean Toggles
  if (updateData.featured !== undefined) updateData.featured = updateData.featured === 'true' || updateData.featured === true;
  if (updateData.trending !== undefined) updateData.trending = updateData.trending === 'true' || updateData.trending === true;
  if (updateData.newArrival !== undefined) updateData.newArrival = updateData.newArrival === 'true' || updateData.newArrival === true;
  if (updateData.bestSeller !== undefined) updateData.bestSeller = updateData.bestSeller === 'true' || updateData.bestSeller === true;
  if (updateData.isRecommended !== undefined) updateData.isRecommended = updateData.isRecommended === 'true' || updateData.isRecommended === true;
  if (updateData.isPremium !== undefined) updateData.isPremium = updateData.isPremium === 'true' || updateData.isPremium === true;
  if (updateData.isFestival !== undefined) updateData.isFestival = updateData.isFestival === 'true' || updateData.isFestival === true;
  if (updateData.showOnHomepage !== undefined) updateData.showOnHomepage = updateData.showOnHomepage === 'true' || updateData.showOnHomepage === true;

  if (updateData.status) updateData.status = updateData.status.toUpperCase();

  if (updateData.sizes && typeof updateData.sizes !== 'string') updateData.sizes = JSON.stringify(updateData.sizes);
  if (updateData.colors && typeof updateData.colors !== 'string') updateData.colors = JSON.stringify(updateData.colors);
  if (updateData.colorGalleries && typeof updateData.colorGalleries !== 'string') updateData.colorGalleries = JSON.stringify(updateData.colorGalleries);
  if (updateData.colorSizeInventory && typeof updateData.colorSizeInventory !== 'string') updateData.colorSizeInventory = JSON.stringify(updateData.colorSizeInventory);
  if (updateData.tags && typeof updateData.tags !== 'string') updateData.tags = JSON.stringify(updateData.tags);

  const product = await prisma.product.update({
    where: { id },
    data: updateData
  });

  // If new images provided, sync images
  if (images && Array.isArray(images)) {
    await prisma.productImage.deleteMany({ where: { productId: id } });
    const imageRecords = images.map((item, index) => ({
      productId: id,
      url: typeof item === 'string' ? item : (item.url || ''),
      isPrimary: typeof item === 'object' && item.isPrimary !== undefined ? Boolean(item.isPrimary) : index === 0,
      color: typeof item === 'object' ? item.color || null : null,
      sortOrder: typeof item === 'object' && item.sortOrder !== undefined ? parseInt(item.sortOrder) : index,
    })).filter(i => i.url);

    if (imageRecords.length > 0) {
      await prisma.productImage.createMany({ data: imageRecords });
    }
  }

  const updatedFullProduct = await prisma.product.findUnique({
    where: { id },
    include: { images: true, category: true, subCategory: true }
  });

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: updatedFullProduct
  });
});

// ==================== DELETE / SOFT DELETE PRODUCT ====================
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { hardDelete } = req.query;

  if (hardDelete === 'true') {
    // Permanent deletion
    await prisma.productImage.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
  } else {
    // Soft Delete / Archive
    await prisma.product.update({
      where: { id },
      data: {
        status: 'DELETED',
        isVisible: false,
        showOnHomepage: false
      }
    });
  }

  res.status(200).json({
    success: true,
    message: 'Product removed from website successfully',
    data: null
  });
});

// ==================== RESET ALL STOCKS TO 0 ====================
exports.resetAllStocks = asyncHandler(async (req, res) => {
  await prisma.product.updateMany({
    data: { stock: 0 }
  });
  res.status(200).json({
    success: true,
    message: 'All product stocks reset to 0 successfully!'
  });
});
