import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiArrowUp, FiArrowDown,
  FiSearch, FiMenu, FiLink, FiFolder, FiCheck
} from 'react-icons/fi';
import api from '../../config/api';

const HeaderMenuManager = () => {
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    link: '',
    categoryId: '',
    icon: '',
    status: 'PUBLISHED',
    isActive: true,
    sortOrder: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [menuRes, catRes] = await Promise.allSettled([
        api.get('/cms/header-menus/admin/all'),
        api.get('/categories'),
      ]);

      if (menuRes.status === 'fulfilled' && menuRes.value.data?.success) {
        setMenus(menuRes.value.data.data || []);
      }
      if (catRes.status === 'fulfilled' && catRes.value.data?.data) {
        setCategories(catRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load header menus:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      slug: '',
      link: '',
      categoryId: '',
      icon: '',
      status: 'PUBLISHED',
      isActive: true,
      sortOrder: menus.length,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setFormData({
      title: item.title || '',
      slug: item.slug || '',
      link: item.link || '',
      categoryId: item.categoryId || '',
      icon: item.icon || '',
      status: item.status || 'PUBLISHED',
      isActive: item.isActive !== false,
      sortOrder: item.sortOrder || 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return alert('Menu Title is required');

    try {
      if (editingId) {
        await api.put(`/cms/header-menus/${editingId}`, formData);
      } else {
        await api.post('/cms/header-menus', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save header menu:', err);
      alert('Failed to save header menu');
    }
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED';
    try {
      await api.put(`/cms/header-menus/${item.id}`, { status: nextStatus, isActive: nextStatus === 'PUBLISHED' });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete header menu "${item.title}"?`)) return;
    try {
      await api.delete(`/cms/header-menus/${item.id}`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete header menu:', err);
    }
  };

  const handleMoveSort = async (index, direction) => {
    const newMenus = [...menus];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newMenus.length) return;

    const temp = newMenus[index];
    newMenus[index] = newMenus[targetIndex];
    newMenus[targetIndex] = temp;

    const items = newMenus.map((m, idx) => ({ id: m.id, sortOrder: idx }));
    setMenus(newMenus);

    try {
      await api.put('/cms/header-menus/reorder', { items });
    } catch (err) {
      console.error('Failed to reorder header menus:', err);
    }
  };

  const filteredMenus = menus.filter((m) =>
    m.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-charcoal-900 border border-gold-500/30 p-6 rounded-3xl shadow-2xl">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-gold-400">Header Navigation CMS</span>
          <h1 className="text-2xl font-serif font-bold text-white mt-1">Header Menu Manager</h1>
          <p className="text-xs text-gray-400 mt-1">
            Add, rename, reorder, and link header navigation items directly from the Admin Panel.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gold-500 hover:bg-gold-400 text-charcoal-900 font-extrabold text-xs transition-all shadow-lg cursor-pointer"
        >
          <FiPlus className="w-4 h-4" /> + Add Header Menu
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search header menus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500"
          />
        </div>
        <span className="text-xs text-gray-500 font-semibold px-3 py-1 bg-gray-50 rounded-lg">
          Total: {menus.length} Menus
        </span>
      </div>

      {/* Menu Cards List */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
          <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-500">Loading Header Menus...</p>
        </div>
      ) : filteredMenus.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 space-y-3">
          <FiMenu className="w-10 h-10 text-gold-500 mx-auto opacity-50" />
          <h3 className="text-base font-bold text-gray-800">No Header Menus Created Yet</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            Click "+ Add Header Menu" to create custom navbar navigation menus.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMenus.map((item, idx) => {
            const linkedCat = categories.find((c) => c.id === item.categoryId);

            return (
              <motion.div
                key={item.id}
                layout
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gold-50 text-gold-600 flex items-center justify-center font-bold text-sm border border-gold-200">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-charcoal-900">{item.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                        item.status === 'PUBLISHED' ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                      {linkedCat ? (
                        <span className="flex items-center gap-1 text-gold-600 font-semibold">
                          <FiFolder className="w-3 h-3" /> Category: {linkedCat.name}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-500">
                          <FiLink className="w-3 h-3" /> Link: {item.link || `/categories/${item.slug}`}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleMoveSort(idx, -1)}
                    disabled={idx === 0}
                    title="Move Up"
                    className="p-2 rounded-xl bg-gray-50 border text-gray-600 hover:text-gold-600 disabled:opacity-30 cursor-pointer"
                  >
                    <FiArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveSort(idx, 1)}
                    disabled={idx === filteredMenus.length - 1}
                    title="Move Down"
                    className="p-2 rounded-xl bg-gray-50 border text-gray-600 hover:text-gold-600 disabled:opacity-30 cursor-pointer"
                  >
                    <FiArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleToggleStatus(item)}
                    title={item.status === 'PUBLISHED' ? 'Hide Menu' : 'Publish Menu'}
                    className="p-2 rounded-xl bg-gray-50 border text-gray-600 hover:text-blue-600 cursor-pointer ml-2"
                  >
                    {item.status === 'PUBLISHED' ? <FiEyeOff className="w-3.5 h-3.5 text-emerald-600" /> : <FiEye className="w-3.5 h-3.5 text-gray-400" />}
                  </button>

                  <button
                    onClick={() => openEditModal(item)}
                    title="Edit Menu"
                    className="p-2 rounded-xl bg-gold-50 border border-gold-200 text-gold-700 hover:bg-gold-100 cursor-pointer"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(item)}
                    title="Delete Menu"
                    className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 cursor-pointer"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="bg-charcoal-900 p-5 text-white flex items-center justify-between">
                <h3 className="font-serif font-bold text-lg">
                  {editingId ? 'Edit Header Menu' : 'Add Header Menu'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                    Menu Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Women, Men, Jewellery, Offers, Festive..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                    Link to Existing Category (Optional)
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500"
                  >
                    <option value="">No Category Link (Custom Link)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                    Custom Link URL (If no Category selected)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /offers or /categories/women"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value, isActive: e.target.value === 'PUBLISHED' })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500"
                  >
                    <option value="PUBLISHED">Published (Visible in Navbar)</option>
                    <option value="DRAFT">Draft</option>
                    <option value="HIDDEN">Hidden</option>
                  </select>
                </div>

                <div className="pt-3 flex justify-end gap-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gold-500 text-charcoal-900 font-extrabold text-xs hover:bg-gold-400 transition cursor-pointer"
                  >
                    {editingId ? 'Save Changes' : 'Create Header Menu'}
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

export default HeaderMenuManager;
