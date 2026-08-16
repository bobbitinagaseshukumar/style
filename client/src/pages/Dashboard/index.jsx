import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser, FiPackage, FiHeart, FiMapPin, FiBell,
  FiStar, FiTag, FiFileText, FiRefreshCw, FiEye,
  FiSettings, FiShoppingBag, FiChevronRight, FiLogOut,
  FiMenu, FiX, FiShield
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';

/* ─── Tab Components ─────────────────────────────────────────── */
import ProfileTab from './ProfileTab';
import OrdersTab from './OrdersTab';
import AddressTab from './AddressTab';
import NotificationsTab from './NotificationsTab';
import RewardsTab from './RewardsTab';
import SettingsTab from './SettingsTab';

/* ─── Navigation Grouped Config (Matching Super Admin) ───────── */
const NAV_GROUPS = [
  {
    title: 'Main Account',
    items: [
      { key: 'profile', label: 'My Profile', icon: FiUser, description: 'Personal info & avatar' },
      { key: 'orders', label: 'My Orders', icon: FiPackage, description: 'Track & manage orders' },
      { key: 'addresses', label: 'Addresses', icon: FiMapPin, description: 'Delivery addresses' },
    ]
  },
  {
    title: 'Shopping & Rewards',
    items: [
      { key: 'wishlist', label: 'Wishlist', icon: FiHeart, description: 'Saved products', link: '/wishlist' },
      { key: 'rewards', label: 'Reward Points', icon: FiStar, description: 'Loyalty points & coins' },
      { key: 'coupons', label: 'My Coupons', icon: FiTag, description: 'Discount codes', link: null },
      { key: 'recently-viewed', label: 'Recently Viewed', icon: FiEye, description: 'Browsing history', link: '/orders' },
    ]
  },
  {
    title: 'Account Tools & Settings',
    items: [
      { key: 'notifications', label: 'Notifications', icon: FiBell, description: 'Alerts & updates' },
      { key: 'reviews', label: 'My Reviews', icon: FiStar, description: 'Product reviews', link: null },
      { key: 'returns', label: 'Returns', icon: FiRefreshCw, description: 'Return requests', link: null },
      { key: 'invoices', label: 'Invoices', icon: FiFileText, description: 'Download invoices', link: null },
      { key: 'settings', label: 'Settings', icon: FiSettings, description: 'Account preferences' },
    ]
  }
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items);

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

/* ─── Main Customer Dashboard (Super Admin Dashboard Parity) ── */
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [mobileNav, setMobileNav] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = (user?.fullName || user?.name || user?.email?.split('@')[0] || 'Customer').trim();
  const displayInitial = displayName.charAt(0).toUpperCase() || 'C';

  const mobileNavRef = useRef(null);
  const mobileDrawerScrollPos = useRef(0);

  // Lock body scroll & restore drawer scroll position on open
  useEffect(() => {
    if (mobileNav) {
      document.body.style.overflow = 'hidden';
      if (mobileNavRef.current) {
        mobileNavRef.current.scrollTop = mobileDrawerScrollPos.current;
        setTimeout(() => {
          if (mobileNavRef.current) {
            const activeEl = mobileNavRef.current.querySelector('.border-yellow-400\\/30');
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
        const item = ALL_NAV_ITEMS.find(i => i.key === activeTab);
        return <ComingSoonTab label={item?.label || activeTab} icon={item?.icon || FiUser} />;
    }
  };

  const handleNav = (item) => {
    setMobileNav(false);
    document.body.style.overflow = '';
    if (item.link) {
      navigate(item.link);
    } else if (item.key) {
      setActiveTab(item.key);
    }
  };

  const activeItem = ALL_NAV_ITEMS.find(i => i.key === activeTab) || ALL_NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Subtle background grid */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* MOBILE SIDEBAR DRAWER & OVERLAY (Exact Super Admin Portal Match) */}
      {mobileNav && (
        <>
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileNav(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-[280px] bg-[#0D0D12] text-white z-50 lg:hidden shadow-2xl flex flex-col border-r border-white/10">
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-bold text-base shadow">
                  {displayInitial}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-white truncate max-w-[150px]">{displayName}</p>
                  <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider">Customer Portal</p>
                </div>
              </div>
              <button onClick={() => setMobileNav(false)} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <nav
              ref={mobileNavRef}
              onScroll={(e) => { mobileDrawerScrollPos.current = e.target.scrollTop; }}
              className="flex-1 overflow-y-auto py-4 px-2 space-y-6 pb-20 sm:pb-safe"
            >
              {NAV_GROUPS.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-1">
                  <div className="px-3 mb-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                    {group.title}
                  </div>
                  {group.items.map((item) => {
                    const isActive = activeTab === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleNav(item)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer min-h-[46px] ${
                          isActive
                            ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 font-bold'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <item.icon size={16} className={isActive ? 'text-yellow-400 shrink-0' : 'text-white/40 shrink-0'} />
                        <span className="text-xs font-semibold">{item.label}</span>
                        {isActive && <FiChevronRight size={12} className="ml-auto text-yellow-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))}
              
              <div className="border-t border-white/10 pt-3 mt-4">
                <button
                  onClick={() => { setMobileNav(false); logout(); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-xs font-bold cursor-pointer"
                >
                  <FiLogOut size={16} className="shrink-0" />
                  Logout
                </button>
              </div>
            </nav>
          </aside>
        </>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 relative z-10">
        {/* TOP HEADER BAR (Sticky Top Parity with Super Admin Layout) */}
        <header className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 mb-6 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNav(true)}
              className="lg:hidden text-white/80 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
              aria-label="Open Customer Menu"
            >
              <FiMenu className="w-5 h-5 text-yellow-400" />
            </button>
            <div>
              <h1 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
                {activeItem.label}
                <span className="text-xs text-yellow-400 font-normal hidden sm:inline">✦ Customer Portal</span>
              </h1>
              <p className="text-[10px] text-white/40 hidden sm:block">{activeItem.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 text-xs font-bold transition cursor-pointer"
            >
              <FiShoppingBag className="text-yellow-400" /> <span className="hidden xs:inline">Storefront</span>
            </Link>
          </div>
        </header>

        {/* MAIN BODY: Desktop Left Sidebar + Right Content Area */}
        <div className="flex gap-6">
          {/* DESKTOP LEFT SIDEBAR */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden sticky top-24 shadow-xl">
              {/* User Profile Card Header */}
              <div className="p-4 border-b border-white/5 bg-gradient-to-r from-yellow-400/10 via-transparent to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-bold text-base shadow">
                    {displayInitial}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-white text-sm truncate">{displayName}</p>
                    <p className="text-white/40 text-xs truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Grouped Sidebar Items */}
              <nav className="p-3 space-y-4">
                {NAV_GROUPS.map((group, groupIndex) => (
                  <div key={groupIndex} className="space-y-1">
                    <p className="px-3 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">{group.title}</p>
                    {group.items.map((item) => {
                      const isActive = activeTab === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => handleNav(item)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                            isActive
                              ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 font-bold'
                              : 'text-white/50 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <item.icon size={15} className={isActive ? 'text-yellow-400 shrink-0' : 'shrink-0'} />
                          <span className="text-sm font-medium">{item.label}</span>
                          {isActive && <FiChevronRight size={12} className="ml-auto text-yellow-400/70 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                ))}

                {/* Logout Button */}
                <div className="border-t border-white/5 pt-2 mt-2">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm font-semibold cursor-pointer"
                  >
                    <FiLogOut size={15} className="shrink-0" />
                    Logout
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          {/* RIGHT MAIN CONTENT DISPLAY */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white/3 border border-white/8 rounded-2xl min-h-[500px] overflow-hidden shadow-xl"
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
