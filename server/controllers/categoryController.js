const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const slugify = require('slugify');

exports.getCategories = asyncHandler(async (req, res, next) => {
    const categories = await prisma.category.findMany({
        where: { isVisible: true },
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

exports.createCategory = asyncHandler(async (req, res, next) => {
    const { name, description, image, banner, sortOrder, isVisible } = req.body;

    const slug = slugify(name, { lower: true, strict: true });

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
        return next(new ApiError(400, 'Category with this name already exists'));
    }

    const category = await prisma.category.create({
        data: {
            name,
            slug,
            description,
            image,
            banner,
            sortOrder: parseInt(sortOrder || 0),
            isVisible: isVisible !== false
        }
    });

    res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
    });
});

exports.updateCategory = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.name) {
        updateData.slug = slugify(updateData.name, { lower: true, strict: true });
    }

    if (updateData.sortOrder !== undefined) {
        updateData.sortOrder = parseInt(updateData.sortOrder);
    }

    const category = await prisma.category.update({
        where: { id },
        data: updateData
    });

    res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: category
    });
});

exports.deleteCategory = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    await prisma.category.delete({ where: { id } });

    res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
        data: null
    });
});

/* ─── Sub Category CRUD ──────────────────────────────────────── */

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

