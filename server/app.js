const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const couponRoutes = require('./routes/couponRoutes');
const cmsRoutes = require('./routes/cmsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const seoRoutes = require('./routes/seoRoutes');
const aiRoutes = require('./routes/aiRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');
const blogRoutes = require('./routes/blogRoutes');
const supportRoutes = require('./routes/supportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const emailRoutes = require('./routes/emailRoutes');
const seoController = require('./controllers/seoController');
const healthController = require('./controllers/healthController');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Security & Core Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP headers for cross-domain API & 3D canvas textures
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Base Health Route
app.get('/api/v1/health', healthController.getHealthStatus);

// Dynamic Sitemap & Robots.txt Routes
app.get('/sitemap.xml', seoController.getSitemapXML);
app.get('/robots.txt', seoController.getRobotsTXT);

// API Rate Limiting for all v1 routes
app.use('/api/v1', apiLimiter);

const adminDashboardRoutes = require('./routes/adminDashboardRoutes');

const recommendationRoutes = require('./routes/recommendationRoutes');
const recentlyViewedRoutes = require('./routes/recentlyViewedRoutes');

// Mount Routes
app.use('/api/v1/recommendations', recommendationRoutes);
app.use('/api/v1/recently-viewed', recentlyViewedRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/cms', cmsRoutes);
app.use('/api/v1/admin/dashboard', adminDashboardRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/seo', seoRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/marketplace', marketplaceRoutes);
app.use('/api/v1/blog', blogRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/email', emailRoutes);

// Centralized Error Middleware
app.use(errorHandler);

module.exports = app;
