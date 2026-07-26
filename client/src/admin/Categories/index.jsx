import React, { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import api from '../../config/api';
import {
  FiTrash2, FiPlus, FiChevronDown, FiChevronRight,
  FiTag, FiGrid, FiEdit, FiAlertTriangle, FiX, FiCheck,
  FiHome, FiEye, FiSearch, FiSliders, FiArrowUpRight, FiLayers
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { AnimatePresence, motion } from 'framer-motion';
import CategoryDrawer from './CategoryDrawer';

/* ─── Subcategory Inline Form ──────────────────────────────────── */
const SubCategoryForm = ({ categoryId, onAdd, onCancel }) => {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Subcategory name required'); return; }
    try {
      setSaving(true);
      await onAdd(name.trim());
      setName('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-3 p-3 bg-gray-50 rounded-xl border border-dashed border-amber-300">
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Subcategory name (e.g. Banarasi Silks)..."
        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white font-medium"
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }}}
        autoFocus
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving || !name.trim()}
        className="px-3 py-1.5 rounded-lg bg-amber-400 text-black text-xs font-bold hover:bg-amber-500 transition disabled:opacity-50 flex items-center gap-1 cursor-pointer"
      >
        <FiCheck size={13} /> Add
      </button>
      <button type="button" onClick={onCancel} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition">
        <FiX size={13} />
      </button>
    </div>
  );
};

/* ─── Single Premium Category Card ────────────────────────────── */
const CategoryCard = ({ category, onDelete, onEdit, onToggleHomepage }) => {
  const [expanded, setExpanded] = useState(false);
  const [subs, setSubs] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);
  const [deletingSubId, setDeletingSubId] = useState(null);

  const loadSubs = async () => {
    if (subs.length > 0) return;
    try {
      setLoadingSubs(true);
      const { data } = await api.get(`/categories/${category.id}/subcategories`);
      setSubs(data.data || []);
    } catch {
      toast.error('Failed to load subcategories');
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) loadSubs();
  };

  const handleAddSub = async (name) => {
    try {
      const { data } = await api.post(`/categories/${category.id}/subcategories`, { name });
      setSubs(prev => [...prev, data.data]);
      setShowAddSub(false);
      toast.success(`"${name}" subcategory added!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add subcategory');
    }
  };

  const handleDeleteSub = async (sub) => {
    try {
      setDeletingSubId(sub.id);
      await api.delete(`/categories/subcategories/${sub.id}`);
      setSubs(prev => prev.filter(s => s.id !== sub.id));
      toast.success(`"${sub.name}" subcategory removed`);
    } catch {
      toast.error('Failed to delete subcategory');
    } finally {
      setDeletingSubId(null);
    }
  };

  const img = category.image
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(category.name)}&background=D4AF37&color=fff&size=200`;

  const bannerImg = category.banner;

  return (
    <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Category Media Header */}
      <div className="relative h-44 bg-slate-900 overflow-hidden">
        {bannerImg ? (
          <img src={bannerImg} alt="" className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-charcoal-900 via-charcoal-800 to-amber-950 opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Action Controls */}
        <div className="absolute top-3 right-3 flex gap-1.5 z-10">
          <button
            onClick={() => onEdit(category)}
            className="p-2 rounded-xl bg-white/90 text-blue-600 hover:bg-white transition shadow-md backdrop-blur-md cursor-pointer"
            title="Edit Category & Crop Images"
          >
            <FiEdit size={14} />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition shadow-md cursor-pointer"
            title="Delete Category Options"
          >
            <FiTrash2 size={14} />
          </button>
        </div>

        {/* Thumbnail & Name */}
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src={img} alt={category.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shrink-0 shadow-lg bg-gray-100" />
            <div className="min-w-0 text-white">
              <h3 className="font-bold text-base text-white truncate drop-shadow-md">{category.name}</h3>
              <p className="text-[11px] text-amber-300 font-mono">/{category.slug}</p>
            </div>
          </div>

          <span className="text-[10px] font-bold bg-black/60 text-amber-400 border border-amber-400/40 px-2.5 py-1 rounded-full backdrop-blur-md shrink-0">
            {category._count?.products || 0} Products
          </span>
        </div>
      </div>

      {/* Info & Badges */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{category.shortDesc || category.description || 'No description provided'}</p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
              (category.status || 'PUBLISHED') === 'PUBLISHED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-gray-100 text-gray-700 border-gray-200'
            }`}>
              {category.status || 'PUBLISHED'}
            </span>

            {category.isFeaturedCategory && (
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                ⭐ Featured
              </span>
            )}
            {category.isTrendingCategory && (
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                🔥 Trending
              </span>
            )}
          </div>
        </div>

        {/* Home Page Toggle & Subcategories Accordion */}
        <div className="space-y-2 border-t border-gray-100 pt-3">
          {/* Home Page Display Switch */}
          <button
            type="button"
            onClick={() => onToggleHomepage(category)}
            className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-between cursor-pointer ${
              category.showOnHomepage
                ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <FiHome className="text-amber-500" size={13} />
              {category.showOnHomepage ? 'Shown on Home Page' : 'Hidden from Home Page'}
            </span>
            <span className="text-[10px] underline">Toggle</span>
          </button>

          {/* Subcategories Accordion */}
          <button
            onClick={handleExpand}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 hover:bg-gray-100 transition cursor-pointer font-semibold"
          >
            <span className="flex items-center gap-2">
              <FiTag size={12} className="text-amber-500" />
              Subcategories
              {subs.length > 0 && (
                <span className="bg-amber-400 text-black text-[10px] font-bold px-1.5 py-0.2 rounded-full">{subs.length}</span>
              )}
            </span>
            {expanded ? <FiChevronDown size={13} /> : <FiChevronRight size={13} />}
          </button>

          {/* Subcategories Expansion Panel */}
          {expanded && (
            <div className="pt-2 space-y-2">
              {loadingSubs ? (
                <div className="text-[11px] text-gray-400 text-center py-2">Loading subcategories...</div>
              ) : (
                <>
                  {subs.length === 0 && !showAddSub && (
                    <p className="text-[11px] text-gray-400 text-center py-2 italic">No subcategories created yet</p>
                  )}
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {subs.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 group text-xs">
                        <span className="font-medium text-gray-700 truncate">{sub.name}</span>
                        <button
                          onClick={() => handleDeleteSub(sub)}
                          disabled={deletingSubId === sub.id}
                          className="p-1 rounded text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {showAddSub ? (
                    <SubCategoryForm
                      categoryId={category.id}
                      onAdd={handleAddSub}
                      onCancel={() => setShowAddSub(false)}
                    />
                  ) : (
                    <button
                      onClick={() => setShowAddSub(true)}
                      className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl border border-dashed border-amber-300 text-amber-700 text-xs font-bold hover:bg-amber-50 transition cursor-pointer"
                    >
                      <FiPlus size={12} /> Add Subcategory
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Main Admin Categories Module ────────────────────────────── */
const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteMode, setDeleteMode] = useState('DELETE_CATEGORY_ONLY'); // 'DELETE_CATEGORY_ONLY' | 'DELETE_ALL' | 'MOVE_PRODUCTS' | 'ARCHIVE'
  const [targetCatId, setTargetCatId] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/categories?includeAll=true');
      setCategories(data.data || []);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openAdd = () => { setEditingCategory(null); setDrawerOpen(true); };
  const openEdit = (cat) => { setEditingCategory(cat); setDrawerOpen(true); };

  // 1-Click Home Page Toggle
  const handleToggleHomepage = async (category) => {
    const newValue = !category.showOnHomepage;
    setCategories(prev => prev.map(c => c.id === category.id ? { ...c, showOnHomepage: newValue } : c));
    try {
      await api.put(`/categories/${category.id}`, { showOnHomepage: newValue });
      toast.success(newValue ? `"${category.name}" shown on Home Page` : `"${category.name}" removed from Home Page (still in Catalog)`);
    } catch {
      toast.error('Failed to update homepage visibility');
      fetchCategories();
    }
  };

  const handleOpenDelete = (category) => {
    setDeleteTarget(category);
    const prodCount = category._count?.products || 0;
    if (prodCount > 0) {
      setDeleteMode('MOVE_PRODUCTS');
      const available = categories.filter(c => c.id !== category.id);
      setTargetCatId(available.length > 0 ? available[0].id : '');
    } else {
      setDeleteMode('DELETE_CATEGORY_ONLY');
      setTargetCatId('');
    }
  };

  // Advanced Delete Handler
  const handleDeleteSubmit = async () => {
    if (!deleteTarget) return;
    const prodCount = deleteTarget._count?.products || 0;
    if (prodCount > 0 && deleteMode === 'MOVE_PRODUCTS' && !targetCatId) {
      toast.error('Please select a target category to transfer products.');
      return;
    }

    try {
      setDeleting(true);
      const { data } = await api.post(`/categories/${deleteTarget.id}/delete`, {
        deleteMode: prodCount > 0 ? deleteMode : 'DELETE_CATEGORY_ONLY',
        targetCategoryId: targetCatId || undefined
      });
      toast.success(data.message || 'Category deleted successfully');
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = categories.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management System</h1>
          <p className="text-sm text-gray-500">Device photo upload, built-in cropper, SEO settings & homepage visibility</p>
        </div>
        <Button icon={FiPlus} onClick={openAdd}>Create Category</Button>
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <FiX size={14} />
            </button>
          )}
        </div>

        <span className="text-xs font-bold text-gray-400">{filtered.length} categories</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading categories...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-gray-100 p-8">
          <p className="font-bold text-gray-700">No categories found</p>
          <p className="text-xs text-gray-400 mt-1">Click &quot;Create Category&quot; to upload device photos and set up categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(cat => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onDelete={handleOpenDelete}
              onEdit={openEdit}
              onToggleHomepage={handleToggleHomepage}
            />
          ))}
        </div>
      )}

      {/* ── Delete Options Modal ─────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                <FiAlertTriangle className="text-amber-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Remove Category</h3>
                <p className="text-xs text-gray-500">
                  {(deleteTarget._count?.products || 0) > 0 ? 'Product transfer required' : 'Confirm category deletion'}
                </p>
              </div>
            </div>

            {(deleteTarget._count?.products || 0) > 0 ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs">
                  <p className="font-bold text-amber-900 mb-1">
                    ⚠️ Category &quot;{deleteTarget.name}&quot; has {deleteTarget._count?.products} assigned product(s).
                  </p>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    Please select a target category to transfer these products before removing this category.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Target Category to Transfer Products *
                  </label>
                  <select
                    value={targetCatId}
                    onChange={e => setTargetCatId(e.target.value)}
                    className="w-full p-2.5 border border-amber-300 rounded-xl text-xs font-bold bg-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Select Destination Category --</option>
                    {categories.filter(c => c.id !== deleteTarget.id).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="deleteMode"
                      checked={deleteMode === 'MOVE_PRODUCTS'}
                      onChange={() => setDeleteMode('MOVE_PRODUCTS')}
                      className="text-amber-500 focus:ring-amber-400"
                    />
                    <div>
                      <p className="font-bold text-gray-900">Transfer Products & Remove Category</p>
                      <p className="text-[10px] text-gray-500">Safely moves all {deleteTarget._count?.products} products to target category</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-red-200 bg-red-50/40 cursor-pointer">
                    <input
                      type="radio"
                      name="deleteMode"
                      checked={deleteMode === 'DELETE_ALL'}
                      onChange={() => setDeleteMode('DELETE_ALL')}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <p className="font-bold text-red-900">Delete Category AND All Products</p>
                      <p className="text-[10px] text-red-600">Permanently deletes all {deleteTarget._count?.products} assigned products</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="deleteMode"
                      checked={deleteMode === 'ARCHIVE'}
                      onChange={() => setDeleteMode('ARCHIVE')}
                      className="text-amber-500 focus:ring-amber-400"
                    />
                    <div>
                      <p className="font-bold text-gray-900">Archive Category</p>
                      <p className="text-[10px] text-gray-500">Hides from website without deleting products</p>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-700 mb-5 bg-gray-50 border border-gray-100 rounded-2xl p-3.5">
                Are you sure you want to remove category <strong>&quot;{deleteTarget.name}&quot;</strong>? This action cannot be undone.
              </p>
            )}

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border text-gray-600 text-xs font-semibold hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={deleting || ((deleteTarget._count?.products || 0) > 0 && deleteMode === 'MOVE_PRODUCTS' && !targetCatId)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Processing...' : (deleteTarget._count?.products || 0) > 0 ? 'Transfer & Remove' : 'Remove Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Category Drawer ───────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <CategoryDrawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            editCategory={editingCategory}
            onSaved={fetchCategories}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCategories;
