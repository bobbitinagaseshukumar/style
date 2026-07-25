const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// Public: Get all blog posts
exports.getBlogPosts = asyncHandler(async (req, res) => {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json({ success: true, data: posts });
});

// Public: Get single blog post by slug
exports.getBlogPostBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });

  if (!post) {
    return next(new ApiError(404, 'Blog article not found'));
  }

  res.status(200).json({ success: true, data: post });
});

// Admin: Create blog post
exports.createBlogPost = asyncHandler(async (req, res, next) => {
  const { title, excerpt, content, coverImage, author, category, tags } = req.body;
  if (!title || !content) {
    return next(new ApiError(400, 'Title and Content are required'));
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const post = await prisma.blogPost.create({
    data: {
      title,
      slug,
      excerpt: excerpt || title,
      content,
      coverImage: coverImage || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      author: author || 'StyleVerse Editorial',
      category: category || 'Fashion Trends',
      tags: typeof tags === 'string' ? tags : JSON.stringify(tags || []),
    },
  });

  res.status(201).json({ success: true, message: 'Blog post published!', data: post });
});

// Admin: Delete blog post
exports.deleteBlogPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.blogPost.delete({ where: { id } });
  res.status(200).json({ success: true, message: 'Blog post deleted' });
});
