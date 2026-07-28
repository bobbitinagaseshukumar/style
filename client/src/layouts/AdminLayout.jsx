import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome, FiBox, FiGrid, FiShoppingBag, FiUsers, FiTag,
  FiSettings, FiFileText, FiImage, FiLayout, FiHelpCircle,
  FiBarChart2, FiMenu, FiX, FiLogOut, FiChevronRight, FiMail,
  FiZap, FiLayers, FiShield, FiUser, FiSliders, FiCheckCircle,
  FiCpu, FiLock, FiExternalLink, FiChevronDown, FiBell, FiSearch,
  FiArchive, FiStar, FiEdit3
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../redux/auth/authSlice';
import { toast } from 'react-toastify';

const sidebarGroups = [
  {
    title: 'Main',
    links: [
      { path: '/admin/dashboard', label: 'Dashboard', icon: FiHome },
    ]
  },
  {
    title: 'Commerce',
    links: [
      { path: '/admin/products', label: 'Products', icon: FiBox },
      { path: '/admin/categories', label: 'Categories', icon: FiGrid },
      { path: '/admin/subcategories', label: 'Subcategories', icon: FiLayers },
      { path: '/admin/orders', label: 'Orders', icon: FiShoppingBag },
      { path: '/admin/customers', label: 'Customers', icon: FiUsers },
      { path: '/admin/inventory', label: 'Inventory', icon: FiArchive },
      { path: '/admin/coupons', label: 'Coupons', icon: FiTag },
    ]
  },
  {
    title: 'Marketing',
    links: [
      { path: '/admin/flash-sale', label: 'Flash Sales', icon: FiZap },
      { path: '/admin/special-deals', label: 'Special Deals', icon: FiStar },
      { path: '/admin/collections', label: 'Collections', icon: FiLayers },
      { path: '/admin/banners', label: 'Banners', icon: FiImage },
      { path: '/admin/email', label: 'Email Campaigns', icon: FiMail },
      { path: '/admin/whatsapp', label: 'WhatsApp', icon: FaWhatsapp },
    ]
  },
  {
    title: 'Content',
    links: [
      { path: '/admin/homepage', label: 'Homepage', icon: FiLayout },
      { path: '/admin/cms', label: 'CMS Pages', icon: FiFileText },
      { path: '/admin/faqs', label: 'FAQs', icon: FiHelpCircle },
      { path: '/admin/blog', label: 'Blog', icon: FiEdit3 },
    ]
  },
  {
    title: 'Management',
    links: [
      { path: '/admin/team', label: 'Admin Team & Roles', icon: FiShield },
      { path: '/admin/profile', label: 'My Security Profile', icon: FiUser },
      { path: '/admin/auth-form-management', label: 'Auth Form Builder', icon: FiSliders },
      { path: '/admin/social-proof-management', label: 'Social Proof Manager', icon: FiCheckCircle },
      { path: '/admin/chatbot-settings', label: 'AI Chatbot Settings', icon: FiCpu },
    ]
  },
  {
    title: 'System',
    links: [
      { path: '/admin/analytics', label: 'Analytics', icon: FiBarChart2 },
      { path: '/admin/settings', label: 'Settings', icon: FiSettings },
    ]
  }
];

/**
 * Enterprise Admin Dashboard Layout
 * Guarantees zero page merging / overlapping by using key={location.pathname} unmounting,
 * single-dropdown z-index management, body scroll locking on mobile drawers, and scroll reset on route change.
 */
const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const profileMenuRef = useRef(null);
  const mainContentRef = useRef(null);

  const { user } = useSelector((state) => state.auth || {});

  // 1. Lock body scroll on mobile sidebar drawer open
  useEffect(() => {
    if (mobileSidebar) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebar]);

  // 2. Auto-close dropdowns & reset scroll position on route change
  useEffect(() => {
    setMobileSidebar(false);
    setProfileDropdownOpen(false);
    document.body.style.overflow = '';
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  // 3. Click-outside and Escape key listener for Profile Dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setProfileDropdownOpen(false);
        setMobileSidebar(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser());
    localStorage.removeItem('adminToken');
    toast.info('Logged out of Admin Portal');
    navigate('/admin/login');
  };

  const flattenLinks = sidebarGroups.flatMap(group => group.links);
  const currentPage = flattenLinks.find(l => l.path !== '#' && location.pathname.startsWith(l.path))?.label || 'Dashboard';
  const adminName = user?.fullName || 'Super Admin';
  const adminAvatarInitial = adminName.charAt(0).toUpperCase();

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  }).format(new Date());

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans select-none">
      {/* DESKTOP SIDEBAR */}
      <motion.aside
        animate={{ width: sidebarOpen ? 260 : 76 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col bg-[#0D0D12] text-white relative z-20 shadow-2xl border-r border-white/10"
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-4 border-b border-white/10 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center text-black font-black text-lg shrink-0 shadow-lg">
            S
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="ml-3 text-xl font-serif font-bold text-gold-400 whitespace-nowrap"
              >
                StyleVerse
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6 scrollbar-thin">
          {sidebarGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-1">
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-4 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {group.title}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {group.links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path || (link.path === '/admin/dashboard' && location.pathname === '/admin');
                return (
                  <NavLink
                    key={link.label}
                    to={link.path}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-gold-500/20 to-gold-500/5 text-gold-400 shadow-md border border-gold-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-gold-400' : 'text-gray-500 group-hover:text-gold-400'}`} />
                    <AnimatePresence>
                      {sidebarOpen && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-xs font-semibold whitespace-nowrap"
                        >
                          {link.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {isActive && sidebarOpen && (
                      <FiChevronRight className="ml-auto w-4 h-4 text-gold-400" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-white/10 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition"
          >
            {sidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            {sidebarOpen && <span className="text-xs font-bold">Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* MOBILE SIDEBAR DRAWER & OVERLAY */}
      <AnimatePresence>
        {mobileSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileSidebar(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-[#0D0D12] text-white z-50 lg:hidden shadow-2xl flex flex-col border-r border-white/10"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center text-black font-black text-lg">
                    S
                  </div>
                  <span className="text-xl font-serif font-bold text-gold-400">StyleVerse Admin</span>
                </div>
                <button onClick={() => setMobileSidebar(false)} className="text-gray-400 hover:text-white p-1">
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6 pb-20 sm:pb-safe">
                {sidebarGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="space-y-1">
                    <div className="px-4 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      {group.title}
                    </div>
                    {group.links.map((link) => {
                      const Icon = link.icon;
                      const isActive = location.pathname === link.path || (link.path === '/admin/dashboard' && location.pathname === '/admin');
                      return (
                        <NavLink
                          key={link.label}
                          to={link.path}
                          onClick={() => setMobileSidebar(false)}
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 min-h-[44px] ${
                            isActive
                              ? 'bg-gradient-to-r from-gold-500/20 to-gold-500/5 text-gold-400 border border-gold-500/30'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Icon className="w-5 h-5 shrink-0" />
                          <span className="text-[13px] font-semibold">{link.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                ))}
                
                <div className="mt-8 text-center text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                  Powered by StyleVerse
                </div>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP HEADER BAR */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shadow-sm shrink-0 relative z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebar(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900 p-2 -ml-2 rounded-lg hover:bg-gray-100"
              aria-label="Open Admin Navigation"
            >
              <FiMenu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">{currentPage}</h1>
              <p className="text-[10px] text-gray-400 font-medium hidden sm:block">StyleVerse Admin Control Center</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Search Input - Decorative */}
            <div className="hidden md:flex items-center bg-gray-100 rounded-xl px-3 py-1.5 border border-transparent focus-within:border-gold-300 focus-within:bg-white focus-within:shadow-sm transition-all w-64">
              <FiSearch className="text-gray-400 w-4 h-4 mr-2" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none outline-none text-xs w-full text-gray-700 placeholder-gray-400" 
              />
            </div>

            {/* Date Display */}
            <div className="hidden lg:block text-xs font-semibold text-gray-500 mr-2">
              {formattedDate}
            </div>

            {/* Notification Bell */}
            <button className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition">
              <FiBell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 border-2 border-white rounded-full"></span>
            </button>

            {/* Storefront Link */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition"
              title="Open Customer Storefront in New Tab"
            >
              <FiExternalLink className="w-3.5 h-3.5" /> Storefront
            </a>

            {/* ADMIN PROFILE AVATAR DROPDOWN */}
            <div className="relative ml-2" ref={profileMenuRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 transition cursor-pointer border border-transparent hover:border-gray-200"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-black font-black text-sm flex items-center justify-center shadow-md">
                  {adminAvatarInitial}
                </div>
                <div className="hidden sm:block text-left mr-1">
                  <p className="text-xs font-bold text-gray-900 leading-tight">{adminName}</p>
                  <p className="text-[10px] text-amber-600 font-extrabold uppercase">Super Admin</p>
                </div>
                <FiChevronDown className={`hidden sm:block w-4 h-4 text-gray-500 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* SINGLE DROPDOWN PANEL */}
              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1"
                  >
                    <div className="px-3 py-3 border-b border-gray-100 mb-1">
                      <p className="font-bold text-gray-900 text-sm">{adminName}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user?.email || 'admin@styleverse.com'}</p>
                      <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        SUPER ADMIN
                      </div>
                    </div>

                    <NavLink
                      to="/admin/account-settings"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold transition"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <FiUser className="w-4 h-4 text-gray-400" /> My Account
                    </NavLink>
                    
                    <NavLink
                      to="/admin/profile"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold transition"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <FiShield className="w-4 h-4 text-gray-400" /> Security Profile
                    </NavLink>

                    <NavLink
                      to="/admin/security"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold transition"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <FiLock className="w-4 h-4 text-gray-400" /> Change Password
                    </NavLink>

                    <div className="border-t border-gray-100 my-1"></div>

                    <NavLink
                      to="/admin/team"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold transition"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <FiUsers className="w-4 h-4 text-gray-400" /> Team & Roles
                    </NavLink>

                    <NavLink
                      to="/admin/settings"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold transition"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <FiSettings className="w-4 h-4 text-gray-400" /> Store Settings
                    </NavLink>

                    <div className="border-t border-gray-100 pt-1 mt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-bold transition cursor-pointer"
                      >
                        <FiLogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* SINGLE-PAGE ISOLATED CONTENT CONTAINER (Unmounts previous page completely) */}
        <main ref={mainContentRef} className="flex-1 overflow-auto p-3 sm:p-5 lg:p-6 bg-gray-50 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1 flex flex-col"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
