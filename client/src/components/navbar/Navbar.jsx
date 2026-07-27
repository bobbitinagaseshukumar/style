import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiShoppingBag, FiHeart, FiUser, FiMenu, FiSearch,
  FiBell, FiChevronDown, FiX, FiLogOut, FiSettings,
  FiPackage, FiGrid
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
  const cartItems = useSelector((state) => state.cart.items || []);
  const wishlistItems = useSelector((state) => state.wishlist?.items || []);
  const notifications = useSelector((state) => state.notifications?.unreadCount || 0);

  // Overlay state — Single Drawer Guarantee
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  // Dynamic Header Navigation & Settings
  const [navItems, setNavItems] = useState(DEFAULT_NAV_ITEMS);
  const [headerSettings, setHeaderSettings] = useState(null);

  const navigate = useNavigate();
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
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
    return () => document.removeEventListener('mousedown', handler);
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

  return (
    <>
      {/* ── Navbar Shell ──────────────────────────────────────── */}
      <nav className={`
        fixed top-0 left-0 right-0 z-40 transition-all duration-500
        ${scrolled
          ? 'bg-[#0D0D0D]/95 backdrop-blur-2xl shadow-[0_4px_32px_rgba(0,0,0,0.5)] border-b border-white/5'
          : 'bg-gradient-to-b from-[#0D0D0D]/90 to-transparent backdrop-blur-md border-b border-white/5'
        }
      `}>
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
            <Link to="/" className="flex items-center gap-2 group">
              <motion.span
                className="font-serif text-xl sm:text-2xl font-bold text-white"
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                  Style
                </span>
                <span>Verse</span>
              </motion.span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <div
                  key={item.title}
                  className="relative"
                  onMouseEnter={() => item.megaKey ? openMega(item.megaKey) : null}
                  onMouseLeave={() => item.megaKey ? closeMega() : null}
                >
                  <Link
                    to={item.link}
                    className={`
                      flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 group
                      ${activeMegaMenu === item.megaKey
                        ? 'text-yellow-400'
                        : 'text-white/70 hover:text-white'}
                    `}
                  >
                    {item.title}
                    {item.subcategories?.length > 0 && (
                      <motion.span
                        animate={{ rotate: activeMegaMenu === item.megaKey ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <FiChevronDown size={12} className="opacity-60" />
                      </motion.span>
                    )}
                  </Link>
                </div>
              ))}
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-0.5 sm:gap-2">

              {/* Live Search Icon Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => openDrawer('search')}
                className="p-2.5 rounded-xl text-white/70 hover:text-yellow-400 hover:bg-white/5 transition-all cursor-pointer"
                aria-label="Search"
              >
                <FiSearch className="w-[18px] h-[18px]" />
              </motion.button>

              {/* Wishlist */}
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

              {/* Cart Drawer Icon Button */}
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

              {/* Notifications */}
              {isAuthenticated && (
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Link
                    to="/notifications"
                    className="relative p-2.5 rounded-xl text-white/70 hover:text-yellow-400 hover:bg-white/5 transition-all flex"
                    aria-label="Notifications"
                  >
                    <FiBell className="w-[18px] h-[18px]" />
                    {notifications > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-yellow-400 text-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        {notifications}
                      </span>
                    )}
                  </Link>
                </motion.div>
              )}

              {/* User Account Menu */}
              <div className="relative" ref={userMenuRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
                  aria-label="Account menu"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black text-xs font-bold shadow">
                    {isAuthenticated ? (user?.fullName?.[0] || 'U') : <FiUser size={14} />}
                  </div>
                </motion.button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 mt-2 w-56 bg-[#111111] border border-white/10 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.6)] overflow-hidden z-50"
                    >
                      {isAuthenticated ? (
                        <>
                          <div className="px-4 py-3 border-b border-white/5">
                            <p className="text-sm font-bold text-white truncate">{user?.fullName || user?.name}</p>
                            <p className="text-xs text-white/40 truncate">{user?.email}</p>
                          </div>
                          {[
                            { label: 'Dashboard', icon: FiGrid, path: '/dashboard' },
                            { label: 'My Orders', icon: FiPackage, path: '/orders' },
                            { label: 'Profile', icon: FiUser, path: '/profile' },
                            { label: 'Notifications', icon: FiBell, path: '/notifications' },
                          ].map((item) => (
                            <Link
                              key={item.label}
                              onClick={() => setIsUserMenuOpen(false)}
                              to={item.path}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                            >
                              <item.icon size={14} className="text-yellow-400/70" />
                              {item.label}
                            </Link>
                          ))}
                          <div className="border-t border-white/5 mt-1" />
                          {user?.role === 'ADMIN' && (
                            <Link
                              onClick={() => setIsUserMenuOpen(false)}
                              to="/admin/dashboard"
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-yellow-400 hover:bg-yellow-400/5 transition-colors"
                            >
                              <FiSettings size={14} />
                              Super Admin Panel
                            </Link>
                          )}
                          <button
                            onClick={() => { logout(); setIsUserMenuOpen(false); }}
                            className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/5 transition-colors cursor-pointer"
                          >
                            <FiLogOut size={14} />
                            Logout
                          </button>
                        </>
                      ) : (
                        <div className="p-3 space-y-2">
                          <Link
                            to="/login"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block w-full py-2.5 text-center rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-sm font-bold hover:from-yellow-400 transition-all cursor-pointer"
                          >
                            Sign In (3D Login)
                          </Link>
                          <Link
                            to="/login?mode=register"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block w-full py-2.5 text-center rounded-xl border border-white/10 text-white/70 text-sm font-medium hover:bg-white/5 transition-all cursor-pointer"
                          >
                            Create Account
                          </Link>
                          <div className="border-t border-white/5 pt-2 mt-1">
                            <Link
                              to="/admin/login"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="block w-full py-2 text-center text-xs font-bold text-yellow-400/90 hover:text-yellow-400 hover:underline transition-all"
                            >
                              🔒 Admin Portal Login
                            </Link>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
