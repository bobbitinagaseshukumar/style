import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiChevronRight, FiHome, FiGrid, FiUser, FiShoppingBag, FiHeart, FiLogOut, FiPackage } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';

const MobileMenu = ({ isOpen, onClose }) => {
  const { categories } = useSelector((state) => state.category);
  const { isAuthenticated, user, logout } = useAuth();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const mainLinks = [
    { name: 'Home', path: '/', icon: FiHome },
    { name: 'All Categories', path: '/categories', icon: FiGrid },
    { name: 'Wishlist', path: '/wishlist', icon: FiHeart },
    { name: 'Cart', path: '/cart', icon: FiShoppingBag },
  ];

  const accountLinks = isAuthenticated
    ? [
        { name: 'My Dashboard', path: '/dashboard', icon: FiUser },
        { name: 'My Orders', path: '/orders', icon: FiPackage },
        { name: 'Profile', path: '/profile', icon: FiUser },
      ]
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 lg:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-y-0 left-0 w-[300px] max-w-[85vw] bg-[#0D0D0D] z-50 flex flex-col h-full lg:hidden shadow-2xl"
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-bold text-sm">
                  S
                </div>
                <span className="text-lg font-bold text-white">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Style</span>
                  <span>Verse</span>
                </span>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer">
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {/* Main Links */}
              {mainLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <link.icon className="w-5 h-5 text-yellow-400/70" />
                  <span className="text-sm font-medium">{link.name}</span>
                </Link>
              ))}

              {/* Categories Section */}
              {categories?.length > 0 && (
                <div className="pt-4 mt-2 border-t border-white/10">
                  <p className="px-3 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Shop by Category</p>
                  {categories.slice(0, 10).map((cat) => (
                    <Link
                      key={cat.id || cat._id}
                      to={`/categories/${cat.slug}`}
                      onClick={onClose}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <span className="text-sm">{cat.name}</span>
                      <FiChevronRight className="h-3.5 w-3.5 text-white/20" />
                    </Link>
                  ))}
                </div>
              )}

              {/* Account Links */}
              {accountLinks.length > 0 && (
                <div className="pt-4 mt-2 border-t border-white/10">
                  <p className="px-3 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">My Account</p>
                  {accountLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <link.icon className="w-4 h-4 text-yellow-400/70" />
                      <span className="text-sm">{link.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </nav>

            {/* Bottom Auth Area */}
            <div className="p-4 border-t border-white/10 space-y-2">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 mb-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black text-sm font-bold">
                      {user?.fullName?.[0] || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{user?.fullName || user?.name}</p>
                      <p className="text-[11px] text-white/40 truncate">{user?.email}</p>
                    </div>
                  </div>
                  {user?.role === 'ADMIN' && (
                    <Link
                      to="/admin/dashboard"
                      onClick={onClose}
                      className="block w-full py-2.5 text-center rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-sm font-bold hover:bg-yellow-400/20 transition"
                    >
                      🔒 Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); onClose(); }}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-red-400 text-sm font-medium hover:bg-red-500/10 transition cursor-pointer"
                  >
                    <FiLogOut className="w-4 h-4" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={onClose}
                    className="block w-full py-3 text-center rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-sm font-bold hover:from-yellow-400 transition shadow-lg"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/login?mode=register"
                    onClick={onClose}
                    className="block w-full py-2.5 text-center rounded-xl border border-white/10 text-white/70 text-sm font-medium hover:bg-white/5 transition"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
