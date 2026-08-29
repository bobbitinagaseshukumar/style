import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import Spinner from '../components/common/Spinner';

import Home from '../pages/Home';
import Categories from '../pages/Categories';
import ProductDetails from '../pages/ProductDetails';
import Login from '../pages/Login';
import Register from '../pages/Register';
import AdminLogin from '../admin/Login';
import AdminVerifyOTP from '../admin/Login/AdminVerifyOTP';
import AdminForgotPassword from '../admin/Login/AdminForgotPassword';

// Helper function for dynamic imports with auto-reload retry on stale Vercel deployment chunk hash mismatches
const lazyRetry = (componentImport) =>
  lazy(async () => {
    const pageHasBeenReloaded = sessionStorage.getItem('chunk_reload');
    try {
      const component = await componentImport();
      sessionStorage.removeItem('chunk_reload');
      return component;
    } catch (error) {
      if (!pageHasBeenReloaded) {
        sessionStorage.setItem('chunk_reload', 'true');
        window.location.reload();
        return new Promise(() => {});
      }
      throw error;
    }
  });

// Lazy loading customer pages
const Cart = lazyRetry(() => import('../pages/Cart'));
const Checkout = lazyRetry(() => import('../pages/Checkout'));
const Wishlist = lazyRetry(() => import('../pages/Wishlist'));
const RecentlyViewed = lazyRetry(() => import('../pages/RecentlyViewed'));
const Orders = lazyRetry(() => import('../pages/Orders'));
const UserProfile = lazyRetry(() => import('../pages/UserProfile'));
const AddressBook = lazyRetry(() => import('../pages/AddressBook'));
const Notifications = lazyRetry(() => import('../pages/Notifications'));
const PaymentSuccess = lazyRetry(() => import('../pages/PaymentSuccess'));
const PaymentFailure = lazyRetry(() => import('../pages/PaymentFailure'));
const Compare = lazyRetry(() => import('../pages/Compare'));
const Search = lazyRetry(() => import('../pages/Search'));
const VendorRegister = lazyRetry(() => import('../pages/VendorRegister'));
const Blog = lazyRetry(() => import('../pages/Blog'));
const Support = lazyRetry(() => import('../pages/Support'));
const Dashboard = lazyRetry(() => import('../pages/Dashboard'));
const About = lazyRetry(() => import('../pages/About'));
const Contact = lazyRetry(() => import('../pages/Contact'));
const FAQ = lazyRetry(() => import('../pages/FAQ'));
const PrivacyPolicy = lazyRetry(() => import('../pages/PrivacyPolicy'));
const Terms = lazyRetry(() => import('../pages/Terms'));
const ShippingPolicy = lazyRetry(() => import('../pages/ShippingPolicy'));
const RefundPolicy = lazyRetry(() => import('../pages/RefundPolicy'));
const Error404 = lazyRetry(() => import('../pages/Error404'));
const Error500 = lazyRetry(() => import('../pages/Error500'));

// Lazy loading auth pages
const VerifyOTP = lazyRetry(() => import('../pages/VerifyOTP'));
const VerifyEmail = lazyRetry(() => import('../pages/VerifyEmail'));
const ForgotPassword = lazyRetry(() => import('../pages/ForgotPassword'));
const ResetPassword = lazyRetry(() => import('../pages/ResetPassword'));

// Lazy loading admin pages
const AdminProfile = lazyRetry(() => import('../admin/AdminProfile'));
const AdminTeam = lazyRetry(() => import('../admin/Team'));
const AdminDashboard = lazyRetry(() => import('../admin/Dashboard'));
const AdminProducts = lazyRetry(() => import('../admin/Products'));
const AdminCategories = lazyRetry(() => import('../admin/Categories'));
const AdminSubcategories = lazyRetry(() => import('../admin/Subcategories'));
const AdminInventory = lazyRetry(() => import('../admin/Inventory'));
const AdminOrders = lazyRetry(() => import('../admin/Orders'));
const AdminCustomers = lazyRetry(() => import('../admin/Customers'));
const AdminCoupons = lazyRetry(() => import('../admin/Coupons'));
const AdminSettings = lazyRetry(() => import('../admin/Settings'));
const AdminCMS = lazyRetry(() => import('../admin/CMS'));
const AdminBanner = lazyRetry(() => import('../admin/Banner'));
const AdminHomepage = lazyRetry(() => import('../admin/Homepage'));
const AdminFAQs = lazyRetry(() => import('../admin/FAQs'));
const AdminAnalytics = lazyRetry(() => import('../admin/Analytics'));
const AdminSEO = lazyRetry(() => import('../admin/SEO'));
const AdminBackup = lazyRetry(() => import('../admin/Backup'));
const AdminMarketplace = lazyRetry(() => import('../admin/Marketplace'));
const AdminBlog = lazyRetry(() => import('../admin/Blog'));
const AdminSupport = lazyRetry(() => import('../admin/Support'));
const AdminEmail = lazyRetry(() => import('../admin/Email'));
const AdminFlashSale = lazyRetry(() => import('../admin/Offers/FlashSaleManager'));
const AdminSpecialDeals = lazyRetry(() => import('../admin/Offers/SpecialDealsManager'));
const AdminCollections = lazyRetry(() => import('../admin/Offers/ProductCollectionsManager'));
const AdminReviews = lazyRetry(() => import('../admin/Offers/CustomerReviewsManager'));
const AdminSocial = lazyRetry(() => import('../admin/Offers/SocialFollowManager'));
const AdminHeritageBrands = lazyRetry(() => import('../admin/Offers/HeritageBrandsManager'));
const AdminTrending = lazyRetry(() => import('../admin/Offers/TrendingProductsManager'));
const AdminWhatsApp = lazyRetry(() => import('../admin/WhatsApp'));
const AdminHomepageSections = lazyRetry(() => import('../admin/Offers/HomepageSectionManager'));
const AdminHeaderMenu = lazyRetry(() => import('../admin/Offers/HeaderMenuManager'));
const AdminMobileNav = lazyRetry(() => import('../admin/MobileNavigation'));
const AdminHeaderManager = lazyRetry(() => import('../admin/Header'));
const AdminAuthFormManager = lazyRetry(() => import('../admin/AuthFormManager'));
const AdminSocialProofManager = lazyRetry(() => import('../admin/SocialProofManager'));
const AdminChatbotManager = lazyRetry(() => import('../admin/ChatbotManager'));

import ScrollToTop from '../components/common/ScrollToTop';

const SuspenseLoader = () => (
  <div className="h-screen w-full flex items-center justify-center">
    <Spinner className="w-12 h-12" />
  </div>
);

const AppRoutes = () => {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<SuspenseLoader />}>
        <Routes>
          {/* Main Customer Layout Routes */}
          <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/categories/:slug" element={<Categories />} />
          <Route path="/product/:slug" element={<ProductDetails />} />
          <Route path="/products/:slug" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/recently-viewed" element={<RecentlyViewed />} />
          <Route path="/search" element={<Search />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/vendor-register" element={<VendorRegister />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />

          {/* CMS Pages */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />

          {/* Protected Customer Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/address-book" element={<AddressBook />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/support" element={<Support />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
        </Route>

        {/* Standalone Full-Screen Auth Pages (3D luxury — no AuthLayout wrapper) */}
        <Route path="/auth" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Auth Layout Routes (OTP, Verify Email) */}
        <Route element={<AuthLayout />}>
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Route>

        {/* Dedicated Admin Login, Forgot Password & 2FA OTP Pages */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin/verify-otp" element={<AdminVerifyOTP />} />
        <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />

        {/* Admin Dashboard & Management Routes */}
        <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/admin/account-settings" element={<AdminProfile />} />
          <Route path="/admin/security" element={<AdminProfile />} />
          <Route path="/admin/team" element={<AdminTeam />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/subcategories" element={<AdminSubcategories />} />
          <Route path="/admin/inventory" element={<AdminInventory />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/users" element={<AdminCustomers />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
          <Route path="/admin/flash-sale" element={<AdminFlashSale />} />
          <Route path="/admin/special-deals" element={<AdminSpecialDeals />} />
          <Route path="/admin/collections" element={<AdminCollections />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/social" element={<AdminSocial />} />
          <Route path="/admin/heritage-brands" element={<AdminHeritageBrands />} />
          <Route path="/admin/trending" element={<AdminTrending />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/cms" element={<AdminCMS />} />
          <Route path="/admin/banners" element={<AdminBanner />} />
          <Route path="/admin/homepage" element={<AdminHomepage />} />
          <Route path="/admin/homepage-sections" element={<AdminHomepageSections />} />
          <Route path="/admin/header-menu" element={<AdminHeaderMenu />} />
          <Route path="/admin/mobile-navigation" element={<AdminMobileNav />} />
          <Route path="/admin/header" element={<AdminHeaderManager />} />
          <Route path="/admin/faqs" element={<AdminFAQs />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/seo" element={<AdminSEO />} />
          <Route path="/admin/backup" element={<AdminBackup />} />
          <Route path="/admin/marketplace" element={<AdminMarketplace />} />
          <Route path="/admin/blog" element={<AdminBlog />} />
          <Route path="/admin/support" element={<AdminSupport />} />
          <Route path="/admin/email" element={<AdminEmail />} />
          <Route path="/admin/whatsapp" element={<AdminWhatsApp />} />
          <Route path="/admin/auth-form-management" element={<AdminAuthFormManager />} />
          <Route path="/admin/social-proof-management" element={<AdminSocialProofManager />} />
          <Route path="/admin/chatbot-settings" element={<AdminChatbotManager />} />
        </Route>

        {/* Error Routes */}
        <Route path="/500" element={<Error500 />} />
        <Route path="*" element={<Error404 />} />
      </Routes>
    </Suspense>
    </>
  );
};

export default AppRoutes;
