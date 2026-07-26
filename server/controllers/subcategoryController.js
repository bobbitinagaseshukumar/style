const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const slugify = require('slugify');

// ==================== GET ALL SUBCATEGORIES ====================
exports.getAllSubcategories = asyncHandler(async (req, res) => {
  const { categoryId, status, search, featured, activeOnly, sortBy = 'sortOrder', sortOrder = 'asc' } = req.query;

  let where = {};

  if (activeOnly === 'true') {
    where.status = 'PUBLISHED';
    where.isVisible = true;
  } else if (status && status !== 'ALL') {
    where.status = status.toUpperCase();
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (featured === 'true') {
    where.isFeatured = true;
  }

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { slug: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  let orderBy = { sortOrder: 'asc' };
  if (sortBy === 'name') orderBy = { name: sortOrder.toLowerCase() };
  else if (sortBy === 'createdAt') orderBy = { createdAt: sortOrder.toLowerCase() };
  else if (sortBy === 'sortOrder') orderBy = { sortOrder: sortOrder.toLowerCase() };

  const subcategories = await prisma.subCategory.findMany({
    where,
    orderBy,
    include: {
      category: {
        select: { id: true, name: true, slug: true, image: true }
      },
      _count: {
        select: { products: true }
      }
    }
  });

  res.status(200).json({
    success: true,
    data: subcategories
  });
});

// ==================== GET SUBCATEGORY BY ID / SLUG ====================
exports.getSubcategoryById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const subcategory = await prisma.subCategory.findFirst({
    where: {
      OR: [{ id }, { slug: id }]
    },
    include: {
      category: {
        select: { id: true, name: true, slug: true }
      },
      products: {
        where: { isVisible: true },
        take: 20,
        select: { id: true, name: true, slug: true, price: true, discountPrice: true, images: true }
      },
      _count: {
        select: { products: true }
      }
    }
  });

  if (!subcategory) {
    return next(new ApiError(404, 'Subcategory not found'));
  }

  res.status(200).json({
    success: true,
    data: subcategory
  });
});

// ==================== CREATE SUBCATEGORY ====================
exports.createSubcategory = asyncHandler(async (req, res, next) => {
  const { categoryId, name, description, image, sortOrder, status, isFeatured, isVisible } = req.body;

  if (!categoryId) {
    return next(new ApiError(400, 'Parent Category is required'));
  }
  if (!name || !name.trim()) {
    return next(new ApiError(400, 'Subcategory Name is required'));
  }
  if (!image) {
    return next(new ApiError(400, 'Subcategory Image is required'));
  }

  // Verify Parent Category exists
  const parentCat = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!parentCat) {
    return next(new ApiError(404, 'Selected parent category does not exist'));
  }

  // Check duplicate subcategory name under the same category
  const existingSameName = await prisma.subCategory.findFirst({
    where: {
      categoryId,
      name: { equals: name.trim(), mode: 'insensitive' }
    }
  });
  if (existingSameName) {
    return next(new ApiError(400, `A subcategory named "${name.trim()}" already exists under category "${parentCat.name}".`));
  }

  // Generate unique slug
  let rawSlug = `${parentCat.slug}-${slugify(name.trim(), { lower: true, strict: true })}`;
  let slug = rawSlug;
  const existingSlug = await prisma.subCategory.findUnique({ where: { slug } });
  if (existingSlug) {
    slug = `${rawSlug}-${Date.now()}`;
  }

  const subcategory = await prisma.subCategory.create({
    data: {
      categoryId,
      name: name.trim(),
      slug,
      description: description || '',
      image,
      sortOrder: sortOrder ? parseInt(sortOrder) : 0,
      status: (status || 'PUBLISHED').toUpperCase(),
      isFeatured: isFeatured === true || isFeatured === 'true',
      isVisible: isVisible !== false
    },
    include: {
      category: { select: { id: true, name: true, slug: true } }
    }
  });

  res.status(201).json({
    success: true,
    message: `Subcategory "${subcategory.name}" created under "${parentCat.name}" successfully!`,
    data: subcategory
  });
});

// ==================== UPDATE SUBCATEGORY ====================
exports.updateSubcategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { categoryId, name, description, image, sortOrder, status, isFeatured, isVisible } = req.body;

  const existing = await prisma.subCategory.findUnique({
    where: { id },
    include: { category: true }
  });
  if (!existing) {
    return next(new ApiError(404, 'Subcategory not found'));
  }

  const targetCategoryId = categoryId || existing.categoryId;
  const targetName = name ? name.trim() : existing.name;

  // Check duplicate name under target category if name or category changed
  if (targetCategoryId !== existing.categoryId || targetName.toLowerCase() !== existing.name.toLowerCase()) {
    const duplicate = await prisma.subCategory.findFirst({
      where: {
        id: { not: id },
        categoryId: targetCategoryId,
        name: { equals: targetName, mode: 'insensitive' }
      }
    });
    if (duplicate) {
      return next(new ApiError(400, `Subcategory "${targetName}" already exists under the selected parent category.`));
    }
  }

  let slug = existing.slug;
  if (name && name.trim().toLowerCase() !== existing.name.toLowerCase()) {
    const parentCat = await prisma.category.findUnique({ where: { id: targetCategoryId } });
    let rawSlug = `${parentCat?.slug || 'sub'}-${slugify(name.trim(), { lower: true, strict: true })}`;
    slug = rawSlug;
    const existingSlug = await prisma.subCategory.findFirst({ where: { slug, id: { not: id } } });
    if (existingSlug) {
      slug = `${rawSlug}-${Date.now()}`;
    }
  }

  const updated = await prisma.subCategory.update({
    where: { id },
    data: {
      categoryId: targetCategoryId,
      name: targetName,
      slug,
      description: description !== undefined ? description : existing.description,
      image: image || existing.image,
      sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : existing.sortOrder,
      status: status ? status.toUpperCase() : existing.status,
      isFeatured: isFeatured !== undefined ? (isFeatured === true || isFeatured === 'true') : existing.isFeatured,
      isVisible: isVisible !== undefined ? (isVisible === true || isVisible === 'true') : existing.isVisible
    },
    include: {
      category: { select: { id: true, name: true, slug: true } }
    }
  });

  res.status(200).json({
    success: true,
    message: `Subcategory "${updated.name}" updated successfully!`,
    data: updated
  });
});

// ==================== REORDER SUBCATEGORIES (DRAG AND DROP) ====================
exports.reorderSubcategories = asyncHandler(async (req, res) => {
  const { items } = req.body; // Array of { id, sortOrder }

  if (Array.isArray(items)) {
    await Promise.all(
      items.map(item =>
        prisma.subCategory.update({
          where: { id: item.id },
          data: { sortOrder: parseInt(item.sortOrder || 0) }
        })
      )
    );
  }

  res.status(200).json({
    success: true,
    message: 'Subcategory display order updated successfully!'
  });
});

// ==================== DELETE SUBCATEGORY (WITH PRODUCT TRANSFER) ====================
exports.deleteSubcategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const body = req.body || {};
  const query = req.query || {};
  const deleteMode = body.deleteMode || query.deleteMode || 'DELETE_SUBCATEGORY_ONLY';
  const targetSubCategoryId = body.targetSubCategoryId || query.targetSubCategoryId;

  const subcategory = await prisma.subCategory.findUnique({
    where: { id },
    include: { category: true }
  });

  if (!subcategory) {
    return next(new ApiError(404, 'Subcategory not found'));
  }

  const productCount = await prisma.product.count({ where: { subCategoryId: id } });

  // If products exist and no target subcategory is provided, enforce transfer or explicit delete_all
  if (productCount > 0 && !targetSubCategoryId && deleteMode !== 'DELETE_ALL') {
    return next(new ApiError(400, `Subcategory "${subcategory.name}" contains ${productCount} assigned product(s). Please select a target subcategory to transfer products before deleting.`));
  }

  // Transfer Products to target subcategory
  if (productCount > 0 && targetSubCategoryId) {
    if (targetSubCategoryId === id) {
      return next(new ApiError(400, 'Target subcategory cannot be the same as the subcategory being deleted'));
    }
    const targetSub = await prisma.subCategory.findUnique({ where: { id: targetSubCategoryId } });
    if (!targetSub) {
      return next(new ApiError(404, 'Target subcategory for transfer not found'));
    }

    await prisma.product.updateMany({
      where: { subCategoryId: id },
      data: { subCategoryId: targetSubCategoryId }
    });
    await prisma.subCategory.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: `Transferred ${productCount} product(s) to "${targetSub.name}" and removed subcategory successfully!`
    });
  }

  // Delete All Products
  if (deleteMode === 'DELETE_ALL') {
    await prisma.product.deleteMany({ where: { subCategoryId: id } }).catch(() => {});
    await prisma.subCategory.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: `Subcategory "${subcategory.name}" and all ${productCount} assigned products deleted permanently.`
    });
  }

  // 0 Products assigned -> Clean delete
  await prisma.subCategory.delete({ where: { id } });

  res.status(200).json({
    success: true,
    message: `Subcategory "${subcategory.name}" deleted successfully!`
  });
});
