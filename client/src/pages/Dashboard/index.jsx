import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import {
  FiUser, FiPackage, FiHeart, FiMapPin, FiBell,
  FiStar, FiTag, FiFileText, FiRefreshCw, FiDownload,
  FiSettings, FiShield, FiTrash2, FiClock, FiEye,
  FiShoppingBag, FiChevronRight, FiLogOut
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

/* ─── Tab Components (lazy) ──────────────────────────────────── */
import ProfileTab from './ProfileTab';
import OrdersTab from './OrdersTab';
import AddressTab from './AddressTab';
import NotificationsTab from './NotificationsTab';
import RewardsTab from './RewardsTab';
import SettingsTab from './SettingsTab';

/* ─── Sidebar Navigation ─────────────────────────────────────── */
const NAV_ITEMS = [
  { key: 'profile', label: 'My Profile', icon: FiUser, description: 'Personal info & avatar' },
  { key: 'orders', label: 'My Orders', icon: FiPackage, description: 'Track & manage orders' },
  { key: 'wishlist', label: 'Wishlist', icon: FiHeart, description: 'Saved products', link: '/wishlist' },
  { key: 'addresses', label: 'Addresses', icon: FiMapPin, description: 'Delivery addresses' },
  { key: 'notifications', label: 'Notifications', icon: FiBell, description: 'Alerts & updates' },
  { key: 'rewards', label: 'Reward Points', icon: FiStar, description: 'Loyalty points & coins' },
  { key: 'coupons', label: 'My Coupons', icon: FiTag, description: 'Discount codes', link: null },
  { key: 'reviews', label: 'My Reviews', icon: FiStar, description: 'Product reviews', link: null },
  { key: 'returns', label: 'Returns', icon: FiRefreshCw, description: 'Return requests', link: null },
  { key: 'invoices', label: 'Invoices', icon: FiFileText, description: 'Download invoices', link: null },
  { key: 'recently-viewed', label: 'Recently Viewed', icon: FiEye, description: 'Browsing history', link: '/orders' },
  { key: 'settings', label: 'Settings', icon: FiSettings, description: 'Account preferences' },
];

/* ─── Placeholder Tab ────────────────────────────────────────── */
const ComingSoonTab = ({ label, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 flex items-center justify-center mb-4">
      <Icon size={28} className="text-yellow-400" />
    </div>
    <h3 className="text-white font-bold text-xl mb-2">{label}</h3>
    <p className="text-white/40 text-sm max-w-xs">
      This section is coming soon. We're working on building it for you.
    </p>
  </div>
);

/* ─── Main Dashboard ─────────────────────────────────────────── */
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [mobileNav, setMobileNav] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (mobileNav) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileNav]);

  const renderTab = () => {
    switch (activeTab) {
      case 'profile': return <ProfileTab />;
      case 'orders': return <OrdersTab />;
      case 'addresses': return <AddressTab />;
      case 'notifications': return <NotificationsTab />;
      case 'rewards': return <RewardsTab />;
      case 'settings': return <SettingsTab />;
      default:
        const item = NAV_ITEMS.find(i => i.key === activeTab);
        return <ComingSoonTab label={item?.label || activeTab} icon={item?.icon || FiUser} />;
    }
  };

  const handleNav = (item) => {
    if (item.key) setActiveTab(item.key);
    setMobileNav(false);
    document.body.style.overflow = '';
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Subtle grid background */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-white/40 text-sm mb-1">Welcome back,</p>
            <h1 className="text-3xl font-bold text-white">
              {user?.fullName || user?.name || 'Customer'} 
              <span className="ml-2 text-yellow-400">✦</span>
            </h1>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-white/50 hover:text-yellow-400 transition-colors"
          >
            <FiShoppingBag size={14} />
            Continue Shopping
          </Link>
        </div>

        {/* Mobile Nav Toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setMobileNav(!mobileNav)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white/70 w-full"
          >
            <FiUser size={14} className="text-yellow-400" />
            <span>
              {NAV_ITEMS.find(i => i.key === activeTab)?.label || 'Menu'}
            </span>
            <FiChevronRight size={14} className={`ml-auto transition-transform ${mobileNav ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {/* Mobile sidebar backdrop */}
        {mobileNav && (
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setMobileNav(false)}
          />
        )}

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className={`
            ${mobileNav ? 'block' : 'hidden'} lg:block
            w-full lg:w-64 flex-shrink-0
            ${mobileNav ? 'absolute left-4 right-4 z-40 top-auto' : ''}
          `}>
            <div className={`border rounded-2xl overflow-hidden sticky top-24 ${mobileNav ? 'bg-[#141414] border-yellow-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-xl' : 'bg-white/3 border-white/8'}`}>
              {/* User Card */}
              <div className="p-4 border-b border-white/5 bg-gradient-to-r from-yellow-400/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-bold text-lg shadow-lg">
                    {user?.fullName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-white text-sm truncate">{user?.fullName || 'Customer'}</p>
                    <p className="text-white/40 text-xs truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Nav Items */}
              <nav className="p-2">
                {NAV_ITEMS.map((item) => {
                  const isActive = activeTab === item.key;
                  const content = (
                    <motion.button
                      key={item.key}
                      whileHover={{ x: 4 }}
                      onClick={() => handleNav(item)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200
                        ${isActive
                          ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                          : 'text-white/50 hover:text-white hover:bg-white/5'}
                      `}
                    >
                      <item.icon size={15} className={isActive ? 'text-yellow-400' : ''} />
                      <span className="text-sm font-medium">{item.label}</span>
                      {isActive && <FiChevronRight size={12} className="ml-auto text-yellow-400/60" />}
                    </motion.button>
                  );

                  if (item.link) {
                    return (
                      <Link key={item.key} to={item.link} onClick={() => { setMobileNav(false); document.body.style.overflow = ''; }}>
                        {content}
                      </Link>
                    );
                  }
                  return content;
                })}

                {/* Logout */}
                <div className="border-t border-white/5 mt-2 pt-2">
                  <motion.button
                    whileHover={{ x: 4 }}
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-all text-sm font-medium"
                  >
                    <FiLogOut size={15} />
                    Logout
                  </motion.button>
                </div>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white/3 border border-white/8 rounded-2xl min-h-[500px] overflow-hidden"
              >
                {renderTab()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
