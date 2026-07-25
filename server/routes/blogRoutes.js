const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', blogController.getBlogPosts);
router.get('/:slug', blogController.getBlogPostBySlug);
router.post('/admin', protect, authorize('ADMIN', 'SUPER_ADMIN'), blogController.createBlogPost);
router.delete('/admin/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), blogController.deleteBlogPost);

module.exports = router;
