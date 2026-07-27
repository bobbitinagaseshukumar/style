import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSmartphone, FiPlus, FiTrash2, FiEdit2, FiArrowUp, FiArrowDown,
  FiCheck, FiX, FiRefreshCw, FiHome, FiGrid, FiSearch, FiHeart,
  FiShoppingBag, FiPackage, FiUser, FiTag, FiPercent, FiBell, FiStar, FiBookmark
} from 'react-icons/fi';
import api from '../../config/api';
import { toast } from 'react-toastify';

const availableIcons = [
  { name: 'FiHome', label: 'Home', icon: FiHome },
  { name: 'FiGrid', label: 'Categories / Grid', icon: FiGrid },
  { name: 'FiSearch', label: 'Search', icon: FiSearch },
  { name: 'FiHeart', label: 'Wishlist / Heart', icon: FiHeart },
  { name: 'FiShoppingBag', label: 'Cart / Bag', icon: FiShoppingBag },
  { name: 'FiPackage', label: 'Orders / Package', icon: FiPackage },
  { name: 'FiUser', label: 'Profile / User', icon: FiUser },
  { name: 'FiTag', label: 'Offers / Tag', icon: FiTag },
  { name: 'FiPercent', label: 'Deals / Percent', icon: FiPercent },
  { name: 'FiBell', label: 'Notifications', icon: FiBell },
  { name: 'FiStar', label: 'Featured / Star', icon: FiStar },
  { name: 'FiBookmark', label: 'Saved / Bookmark', icon: FiBookmark },
];

const MobileNavigationManager = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    label: '',
    path: '/',
    icon: 'FiHome',
    badgeType: 'NONE',
    isActive: true,
  });

  const fetchNavItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cms/mobile-nav');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setItems(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load mobile navigation items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNavItems();
  }, []);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({ label: '', path: '/', icon: 'FiHome', badgeType: 'NONE', isActive: true });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      path: item.path,
      icon: item.icon,
      badgeType: item.badgeType || 'NONE',
      isActive: item.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!formData.label || !formData.path) {
      toast.error('Label and Destination Path are required');
      return;
    }

    try {
      if (editingItem) {
        await api.put(`/cms/mobile-nav/${editingItem.id}`, formData);
        toast.success('Mobile navigation item updated!');
      } else {
        await api.post('/cms/mobile-nav', { ...formData, sortOrder: items.length });
        toast.success('New navigation item added!');
      }
      setIsModalOpen(false);
      fetchNavItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save navigation item');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this navigation item?')) return;
    try {
      await api.delete(`/cms/mobile-nav/${id}`);
      toast.success('Item deleted');
      fetchNavItems();
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  const handleMove = async (index, direction) => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    // Swap items
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    // Update sortOrder
    const reordered = newItems.map((item, idx) => ({ ...item, sortOrder: idx }));
    setItems(reordered);

    try {
      await api.put('/cms/mobile-nav/reorder', {
        items: reordered.map((item) => ({ id: item.id, sortOrder: item.sortOrder })),
      });
      toast.success('Navigation order updated live!');
    } catch (err) {
      toast.error('Failed to update navigation order');
      fetchNavItems();
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await api.put(`/cms/mobile-nav/${item.id}`, { isActive: !item.isActive });
      toast.success(`${item.label} ${!item.isActive ? 'Enabled' : 'Disabled'}`);
      fetchNavItems();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-charcoal-900 border border-gold-500/20 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 text-gold-400 font-bold text-lg">
            <FiSmartphone className="w-6 h-6" />
            <span>Mobile Bottom Navigation Management</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Control the fixed bottom navigation bar on mobile phones. Drag/move to reorder positions. Live database sync.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-black font-bold text-sm hover:from-gold-400 shadow-lg flex items-center gap-2 transition"
        >
          <FiPlus className="w-4 h-4" /> Add Nav Item
        </button>
      </div>

      {/* Nav List */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <FiRefreshCw className="w-8 h-8 text-gold-400 animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm space-y-1 p-3">
          {items.map((item, index) => {
            const iconObj = availableIcons.find((i) => i.name === item.icon);
            const IconComp = iconObj?.icon || FiHome;

            return (
              <motion.div
                key={item.id}
                layout
                className={`flex items-center justify-between p-4 rounded-xl border transition ${
                  item.isActive ? 'bg-gray-50 border-gray-200 hover:border-gold-500/50' : 'bg-gray-100 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Position Badge */}
                  <span className="w-7 h-7 rounded-lg bg-gray-900 text-gold-400 text-xs font-black flex items-center justify-center shadow">
                    #{index + 1}
                  </span>

                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 text-amber-600 flex items-center justify-center">
                    <IconComp className="w-5 h-5" />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      {item.label}
                      {item.badgeType !== 'NONE' && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-extrabold uppercase">
                          Badge: {item.badgeType}
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{item.path}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Reorder Buttons */}
                  <button
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:pointer-events-none transition"
                    title="Move Up"
                  >
                    <FiArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === items.length - 1}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:pointer-events-none transition"
                    title="Move Down"
                  >
                    <FiArrowDown className="w-4 h-4" />
                  </button>

                  {/* Active Toggle Switch */}
                  <button
                    onClick={() => handleToggleActive(item)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {item.isActive ? 'Active' : 'Disabled'}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                    title="Edit Item"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                    title="Delete Item"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Item Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100"
            >
              <div className="px-6 py-4 bg-charcoal-900 border-b border-white/10 flex items-center justify-between text-white">
                <h3 className="font-bold text-base text-gold-400">
                  {editingItem ? 'Edit Navigation Item' : 'Add New Navigation Item'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Item Label
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Home, Categories, Offers"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Destination Path / URL
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. / , /categories , /cart , /orders"
                    value={formData.path}
                    onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Choose Icon
                  </label>
                  <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-xl bg-gray-50">
                    {availableIcons.map((i) => {
                      const IconComponent = i.icon;
                      const isSelected = formData.icon === i.name;
                      return (
                        <button
                          key={i.name}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon: i.name })}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition ${
                            isSelected
                              ? 'bg-charcoal-900 border-gold-500 text-gold-400 shadow-md'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <IconComponent className="w-5 h-5 mb-1" />
                          <span className="text-[10px] font-semibold text-center line-clamp-1">{i.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Notification Badge Type
                  </label>
                  <select
                    value={formData.badgeType}
                    onChange={(e) => setFormData({ ...formData, badgeType: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 text-sm"
                  >
                    <option value="NONE">No Badge</option>
                    <option value="CART">Cart Count Badge</option>
                    <option value="WISHLIST">Wishlist Count Badge</option>
                    <option value="NOTIFICATIONS">Unread Notifications Badge</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-black font-bold text-sm hover:from-gold-400 shadow-lg"
                  >
                    Save Navigation Item
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileNavigationManager;
