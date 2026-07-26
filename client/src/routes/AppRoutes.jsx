import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import Spinner from '../components/common/Spinner';

// Lazy loading customer pages
const Home = lazy(() => import('../pages/Home'));
const Categories = lazy(() => import('../pages/Categories'));
const ProductDetails = lazy(() => import('../pages/ProductDetails'));
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
// Login is rendered standalone (full-screen 3D) — outside AuthLayout
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const VerifyOTP = lazy(() => import('../pages/VerifyOTP'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));

// Lazy loading admin pages
const AdminDashboard = lazy(() => import('../admin/Dashboard'));
const AdminProducts = lazy(() => import('../admin/Products'));
const AdminCategories = lazy(() => import('../admin/Categories'));
const AdminInventory = lazy(() => import('../admin/Inventory'));
const AdminOrders = lazy(() => import('../admin/Orders'));
const AdminUsers = lazy(() => import('../admin/Users'));
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

        {/* Auth Layout Routes (OTP, Forgot, Reset) */}
        <Route element={<AuthLayout />}>
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Admin Layout Routes */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="flash-sale" element={<AdminFlashSale />} />
          <Route path="special-deals" element={<AdminSpecialDeals />} />
          <Route path="collections" element={<AdminCollections />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="social" element={<AdminSocial />} />
          <Route path="heritage-brands" element={<AdminHeritageBrands />} />
          <Route path="trending" element={<AdminTrending />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="cms" element={<AdminCMS />} />
          <Route path="banners" element={<AdminBanner />} />
          <Route path="homepage" element={<AdminHomepage />} />
          <Route path="homepage-sections" element={<AdminHomepageSections />} />
          <Route path="header-menu" element={<AdminHeaderMenu />} />
          <Route path="faqs" element={<AdminFAQs />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="seo" element={<AdminSEO />} />
          <Route path="backup" element={<AdminBackup />} />
          <Route path="marketplace" element={<AdminMarketplace />} />
          <Route path="blog" element={<AdminBlog />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="email" element={<AdminEmail />} />
          <Route path="whatsapp" element={<AdminWhatsApp />} />
        </Route>

        {/* Error Routes */}
        <Route path="/500" element={<Error500 />} />
        <Route path="*" element={<Error404 />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
