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

// Lazy loading customer pages
const Cart = lazy(() => import('../pages/Cart'));
const Checkout = lazy(() => import('../pages/Checkout'));
const Wishlist = lazy(() => import('../pages/Wishlist'));
const Orders = lazy(() => import('../pages/Orders'));
const UserProfile = lazy(() => import('../pages/UserProfile'));
const AddressBook = lazy(() => import('../pages/AddressBook'));
const Notifications = lazy(() => import('../pages/Notifications'));
const PaymentSuccess = lazy(() => import('../pages/PaymentSuccess'));
const PaymentFailure = lazy(() => import('../pages/PaymentFailure'));
const Compare = lazy(() => import('../pages/Compare'));
const Search = lazy(() => import('../pages/Search'));
const VendorRegister = lazy(() => import('../pages/VendorRegister'));
const Blog = lazy(() => import('../pages/Blog'));
const Support = lazy(() => import('../pages/Support'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const About = lazy(() => import('../pages/About'));
const Contact = lazy(() => import('../pages/Contact'));
const FAQ = lazy(() => import('../pages/FAQ'));
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy'));
const Terms = lazy(() => import('../pages/Terms'));
const ShippingPolicy = lazy(() => import('../pages/ShippingPolicy'));
const RefundPolicy = lazy(() => import('../pages/RefundPolicy'));
const Error404 = lazy(() => import('../pages/Error404'));
const Error500 = lazy(() => import('../pages/Error500'));

// Lazy loading auth pages
const VerifyOTP = lazy(() => import('../pages/VerifyOTP'));
const VerifyEmail = lazy(() => import('../pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));

// Lazy loading admin pages
const AdminProfile = lazy(() => import('../admin/AdminProfile'));
const AdminTeam = lazy(() => import('../admin/Team'));
const AdminDashboard = lazy(() => import('../admin/Dashboard'));
const AdminProducts = lazy(() => import('../admin/Products'));
const AdminCategories = lazy(() => import('../admin/Categories'));
const AdminSubcategories = lazy(() => import('../admin/Subcategories'));
const AdminInventory = lazy(() => import('../admin/Inventory'));
const AdminOrders = lazy(() => import('../admin/Orders'));
const AdminCustomers = lazy(() => import('../admin/Customers'));
const AdminCoupons = lazy(() => import('../admin/Coupons'));
const AdminSettings = lazy(() => import('../admin/Settings'));
const AdminCMS = lazy(() => import('../admin/CMS'));
const AdminBanner = lazy(() => import('../admin/Banner'));
const AdminHomepage = lazy(() => import('../admin/Homepage'));
const AdminFAQs = lazy(() => import('../admin/FAQs'));
const AdminAnalytics = lazy(() => import('../admin/Analytics'));
const AdminSEO = lazy(() => import('../admin/SEO'));
const AdminBackup = lazy(() => import('../admin/Backup'));
const AdminMarketplace = lazy(() => import('../admin/Marketplace'));
const AdminBlog = lazy(() => import('../admin/Blog'));
const AdminSupport = lazy(() => import('../admin/Support'));
const AdminEmail = lazy(() => import('../admin/Email'));
const AdminFlashSale = lazy(() => import('../admin/Offers/FlashSaleManager'));
const AdminSpecialDeals = lazy(() => import('../admin/Offers/SpecialDealsManager'));
const AdminCollections = lazy(() => import('../admin/Offers/ProductCollectionsManager'));
const AdminReviews = lazy(() => import('../admin/Offers/CustomerReviewsManager'));
const AdminSocial = lazy(() => import('../admin/Offers/SocialFollowManager'));
const AdminHeritageBrands = lazy(() => import('../admin/Offers/HeritageBrandsManager'));
const AdminTrending = lazy(() => import('../admin/Offers/TrendingProductsManager'));
const AdminWhatsApp = lazy(() => import('../admin/WhatsApp'));
const AdminHomepageSections = lazy(() => import('../admin/Offers/HomepageSectionManager'));
const AdminHeaderMenu = lazy(() => import('../admin/Offers/HeaderMenuManager'));
const AdminMobileNav = lazy(() => import('../admin/MobileNavigation'));
const AdminHeaderManager = lazy(() => import('../admin/Header'));
const AdminAuthFormManager = lazy(() => import('../admin/AuthFormManager'));
const AdminSocialProofManager = lazy(() => import('../admin/SocialProofManager'));
const AdminChatbotManager = lazy(() => import('../admin/ChatbotManager'));

const SuspenseLoader = () => (
  <div className="h-screen w-full flex items-center justify-center">
    <Spinner className="w-12 h-12" />
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<SuspenseLoader />}>
      <Routes>
        {/* Main Customer Layout Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/categories/:slug" element={<Categories />} />
          <Route path="/product/:slug" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
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

        {/* Auth Layout Routes (OTP, Verify Email, Forgot, Reset) */}
        <Route element={<AuthLayout />}>
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Dedicated Admin Login & 2FA OTP Pages (Outside Customer Flow & Outside Admin Layout) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin/verify-otp" element={<AdminVerifyOTP />} />

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
  );
};

export default AppRoutes;
