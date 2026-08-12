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
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
app.set('trust proxy', 1);

// Security & Core Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP headers for cross-domain API & 3D canvas textures
}));

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      process.env.CLIENT_URL,
    ].filter(Boolean);
    // Also allow any .vercel.app domain for preview deployments
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      if (process.env.NODE_ENV === 'production') {
        callback(new Error('Not allowed by CORS'));
      } else {
        callback(null, true); // Allow in development
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
const path = require('path');

// Serve uploaded product images statically from /uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public/uploads', express.static(path.join(__dirname, 'public/uploads')));

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

const adminCustomerRoutes = require('./routes/adminCustomerRoutes');

const subcategoryRoutes = require('./routes/subcategoryRoutes');

const adminAuthRoutes = require('./routes/adminAuthRoutes');

const chatbotRoutes = require('./routes/chatbotRoutes');

const authFormRoutes = require('./routes/authFormRoutes');

const socialProofRoutes = require('./routes/socialProofRoutes');
const chatbotSettingRoutes = require('./routes/chatbotSettingRoutes');

// Mount Routes
app.use('/api/v1/admin/auth', adminAuthRoutes);
app.use('/api/v1/social-proof', socialProofRoutes);
app.use('/api/v1/chatbot-setting', chatbotSettingRoutes);
app.use('/api/v1/auth-form', authFormRoutes);
app.use('/api/auth-form', authFormRoutes);
app.use('/api/v1/chatbot', chatbotRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);
app.use('/api/v1/recently-viewed', recentlyViewedRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/email', emailRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/subcategories', subcategoryRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/cms', cmsRoutes);
app.use('/api/v1/admin/dashboard', adminDashboardRoutes);
app.use('/api/v1/admin/customers', adminCustomerRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/seo', seoRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/marketplace', marketplaceRoutes);
app.use('/api/v1/blog', blogRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/upload', uploadRoutes);

// Centralized Error Middleware
app.use(errorHandler);

module.exports = app;
