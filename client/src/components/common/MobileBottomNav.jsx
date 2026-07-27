import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import {
  FiHome, FiGrid, FiSearch, FiHeart, FiShoppingBag,
  FiPackage, FiUser, FiTag, FiPercent, FiBell, FiStar, FiBookmark
} from 'react-icons/fi';
import api from '../../config/api';

// Icon Map for dynamic database icons
const iconMap = {
  FiHome, FiGrid, FiSearch, FiHeart, FiShoppingBag,
  FiPackage, FiUser, FiTag, FiPercent, FiBell, FiStar, FiBookmark
};

/**
 * Amazon / Myntra / Flipkart style Mobile Bottom Navigation
 * Visible ONLY on Mobile/Tablet screens (< 768px).
 * Dynamically driven from API (`/api/cms/mobile-nav`).
 */
const MobileBottomNav = () => {
  const [navItems, setNavItems] = useState([]);
  const location = useLocation();

  const { items: cartItems } = useSelector((state) => state.cart || { items: [] });
  const { items: wishlistItems } = useSelector((state) => state.wishlist || { items: [] });

  const cartCount = cartItems?.reduce((sum, i) => sum + (i.quantity || 1), 0) || 0;
  const wishlistCount = wishlistItems?.length || 0;

  useEffect(() => {
    const fetchNavItems = async () => {
      try {
        const response = await api.get('/cms/mobile-nav');
        if (response.data?.success && Array.isArray(response.data.data)) {
          const activeOnly = response.data.data
            .filter(item => item.isActive !== false)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          setNavItems(activeOnly);
        }
      } catch (err) {
        console.warn('Failed to fetch mobile bottom nav items, using default fallback:', err);
        // Fallback default navigation if API fails
        setNavItems([
          { id: '1', label: 'Home', path: '/', icon: 'FiHome', badgeType: 'NONE' },
          { id: '2', label: 'Categories', path: '/categories', icon: 'FiGrid', badgeType: 'NONE' },
          { id: '3', label: 'Search', path: '/search', icon: 'FiSearch', badgeType: 'NONE' },
          { id: '4', label: 'Wishlist', path: '/wishlist', icon: 'FiHeart', badgeType: 'WISHLIST' },
          { id: '5', label: 'Cart', path: '/cart', icon: 'FiShoppingBag', badgeType: 'CART' },
          { id: '6', label: 'Orders', path: '/orders', icon: 'FiPackage', badgeType: 'NONE' },
          { id: '7', label: 'Profile', path: '/profile', icon: 'FiUser', badgeType: 'NONE' },
        ]);
      }
    };

    fetchNavItems();
  }, []);

  if (navItems.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0D0D0D]/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.4)] pb-safe">
      <div className="flex items-center justify-around h-15 px-1">
        {navItems.map((item) => {
          const IconComponent = iconMap[item.icon] || FiHome;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

          let badgeCount = 0;
          if (item.badgeType === 'CART') badgeCount = cartCount;
          if (item.badgeType === 'WISHLIST') badgeCount = wishlistCount;

          return (
            <NavLink
              key={item.id || item.label}
              to={item.path}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 ${
                isActive ? 'text-amber-400' : 'text-white/60 hover:text-white'
              }`}
            >
              <div className="relative p-1">
                <IconComponent className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                
                {/* Dynamic Notification Badge */}
                {badgeCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-2 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md border border-black"
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </motion.span>
                )}
              </div>

              <span className={`text-[10px] font-medium tracking-tight mt-0.5 ${isActive ? 'font-bold text-amber-400' : ''}`}>
                {item.label}
              </span>

              {/* Active Indicator Bar */}
              {isActive && (
                <motion.div
                  layoutId="activeBottomNav"
                  className="absolute top-0 w-6 h-0.5 bg-gradient-to-r from-amber-400 to-yellow-600 rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
