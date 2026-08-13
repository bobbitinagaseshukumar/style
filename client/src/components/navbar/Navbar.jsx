import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiShoppingBag, FiHeart, FiUser, FiMenu, FiSearch,
  FiBell, FiChevronDown, FiX, FiLogOut, FiSettings,
  FiPackage, FiGrid, FiMapPin, FiStar, FiGift, FiBookmark
} from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import SearchBar from './SearchBar';
import MegaMenu from './MegaMenu';
import MobileMenu from './MobileMenu';
import MiniCart from '../cart/MiniCart';
import SearchOverlay from './SearchOverlay';
import AuthDrawer from '../auth/AuthDrawer';
import api from '../../config/api';

const DEFAULT_NAV_ITEMS = [
  { title: 'Home', link: '/' },
  { title: 'Women', link: '/categories/women', megaKey: 'women' },
  { title: 'Men', link: '/categories/men', megaKey: 'men' },
  { title: 'Jewellery', link: '/categories/jewellery', megaKey: 'jewellery' },
  { title: 'Kids', link: '/categories/kids', megaKey: 'kids' },
];

const Navbar = () => {
  const { storeSettings } = useSelector((state) => state.settings);
  const { isAuthenticated, user, logout } = useAuth();
  const cartItems = useSelector((state) => state.cart?.items || []);
  const wishlistItems = useSelector((state) => state.wishlist?.items || []);
  const notificationsCount = useSelector((state) => state.notification?.unreadCount || 0);

  // Overlay state — Single Drawer Guarantee
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  // Dynamic Header Navigation & Settings
  const [navItems, setNavItems] = useState(DEFAULT_NAV_ITEMS);
  const [headerSettings, setHeaderSettings] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const cartCount = cartItems.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const megaMenuTimeout = useRef(null);

  // Helper to open a specific drawer and close all others
  const openDrawer = (drawerName) => {
    setIsMobileMenuOpen(drawerName === 'mobile');
    setIsSearchOpen(drawerName === 'search');
    setIsAuthOpen(drawerName === 'auth');
    setIsMiniCartOpen(drawerName === 'cart');
    setIsUserMenuOpen(false);
    setActiveMegaMenu(null);
  };

  /* ── Auto-close all drawers & unlock body scroll on route change ── */
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setIsAuthOpen(false);
    setIsMiniCartOpen(false);
    setIsUserMenuOpen(false);
    setActiveMegaMenu(null);
    document.body.style.overflow = '';
  }, [location.pathname]);

  /* ── Scroll detection ──────────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Fetch Dynamic Header Navigation & Settings ────────────── */
  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        const [menusRes, settingsRes] = await Promise.allSettled([
          api.get('/cms/header-menus/public'),
          api.get('/cms/header-settings')
        ]);

        if (menusRes.status === 'fulfilled' && menusRes.value.data?.data?.length > 0) {
          const formatted = menusRes.value.data.data.map(m => ({
            id: m.id,
            title: m.title,
            link: m.link || `/categories/${m.slug}`,
            megaKey: m.slug,
            subcategories: m.subcategories || []
          }));
          setNavItems([{ title: 'Home', link: '/' }, ...formatted]);
        }

        if (settingsRes.status === 'fulfilled' && settingsRes.value.data?.data) {
          setHeaderSettings(settingsRes.value.data.data);
        }
      } catch (err) {
        console.error('Failed to load dynamic header data:', err);
      }
    };
    fetchHeaderData();
  }, []);

  /* ── Close user menu on outside click ─────────────────────── */
  const userMenuRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, []);

  /* ── Mega Menu hover handlers ──────────────────────────────── */
  const openMega = (name) => {
    clearTimeout(megaMenuTimeout.current);
    setActiveMegaMenu(name);
  };
  const closeMega = () => {
    megaMenuTimeout.current = setTimeout(() => setActiveMegaMenu(null), 150);
  };
  const keepMega = () => clearTimeout(megaMenuTimeout.current);

  const announcementText = headerSettings?.announcementText || '✨ Special Offer: Free Express Delivery Across India on Orders Above ₹999 | Code: STYLEVERSE';
  const announcementEnabled = headerSettings?.announcementEnabled !== false && showAnnouncement;

  const userName = user?.fullName || user?.name || user?.email?.split('@')[0] || 'Valued Customer';
  const userAvatar = user?.avatar || user?.photo;
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      {/* ── Top Announcement Banner ────────────────────────────── */}
      <AnimatePresence>
        {announcementEnabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              backgroundColor: headerSettings?.announcementBgColor || '#121212',
              color: headerSettings?.announcementTextColor || '#D4AF37'
            }}
            className="fixed top-0 left-0 right-0 z-[52] px-4 py-1.5 text-xs font-bold text-center flex items-center justify-between border-b border-gold-500/20 shadow-sm"
          >
            <div className="flex-1 flex items-center justify-center gap-2">
              <FiStar className="w-3.5 h-3.5 animate-pulse shrink-0 text-yellow-400" />
              <span className="truncate max-w-[90vw]">{announcementText}</span>
            </div>
            <button
              onClick={() => setShowAnnouncement(false)}
              className="p-1 rounded-full hover:bg-white/10 transition text-current opacity-70 hover:opacity-100 cursor-pointer"
              aria-label="Dismiss Announcement"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navbar Shell ──────────────────────────────────────── */}
      <nav
        style={{
          top: announcementEnabled ? '28px' : '0px'
        }}
        className={`
          fixed left-0 right-0 z-50 transition-all duration-500
          ${scrolled
            ? 'bg-[#0D0D0D]/95 backdrop-blur-2xl shadow-[0_4px_32px_rgba(0,0,0,0.5)] border-b border-white/5'
            : 'bg-gradient-to-b from-[#0D0D0D]/90 to-transparent backdrop-blur-md border-b border-white/5'
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-14 sm:h-16' : 'h-16 sm:h-20'}`}>

            {/* Mobile Hamburger */}
            <button
              className="lg:hidden text-white/80 hover:text-yellow-400 transition-colors p-2 cursor-pointer"
              onClick={() => openDrawer('mobile')}
              aria-label="Open menu"
            >
              <FiMenu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group relative shine-sweep py-1">
              <motion.div
                whileHover={{ rotate: 12, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-300 flex items-center justify-center text-black font-black text-base shadow-lg shadow-yellow-500/20"
              >
                V
              </motion.div>
              <motion.span
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.2 }}
                className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center"
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 drop-shadow-sm">
                  Style
                </span>
                <span className="text-white/90">Verse</span>
              </motion.span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.link;
                return (
                  <div
                    key={item.title}
                    className="relative"
                    onMouseEnter={() => item.megaKey ? openMega(item.megaKey) : null}
                    onMouseLeave={() => item.megaKey ? closeMega() : null}
                  >
                    <Link
                      to={item.link}
                      className={`
                        relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group
                        hover:-translate-y-0.5 hover:scale-[1.03]
                        ${activeMegaMenu === item.megaKey || isActive
                          ? 'text-yellow-400 font-bold'
                          : 'text-white/80 hover:text-white'}
                      `}
                    >
                      <span>{item.title}</span>
                      {item.subcategories?.length > 0 && (
                        <motion.span
                          animate={{ rotate: activeMegaMenu === item.megaKey ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FiChevronDown size={12} className="opacity-70 group-hover:text-yellow-400 transition-colors" />
                        </motion.span>
                      )}
                      
                      {/* Animated Gold Underline Glow */}
                      {(isActive || activeMegaMenu === item.megaKey) && (
                        <motion.div
                          layoutId="navbar-underline"
                          className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.8)]"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-0.5 sm:gap-2">

              {/* Live Search Icon Button */}
              {headerSettings?.searchVisible !== false && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => openDrawer('search')}
                  className="p-2.5 rounded-xl text-white/70 hover:text-yellow-400 hover:bg-white/5 transition-all cursor-pointer"
                  aria-label="Search"
                >
                  <FiSearch className="w-[18px] h-[18px]" />
                </motion.button>
              )}

              {/* Wishlist */}
              {headerSettings?.wishlistVisible !== false && (
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Link
                    to="/wishlist"
                    className="relative p-2.5 rounded-xl text-white/70 hover:text-red-400 hover:bg-white/5 transition-all flex"
                    aria-label="Wishlist"
                  >
                    <FiHeart className="w-[18px] h-[18px]" />
                    <AnimatePresence>
                      {wishlistItems.length > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-lg"
                        >
                          {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </motion.div>
              )}

              {/* Cart Drawer Icon Button */}
              {headerSettings?.cartVisible !== false && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => openDrawer('cart')}
                  className="relative p-2.5 rounded-xl text-white/70 hover:text-yellow-400 hover:bg-white/5 transition-all cursor-pointer"
                  aria-label="Cart"
                >
                  <FiShoppingBag className="w-[18px] h-[18px]" />
                  <AnimatePresence>
                    {cartCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-0.5 -right-0.5 bg-yellow-400 text-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-lg"
                      >
                        {cartCount > 9 ? '9+' : cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              )}

              {/* Notifications */}
              {isAuthenticated && headerSettings?.notificationVisible !== false && (
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Link
                    to="/notifications"
                    className="relative p-2.5 rounded-xl text-white/70 hover:text-yellow-400 hover:bg-white/5 transition-all flex"
                    aria-label="Notifications"
                  >
                    <FiBell className="w-[18px] h-[18px]" />
                    {notificationsCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-yellow-400 text-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        {notificationsCount}
                      </span>
                    )}
                  </Link>
                </motion.div>
              )}

              {/* User Account Menu */}
              {headerSettings?.profileVisible !== false && (
                <div className="relative" ref={userMenuRef}>
                  {isAuthenticated ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setIsUserMenuOpen(!isUserMenuOpen);
                        setActiveMegaMenu(null);
                      }}
                      className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/10"
                      aria-label="Account menu"
                    >
                      {userAvatar ? (
                        <img
                          src={userAvatar}
                          alt={userName}
                          className="w-8 h-8 rounded-xl object-cover border border-yellow-400/50 shadow"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black text-xs font-bold shadow">
                          {userInitial}
                        </div>
                      )}
                      <span className="hidden sm:inline text-xs font-bold text-white/90 max-w-[100px] truncate">
                        {userName.split(' ')[0]}
                      </span>
                      <FiChevronDown size={13} className={`hidden sm:block text-white/60 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openDrawer('auth')}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black text-xs font-bold shadow-md transition-all cursor-pointer"
                      aria-label="Sign In"
                    >
                      <FiUser size={14} />
                      <span className="hidden sm:inline">Sign In</span>
                    </motion.button>
                  )}

                  {/* USER DROPDOWN MENU */}
                  <AnimatePresence>
                    {isAuthenticated && isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-60 bg-[#111111] border border-white/10 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.7)] overflow-hidden z-50 text-xs"
                      >
                        <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                          <p className="text-sm font-bold text-white truncate">{userName}</p>
                          <p className="text-xs text-white/50 truncate">{user?.email}</p>
                          <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-yellow-400/10 text-yellow-400 border border-yellow-400/30">
                            {user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? '⚡ ADMIN' : '⭐ CUSTOMER'}
                          </div>
                        </div>

                        <div className="py-1">
                          {[
                            { label: 'Dashboard', icon: FiGrid, path: '/dashboard' },
                            { label: 'My Orders', icon: FiPackage, path: '/orders' },
                            { label: 'Address Book', icon: FiMapPin, path: '/address-book' },
                            { label: 'Wishlist', icon: FiHeart, path: '/wishlist' },
                            { label: 'Profile Settings', icon: FiUser, path: '/profile' },
                            { label: 'Notifications', icon: FiBell, path: '/notifications' },
                          ].map((item) => (
                            <Link
                              key={item.label}
                              to={item.path}
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              <item.icon size={14} className="text-yellow-400/80 shrink-0" />
                              <span className="font-semibold">{item.label}</span>
                            </Link>
                          ))}
                        </div>

                        {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.isAdmin) && (
                          <div className="border-t border-white/10 py-1">
                            <Link
                              to="/admin/dashboard"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-yellow-400 hover:bg-yellow-400/10 font-bold transition-colors cursor-pointer"
                            >
                              <FiSettings size={14} className="shrink-0" />
                              Super Admin Panel
                            </Link>
                          </div>
                        )}

                        <div className="border-t border-white/10 p-1">
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              logout();
                            }}
                            className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 font-bold transition-colors cursor-pointer"
                          >
                            <FiLogOut size={14} className="shrink-0" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mega Menu Panel ───────────────────────────────────── */}
      <AnimatePresence>
        {activeMegaMenu && (
          <MegaMenu
            category={activeMegaMenu}
            onMouseEnter={keepMega}
            onMouseLeave={closeMega}
          />
        )}
      </AnimatePresence>

      {/* Backdrop when mega menu is open */}
      <AnimatePresence>
        {activeMegaMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
            style={{ top: scrolled ? '64px' : '80px' }}
            onClick={() => setActiveMegaMenu(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Auth Drawer (Sign In & Register) ── */}
      <AuthDrawer isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* ── Predictive Live Search Overlay ── */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* ── MiniCart Drawer ── */}
      <MiniCart isOpen={isMiniCartOpen} onClose={() => setIsMiniCartOpen(false)} />

      {/* ── Mobile Drawer ── */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
};

export default Navbar;
