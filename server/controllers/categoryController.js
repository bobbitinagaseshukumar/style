const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const slugify = require('slugify');
const { invalidateHomepageBundleCache } = require('./cmsController');

// ==================== GET ALL CATEGORIES ====================
exports.getCategories = asyncHandler(async (req, res, next) => {
  const { includeAll, showOnHomepage, inNavMenu, status, featured } = req.query;

  let whereClause = {};

  if (includeAll === 'true') {
    if (status && status !== 'ALL') {
      whereClause.status = status.toUpperCase();
    }
  } else {
    // Customer view: Published categories
    whereClause.status = 'PUBLISHED';
    whereClause.isVisible = true;

    if (showOnHomepage === 'true') {
      whereClause.showOnHomepage = true;
    }
    if (inNavMenu === 'true') {
      whereClause.inNavMenu = true;
    }
    if (featured === 'true') {
      whereClause.isFeaturedCategory = true;
    }
  }

  const categories = await prisma.category.findMany({
    where: whereClause,
    orderBy: { sortOrder: 'asc' },
    include: {
      subcategories: {
        where: { isVisible: true }
      },
      _count: {
        select: { products: true }
      }
    }
  });

  res.status(200).json({
    success: true,
    message: 'Categories fetched successfully',
    data: categories
  });
});

// ==================== CREATE CATEGORY ====================
exports.createCategory = asyncHandler(async (req, res, next) => {
  const {
    name, description, shortDesc, image, banner, sortOrder, isVisible,
    status, showOnHomepage, inNavMenu, inMegaMenu, inSearchFilters, inMobileMenu,
    isFeaturedCategory, isTrendingCategory, isLuxuryCollection, isNewCollection,
    isFestivalCollection, isPremiumCollection,
    seoTitle, seoDescription, seoKeywords
  } = req.body;

  if (!name || !name.trim()) {
    return next(new ApiError(400, 'Category Name is required'));
  }

  let slug = slugify(name, { lower: true, strict: true });
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  const category = await prisma.category.create({
    data: {
      name: name.trim(),
      slug,
      description: description || '',
      shortDesc: shortDesc || '',
      image: image || null,
      banner: banner || null,
      sortOrder: sortOrder ? parseInt(sortOrder) : 0,
      isVisible: isVisible !== false,
      status: (status || 'PUBLISHED').toUpperCase(),
      showOnHomepage: showOnHomepage === undefined ? true : (showOnHomepage === 'true' || showOnHomepage === true),
      inNavMenu: inNavMenu === undefined ? true : (inNavMenu === 'true' || inNavMenu === true),
      inMegaMenu: inMegaMenu === undefined ? true : (inMegaMenu === 'true' || inMegaMenu === true),
      inSearchFilters: inSearchFilters === undefined ? true : (inSearchFilters === 'true' || inSearchFilters === true),
      inMobileMenu: inMobileMenu === undefined ? true : (inMobileMenu === 'true' || inMobileMenu === true),
      isFeaturedCategory: isFeaturedCategory === 'true' || isFeaturedCategory === true,
      isTrendingCategory: isTrendingCategory === 'true' || isTrendingCategory === true,
      isLuxuryCollection: isLuxuryCollection === 'true' || isLuxuryCollection === true,
      isNewCollection: isNewCollection === 'true' || isNewCollection === true,
      isFestivalCollection: isFestivalCollection === 'true' || isFestivalCollection === true,
      isPremiumCollection: isPremiumCollection === 'true' || isPremiumCollection === true,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      seoKeywords: seoKeywords || null,
    }
  });

  invalidateHomepageBundleCache();

  // Auto-create HeaderMenu entry so category appears in website header navigation
  if (category.inNavMenu) {
    try {
      const existingMenu = await prisma.headerMenu.findFirst({
        where: { OR: [{ slug: category.slug }, { categoryId: category.id }] }
      });
      if (!existingMenu) {
        const maxOrder = await prisma.headerMenu.aggregate({ _max: { sortOrder: true } });
        await prisma.headerMenu.create({
          data: {
            title: category.name,
            slug: category.slug,
            link: `/categories/${category.slug}`,
            categoryId: category.id,
            sortOrder: (maxOrder._max.sortOrder || 0) + 1,
            status: 'PUBLISHED',
            isActive: true
          }
        });
      }
    } catch (e) {
      console.warn('Auto-create HeaderMenu warning:', e.message);
    }
  }

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category
  });
});

const sanitizeUpdateData = (data) => {
  const clean = { ...data };
  ['id', 'createdAt', 'updatedAt', '_count', 'subcategories', 'products'].forEach(k => delete clean[k]);
  return clean;
};

// ==================== UPDATE CATEGORY ====================
exports.updateCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = sanitizeUpdateData(req.body);

  if (updateData.name) {
    updateData.slug = slugify(updateData.name, { lower: true, strict: true });
  }

  if (updateData.sortOrder !== undefined && updateData.sortOrder !== null) updateData.sortOrder = parseInt(updateData.sortOrder);
  if (updateData.status) updateData.status = updateData.status.toUpperCase();

  // Boolean Toggles
  ['showOnHomepage', 'inNavMenu', 'inMegaMenu', 'inSearchFilters', 'inMobileMenu',
   'isFeaturedCategory', 'isTrendingCategory', 'isLuxuryCollection', 'isNewCollection',
   'isFestivalCollection', 'isPremiumCollection', 'isVisible'].forEach(key => {
    if (updateData[key] !== undefined) {
      updateData[key] = updateData[key] === 'true' || updateData[key] === true;
    }
  });

  const category = await prisma.category.update({
    where: { id },
    data: updateData
  });

  invalidateHomepageBundleCache();

  // Sync HeaderMenu when category is updated
  try {
    const existingMenu = await prisma.headerMenu.findFirst({
      where: { OR: [{ categoryId: id }, { slug: category.slug }] }
    });
    if (category.inNavMenu) {
      if (existingMenu) {
        // Update existing menu entry to reflect name/slug changes
        await prisma.headerMenu.update({
          where: { id: existingMenu.id },
          data: {
            title: category.name,
            slug: category.slug,
            link: `/categories/${category.slug}`,
            status: category.status === 'PUBLISHED' ? 'PUBLISHED' : 'HIDDEN',
            isActive: category.isVisible !== false
          }
        });
      } else {
        // Category was toggled to show in nav — create menu entry
        const maxOrder = await prisma.headerMenu.aggregate({ _max: { sortOrder: true } });
        await prisma.headerMenu.create({
          data: {
            title: category.name,
            slug: category.slug,
            link: `/categories/${category.slug}`,
            categoryId: id,
            sortOrder: (maxOrder._max.sortOrder || 0) + 1,
            status: 'PUBLISHED',
            isActive: true
          }
        });
      }
    } else if (existingMenu) {
      // Category removed from nav — delete the menu entry
      await prisma.headerMenu.delete({ where: { id: existingMenu.id } });
    }
  } catch (e) {
    console.warn('Sync HeaderMenu warning:', e.message);
  }

  res.status(200).json({
    success: true,
    message: 'Category updated and published successfully',
    data: category
  });
});

// ==================== DELETE CATEGORY WITH PRODUCT TRANSFER REQUIREMENT ====================
exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const body = req.body || {};
  const query = req.query || {};
  const deleteMode = body.deleteMode || query.deleteMode || 'DELETE_CATEGORY_ONLY';
  const targetCategoryId = body.targetCategoryId || query.targetCategoryId;

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return next(new ApiError(404, 'Category not found'));
  }

  // 1. ARCHIVE MODE
  if (deleteMode === 'ARCHIVE') {
    await prisma.category.update({
      where: { id },
      data: { status: 'ARCHIVED', isVisible: false, showOnHomepage: false }
    });
    invalidateHomepageBundleCache();
    return res.status(200).json({ success: true, message: 'Category archived successfully' });
  }

  // Check product count in this category
  const productCount = await prisma.product.count({ where: { categoryId: id } });

  // If products exist and no target category is provided and deleteMode is not DELETE_ALL, enforce transfer
  if (productCount > 0 && !targetCategoryId && deleteMode !== 'DELETE_ALL') {
    return next(new ApiError(400, `Category "${category.name}" contains ${productCount} assigned product(s). Please select a target category to transfer these products before removing this category.`));
  }

  // Clean up subcategories to prevent foreign key constraint violations
  await prisma.subCategory.deleteMany({ where: { categoryId: id } }).catch(() => {});

  // Clean up any HeaderMenu items pointing to this category to keep navbar in sync
  await prisma.headerMenu.deleteMany({
    where: {
      OR: [
        { categoryId: id },
        { slug: category.slug },
        { link: `/categories/${category.slug}` }
      ]
    }
  }).catch(() => {});

  // 2. MOVE_PRODUCTS OR TRANSFER & DELETE
  if (productCount > 0 && targetCategoryId) {
    // Verify target category exists and is not the same category
    if (targetCategoryId === id) {
      return next(new ApiError(400, 'Target category cannot be the same as the category being deleted'));
    }
    const targetCategory = await prisma.category.findUnique({ where: { id: targetCategoryId } });
    if (!targetCategory) {
      return next(new ApiError(404, 'Target category for transfer not found'));
    }

    await prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: targetCategoryId }
    });
    await prisma.category.delete({ where: { id } });
    invalidateHomepageBundleCache();
    return res.status(200).json({
      success: true,
      message: `Transferred ${productCount} product(s) to "${targetCategory.name}" and removed category successfully!`
    });
  }

  // 3. DELETE_ALL (Delete category and all associated products)
  if (deleteMode === 'DELETE_ALL') {
    await prisma.product.deleteMany({ where: { categoryId: id } }).catch(() => {});
    await prisma.category.delete({ where: { id } });
    invalidateHomepageBundleCache();
    return res.status(200).json({ success: true, message: 'Category and all associated products deleted' });
  }

  // 4. Clean category with 0 products
  await prisma.category.delete({ where: { id } });
  invalidateHomepageBundleCache();

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully',
    data: null
  });
});

// ==================== SUBCATEGORY CONTROLLERS ====================
exports.getSubCategories = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.params;
  const subs = await prisma.subCategory.findMany({
    where: { categoryId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } }
  });
  res.status(200).json({ success: true, data: subs });
});

exports.createSubCategory = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.params;
  const { name, image, isVisible } = req.body;
  if (!name) return next(new ApiError(400, 'Subcategory name is required'));

  const slug = slugify(`${categoryId}-${name}`, { lower: true, strict: true });

  const sub = await prisma.subCategory.create({
    data: { name, slug, categoryId, image, isVisible: isVisible !== false }
  });
  res.status(201).json({ success: true, message: 'Subcategory created', data: sub });
});

exports.updateSubCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const data = { ...req.body };
  if (data.name) data.slug = slugify(data.name, { lower: true, strict: true });
  const sub = await prisma.subCategory.update({ where: { id }, data });
  res.status(200).json({ success: true, message: 'Subcategory updated', data: sub });
});

exports.deleteSubCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  await prisma.subCategory.delete({ where: { id } });
  res.status(200).json({ success: true, message: 'Subcategory deleted', data: null });
});
