import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome, FiBox, FiGrid, FiShoppingBag, FiUsers, FiTag,
  FiSettings, FiFileText, FiImage, FiLayout, FiHelpCircle,
  FiBarChart2, FiMenu, FiX, FiLogOut, FiChevronRight, FiMail,
  FiZap, FiLayers
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

const sidebarLinks = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: FiHome },
  { path: '/admin/products', label: 'Products', icon: FiBox },
  { path: '/admin/categories', label: 'Categories', icon: FiGrid },
  { path: '/admin/orders', label: 'Orders', icon: FiShoppingBag },
  { path: '/admin/customers', label: 'Customers', icon: FiUsers },
  { path: '/admin/coupons', label: 'Coupons', icon: FiTag },
  { path: '/admin/flash-sale', label: 'Flash Sales', icon: FiZap },
  { path: '/admin/special-deals', label: 'Special Deals', icon: FiTag },
  { path: '/admin/collections', label: 'Collections', icon: FiLayers },
  { path: '/admin/banners', label: 'Banners', icon: FiImage },
  { path: '/admin/homepage', label: 'Homepage', icon: FiLayout },
  { path: '/admin/cms', label: 'CMS Pages', icon: FiFileText },
  { path: '/admin/faqs', label: 'FAQs', icon: FiHelpCircle },
  { path: '/admin/analytics', label: 'Analytics', icon: FiBarChart2 },
  { path: '/admin/email', label: 'Email', icon: FiMail },
  { path: '/admin/whatsapp', label: 'WhatsApp', icon: FaWhatsapp },
  { path: '/admin/settings', label: 'Settings', icon: FiSettings },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const location = useLocation();

  const currentPage = sidebarLinks.find(l => location.pathname.startsWith(l.path))?.label || 'Dashboard';

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 260 : 76 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col bg-charcoal-900 text-white relative z-20 shadow-2xl"
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-4 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-charcoal-900 font-bold text-lg shrink-0">
            S
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="ml-3 text-xl font-serif font-bold text-gold-500 whitespace-nowrap"
              >
                StyleVerse
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 scrollbar-thin">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path || (link.path === '/admin/dashboard' && location.pathname === '/admin');
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-gold-500/20 to-gold-500/5 text-gold-400 shadow-lg shadow-gold-500/5'
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
                      className="text-sm font-medium whitespace-nowrap"
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
        </nav>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition"
          >
            {sidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            {sidebarOpen && <span className="text-sm">Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
              onClick={() => setMobileSidebar(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-charcoal-900 text-white z-40 lg:hidden shadow-2xl flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-charcoal-900 font-bold text-lg">
                    S
                  </div>
                  <span className="text-xl font-serif font-bold text-gold-500">StyleVerse</span>
                </div>
                <button onClick={() => setMobileSidebar(false)} className="text-gray-400 hover:text-white">
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                {sidebarLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileSidebar(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-gold-500/20 to-gold-500/5 text-gold-400'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="text-sm font-medium">{link.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebar(true)}
              className="lg:hidden text-gray-600 hover:text-charcoal-900"
            >
              <FiMenu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-charcoal-900">{currentPage}</h1>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white text-sm font-bold">
                A
              </div>
              <span className="text-sm font-medium text-charcoal-800">Admin</span>
            </div>
            <a href="/" className="text-gray-400 hover:text-red-500 transition" title="Back to Store">
              <FiLogOut className="w-5 h-5" />
            </a>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-3 sm:p-5 lg:p-6 bg-gray-100 flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full flex-1 flex flex-col"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
