import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome, FiBox, FiGrid, FiShoppingBag, FiUsers, FiTag,
  FiSettings, FiFileText, FiImage, FiLayout, FiHelpCircle,
  FiBarChart2, FiMenu, FiX, FiLogOut, FiChevronRight, FiMail,
  FiZap, FiLayers, FiShield, FiUser, FiSliders, FiCheckCircle,
  FiCpu, FiLock, FiExternalLink, FiChevronDown, FiBell, FiSearch,
  FiArchive, FiStar, FiEdit3, FiCheck, FiInfo, FiAlertCircle
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

const INITIAL_NOTIFICATIONS = [
  { id: 1, title: 'New Customer Order', time: '10m ago', text: 'Order #KVLR-1082 received for ₹2,499', unread: true },
  { id: 2, title: 'Inventory Alert', time: '1h ago', text: 'Silk Saree Blue Stock below 5 units', unread: true },
  { id: 3, title: 'Customer Registration', time: '2h ago', text: 'New customer account created via Google', unread: true },
];

/**
 * Enterprise Admin Dashboard Layout
 * Guarantees zero page merging / overlapping, working interactive header search quick-jump,
 * notification bell modal, smooth profile dropdown, body scroll locking, and scroll reset on route change.
 */
const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const profileMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);
  const searchRef = useRef(null);
  const mainContentRef = useRef(null);
  const mobileNavRef = useRef(null);
  const mobileDrawerScrollPos = useRef(0);

  const { user } = useSelector((state) => state.auth || {});

  // 1. Lock body scroll & preserve scroll position on mobile sidebar drawer open
  useEffect(() => {
    if (mobileSidebar) {
      document.body.style.overflow = 'hidden';
      if (mobileNavRef.current) {
        mobileNavRef.current.scrollTop = mobileDrawerScrollPos.current;
        setTimeout(() => {
          if (mobileNavRef.current) {
            const activeEl = mobileNavRef.current.querySelector('.border-gold-500\\/30');
            if (activeEl) {
              activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          }
        }, 30);
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebar]);

  // 2. Auto-close dropdowns & reset scroll position on route change
  useEffect(() => {
    setMobileSidebar(false);
    setProfileDropdownOpen(false);
    setNotificationOpen(false);
    setSearchOpen(false);
    setSearchQuery('');
    document.body.style.overflow = '';
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  // 3. Mousedown listener for outside click handling
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(e.target)) {
        setNotificationOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setProfileDropdownOpen(false);
        setNotificationOpen(false);
        setSearchOpen(false);
        setMobileSidebar(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
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

  const closeMobileDrawer = () => {
    setMobileSidebar(false);
    document.body.style.overflow = '';
  };

  // Filter search results
  const filteredSearchResults = searchQuery.trim()
    ? flattenLinks.filter(l => l.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const handleSelectSearch = (path) => {
    navigate(path);
    setSearchQuery('');
    setSearchOpen(false);
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    toast.success('All notifications marked as read');
  };

  const unreadNotificationCount = notifications.filter(n => n.unread).length;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* DESKTOP SIDEBAR */}
      <motion.aside
        animate={{ width: sidebarOpen ? 260 : 76 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col bg-[#0D0D12] text-white relative z-20 shadow-2xl border-r border-white/10"
      >
        {/* Logo Area */}
        <Link to="/" title="Go to Storefront Homepage" className="h-16 flex items-center px-4 border-b border-white/10 shrink-0 hover:opacity-90 transition cursor-pointer">
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
        </Link>

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
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
          >
            {sidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            {sidebarOpen && <span className="text-xs font-bold">Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* MOBILE SIDEBAR DRAWER & OVERLAY */}
      {mobileSidebar && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
            onClick={closeMobileDrawer}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-[280px] bg-[#0D0D12] text-white z-50 lg:hidden shadow-2xl flex flex-col border-r border-white/10">
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
              <Link to="/" onClick={closeMobileDrawer} title="Go to Storefront Homepage" className="flex items-center gap-3 hover:opacity-90 transition cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center text-black font-black text-lg">
                  S
                </div>
                <span className="text-xl font-serif font-bold text-gold-400">StyleVerse Admin</span>
              </Link>
              <button onClick={closeMobileDrawer} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <nav
              ref={mobileNavRef}
              onScroll={(e) => { mobileDrawerScrollPos.current = e.target.scrollTop; }}
              className="flex-1 overflow-y-auto py-4 px-2 space-y-6 pb-20 sm:pb-safe"
            >
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
                        onClick={closeMobileDrawer}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 min-h-[48px] cursor-pointer ${
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
          </aside>
        </>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP HEADER BAR */}
        <header className="h-16 bg-[#0A0A0E] border-b border-white/10 flex items-center justify-between px-4 lg:px-6 shadow-md shrink-0 sticky top-0 z-40 text-white">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebar(true)}
              className="lg:hidden text-gray-300 hover:text-white p-2 -ml-2 rounded-lg hover:bg-white/10 transition cursor-pointer"
              aria-label="Open Admin Navigation"
            >
              <FiMenu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">{currentPage}</h1>
              <p className="text-[10px] text-amber-400/80 font-medium hidden sm:block">KVLR Styles Admin Control Center</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Search Input with Live Quick-Jump Suggestions */}
            <div className="relative" ref={searchRef}>
              <div className="flex flex-1 sm:flex-none items-center bg-white/5 rounded-xl px-3 py-1.5 border border-white/10 focus-within:border-amber-500/50 focus-within:bg-black/40 transition-all max-w-[180px] sm:w-64">
                <FiSearch className="text-gray-400 w-4 h-4 mr-2 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search admin pages..." 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  className="bg-transparent border-none outline-none text-xs w-full text-white placeholder-gray-500" 
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setSearchOpen(false); }} className="text-gray-400 hover:text-white p-0.5">
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Jump Search Results Dropdown */}
              <AnimatePresence>
                {searchOpen && searchQuery.trim() && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute left-0 right-0 mt-2 bg-[#16161c] border border-white/10 rounded-xl shadow-2xl p-2 z-50 text-xs max-h-60 overflow-y-auto space-y-1"
                  >
                    {filteredSearchResults.length > 0 ? (
                      filteredSearchResults.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.path}
                            onClick={() => handleSelectSearch(item.path)}
                            className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                          >
                            <Icon className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="font-semibold">{item.label}</span>
                            <FiChevronRight className="ml-auto w-3.5 h-3.5 opacity-50" />
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-3 py-2.5 text-center text-gray-500">
                        No admin section found matching "{searchQuery}"
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Date Display */}
            <div className="hidden lg:block text-xs font-semibold text-gray-400 mr-2">
              {formattedDate}
            </div>

            {/* Notification Bell with Modal Panel */}
            <div className="relative" ref={notificationMenuRef}>
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                aria-label="Admin Notifications"
              >
                <FiBell className="w-5 h-5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 border-2 border-[#0A0A0E] rounded-full"></span>
                )}
              </button>

              {/* Notification Modal Panel */}
              <AnimatePresence>
                {notificationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl p-3 z-50 text-xs space-y-2 text-gray-900"
                  >
                    <div className="flex items-center justify-between px-2 pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-1.5 font-bold text-gray-900">
                        <FiBell className="w-4 h-4 text-amber-600" />
                        <span>System Notifications</span>
                      </div>
                      {unreadNotificationCount > 0 && (
                        <button
                          onClick={markAllNotificationsRead}
                          className="text-[10px] font-bold text-amber-700 hover:text-amber-800 transition cursor-pointer"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {notifications.map((item) => (
                        <div
                          key={item.id}
                          className={`p-2.5 rounded-xl border transition ${
                            item.unread ? 'bg-amber-50/60 border-amber-200/80' : 'bg-gray-50 border-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="font-bold text-gray-900 text-xs">{item.title}</p>
                            <span className="text-[10px] text-gray-400">{item.time}</span>
                          </div>
                          <p className="text-[11px] text-gray-600 leading-tight">{item.text}</p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-1 border-t border-gray-100 text-center">
                      <Link
                        to="/admin/orders"
                        onClick={() => setNotificationOpen(false)}
                        className="text-[11px] font-bold text-amber-700 hover:underline"
                      >
                        View Recent Customer Orders →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Storefront Link */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
              title="Open Customer Storefront in New Tab"
            >
              <FiExternalLink className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Storefront</span>
            </a>

            {/* ADMIN PROFILE AVATAR DROPDOWN */}
            <div className="relative ml-2" ref={profileMenuRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/10 transition cursor-pointer border border-transparent hover:border-white/10"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-black font-black text-sm flex items-center justify-center shadow-md">
                  {adminAvatarInitial}
                </div>
                <div className="hidden sm:block text-left mr-1">
                  <p className="text-xs font-bold text-white leading-tight">{adminName}</p>
                  <p className="text-[10px] text-amber-400 font-extrabold uppercase">Super Admin</p>
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
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold transition cursor-pointer"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <FiUser className="w-4 h-4 text-gray-400" /> My Account
                    </NavLink>
                    
                    <NavLink
                      to="/admin/profile"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold transition cursor-pointer"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <FiShield className="w-4 h-4 text-gray-400" /> Security Profile
                    </NavLink>

                    <NavLink
                      to="/admin/security"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold transition cursor-pointer"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <FiLock className="w-4 h-4 text-gray-400" /> Change Password
                    </NavLink>

                    <div className="border-t border-gray-100 my-1"></div>

                    <NavLink
                      to="/admin/team"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold transition cursor-pointer"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <FiUsers className="w-4 h-4 text-gray-400" /> Team & Roles
                    </NavLink>

                    <NavLink
                      to="/admin/settings"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold transition cursor-pointer"
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

        {/* SINGLE-PAGE ISOLATED CONTENT CONTAINER */}
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
