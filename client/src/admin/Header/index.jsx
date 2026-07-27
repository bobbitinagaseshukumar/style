import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiSliders, FiSave, FiCheck, FiRefreshCw, FiEye, FiEyeOff,
  FiLayout, FiMessageSquare, FiSearch, FiHeart, FiShoppingBag, FiUser, FiBell
} from 'react-icons/fi';
import api from '../../config/api';
import { toast } from 'react-toastify';

const HeaderManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    logoUrl: '',
    announcementText: '',
    announcementBgColor: '#121212',
    announcementTextColor: '#D4AF37',
    announcementLink: '/offers',
    announcementEnabled: true,
    stickyHeader: true,
    searchVisible: true,
    notificationVisible: true,
    wishlistVisible: true,
    cartVisible: true,
    profileVisible: true,
    headerBgColor: '#0D0D0D',
    headerTextColor: '#FFFFFF',
  });

  const fetchHeaderSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cms/header-settings');
      if (res.data?.success && res.data.data) {
        setFormData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load header settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeaderSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put('/cms/header-settings', formData);
      toast.success('Header settings updated live across storefront!');
    } catch (err) {
      toast.error('Failed to save header settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-charcoal-900 border border-gold-500/20 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 text-gold-400 font-bold text-lg">
            <FiSliders className="w-6 h-6" />
            <span>Header & Navigation Bar Management</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Control the storefront header, announcement bar, logo, icon visibilities, and colors. Saved to database.
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-black font-bold text-sm hover:from-gold-400 shadow-lg flex items-center gap-2 transition disabled:opacity-50"
        >
          {saving ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiSave className="w-4 h-4" />}
          Save All Settings
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <FiRefreshCw className="w-8 h-8 text-gold-400 animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Announcement Bar Section */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <FiMessageSquare className="w-4 h-4 text-amber-600" /> Announcement Top Bar
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-bold text-gray-600">Enabled</span>
                <input
                  type="checkbox"
                  checked={formData.announcementEnabled}
                  onChange={(e) => setFormData({ ...formData, announcementEnabled: e.target.checked })}
                  className="w-4 h-4 accent-amber-600 rounded"
                />
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Announcement Message Text
                </label>
                <input
                  type="text"
                  placeholder="✨ FREE EXPRESS SHIPPING ON ALL ORDERS..."
                  value={formData.announcementText || ''}
                  onChange={(e) => setFormData({ ...formData, announcementText: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Announcement Link URL
                  </label>
                  <input
                    type="text"
                    value={formData.announcementLink || ''}
                    onChange={(e) => setFormData({ ...formData, announcementLink: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.announcementBgColor || '#121212'}
                      onChange={(e) => setFormData({ ...formData, announcementBgColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 p-0.5"
                    />
                    <input
                      type="text"
                      value={formData.announcementBgColor || '#121212'}
                      onChange={(e) => setFormData({ ...formData, announcementBgColor: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Text Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.announcementTextColor || '#D4AF37'}
                      onChange={(e) => setFormData({ ...formData, announcementTextColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 p-0.5"
                    />
                    <input
                      type="text"
                      value={formData.announcementTextColor || '#D4AF37'}
                      onChange={(e) => setFormData({ ...formData, announcementTextColor: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Header Layout & Colors */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100 flex items-center gap-2">
              <FiLayout className="w-4 h-4 text-amber-600" /> Header Style & Behaviors
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Custom Logo URL (Leave blank for default text logo)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.logoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-mono"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Sticky Header</h4>
                  <p className="text-xs text-gray-500">Header stays fixed at top on scroll</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.stickyHeader}
                  onChange={(e) => setFormData({ ...formData, stickyHeader: e.target.checked })}
                  className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Header Icons Visibility Control */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100">
              Header Action Icons Visibility
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { label: 'Search Bar Icon', key: 'searchVisible', icon: FiSearch },
                { label: 'Notifications Icon', key: 'notificationVisible', icon: FiBell },
                { label: 'Wishlist Icon', key: 'wishlistVisible', icon: FiHeart },
                { label: 'Cart Icon', key: 'cartVisible', icon: FiShoppingBag },
                { label: 'User Profile Icon', key: 'profileVisible', icon: FiUser },
              ].map((item) => {
                const IconComp = item.icon;
                const isVisible = formData[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => setFormData({ ...formData, [item.key]: !isVisible })}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition select-none ${
                      isVisible ? 'bg-amber-50/60 border-amber-300' : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComp className="w-5 h-5 text-amber-600" />
                      <span className="text-sm font-bold text-gray-900">{item.label}</span>
                    </div>
                    {isVisible ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1">
                        <FiEye className="w-3.5 h-3.5" /> Visible
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center gap-1">
                        <FiEyeOff className="w-3.5 h-3.5" /> Hidden
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default HeaderManager;
