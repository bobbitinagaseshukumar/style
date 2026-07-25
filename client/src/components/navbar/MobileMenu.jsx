import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiChevronRight } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { NAV_LINKS } from '../../constants';

const MobileMenu = ({ isOpen, onClose }) => {
  const { categories } = useSelector((state) => state.category);
  const { isAuthenticated, logout } = useAuth();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-charcoal-900/60 z-50 lg:hidden"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-y-0 left-0 w-[280px] bg-white z-50 flex flex-col h-full lg:hidden overflow-y-auto"
          >
            <div className="p-4 flex items-center justify-between border-b">
              <span className="font-playfair text-2xl font-bold text-charcoal-900">Menu</span>
              <button onClick={onClose} className="p-2 -mr-2 text-gray-500 hover:text-gray-700">
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-6">
              <ul className="space-y-4">
                {NAV_LINKS.map((link) => (
                  <li key={link.name}>
                    <Link 
                      to={link.path} 
                      onClick={onClose}
                      className="text-lg font-medium text-gray-900 flex justify-between items-center"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Categories</h3>
                <ul className="space-y-3">
                  {categories?.map((cat) => (
                    <li key={cat._id}>
                      <Link 
                        to={`/categories/${cat.slug}`}
                        onClick={onClose}
                        className="text-base text-gray-600 hover:text-gold-500 flex justify-between items-center"
                      >
                        {cat.name}
                        <FiChevronRight className="h-4 w-4" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>

            <div className="border-t p-4 bg-gray-50">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <Link to="/profile" onClick={onClose} className="block w-full py-2 text-center text-charcoal-900 font-medium bg-white border rounded">My Profile</Link>
                  <button onClick={() => { logout(); onClose(); }} className="block w-full py-2 text-center text-red-600 font-medium">Logout</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link to="/login" onClick={onClose} className="block w-full py-2 text-center text-white font-medium bg-gold-500 rounded hover:bg-gold-600">Log In</Link>
                  <Link to="/register" onClick={onClose} className="block w-full py-2 text-center text-charcoal-900 font-medium bg-white border rounded">Sign Up</Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
