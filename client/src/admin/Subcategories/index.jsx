import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  FiPlus, FiTrash2, FiEdit, FiSearch, FiX, FiCheck, FiFilter,
  FiEye, FiEyeOff, FiImage, FiRefreshCw, FiAlertTriangle, FiLayers,
  FiGrid, FiArrowUp, FiArrowDown, FiChevronRight, FiBox
} from 'react-icons/fi';
import api from '../../config/api';
import { formatDate } from '../../utils/formatDate';
import SubcategoryDrawer from './SubcategoryDrawer';

const AdminSubcategories = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('sortOrder');

  // Modal / Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteMode, setDeleteMode] = useState('TRANSFER'); // 'TRANSFER' | 'DELETE_ALL'
  const [targetSubId, setTargetSubId] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Fetch Parent Categories
  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories?includeAll=true');
      setCategories(res.data?.data || []);
    } catch {
      toast.error('Failed to load categories list');
    }
  };

  // Fetch Subcategories List
  const fetchSubcategories = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: search.trim() || undefined,
        categoryId: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        sortBy,
        sortOrder: 'asc'
      };

      const res = await api.get('/subcategories', { params });
      setSubcategories(res.data?.data || []);
    } catch {
      toast.error('Failed to load subcategories');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter, sortBy]);

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, [fetchSubcategories]);

  const openAdd = () => {
    setEditingSubcategory(null);
    setDrawerOpen(true);
  };

  const openEdit = (sub) => {
    setEditingSubcategory(sub);
    setDrawerOpen(true);
  };

  // Delete Click Handler
  const handleOpenDelete = (sub) => {
    setDeleteTarget(sub);
    const prodCount = sub._count?.products || 0;
    if (prodCount > 0) {
      setDeleteMode('TRANSFER');
      const available = subcategories.filter(s => s.id !== sub.id && s.categoryId === sub.categoryId);
      setTargetSubId(available.length > 0 ? available[0].id : '');
    } else {
      setDeleteMode('DELETE_ONLY');
      setTargetSubId('');
    }
  };

  // Confirm Delete Handler
  const handleDeleteSubmit = async () => {
    if (!deleteTarget) return;
    const prodCount = deleteTarget._count?.products || 0;

    if (prodCount > 0 && deleteMode === 'TRANSFER' && !targetSubId) {
      toast.error('Please select a target subcategory to transfer products.');
      return;
    }

    try {
      setDeleting(true);
      const { data } = await api.post(`/subcategories/${deleteTarget.id}/delete`, {
        deleteMode: prodCount > 0 ? deleteMode : 'DELETE_ONLY',
        targetSubCategoryId: targetSubId || undefined
      });
      toast.success(data.message || 'Subcategory deleted successfully!');
      setDeleteTarget(null);
      fetchSubcategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete subcategory');
    } finally {
      setDeleting(false);
    }
  };

  // Quick Visibility Toggle
  const handleToggleStatus = async (sub) => {
    const newStatus = sub.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED';
    setSubcategories(prev => prev.map(s => s.id === sub.id ? { ...s, status: newStatus } : s));
    try {
      await api.put(`/subcategories/${sub.id}`, { status: newStatus });
      toast.success(`Subcategory "${sub.name}" status updated to ${newStatus}`);
    } catch {
      toast.error('Failed to update subcategory status');
      fetchSubcategories();
    }
  };

  // Overall Stats
  const totalSubcategories = subcategories.length;
  const publishedSubcategories = subcategories.filter(s => s.status === 'PUBLISHED').length;
  const hiddenSubcategories = subcategories.filter(s => s.status === 'HIDDEN').length;
  const totalAssignedProducts = subcategories.reduce((sum, s) => sum + (s._count?.products || 0), 0);

  return (
    <div className="space-y-6">
      {/* ── Top Bar Header ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Independent Subcategory Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Amazon/Flipkart style subcategory system with parent binding & product counter</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSubcategories}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition cursor-pointer"
            title="Refresh List"
          >
            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs shadow-md transition cursor-pointer"
          >
            <FiPlus size={16} /> Add New Subcategory
          </button>
        </div>
      </div>

      {/* ── Stats Summary Banner ────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Subcategories', count: totalSubcategories, color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { label: 'Published (Visible)', count: publishedSubcategories, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Hidden (Disabled)', count: hiddenSubcategories, color: 'text-gray-600 bg-gray-100 border-gray-200' },
          { label: 'Assigned Products', count: `${totalAssignedProducts} Products`, color: 'text-amber-600 bg-amber-50 border-amber-200 font-bold' },
        ].map(stat => (
          <div key={stat.label} className={`p-4 rounded-2xl border shadow-sm ${stat.color}`}>
            <p className="text-2xl font-black">{stat.count}</p>
            <p className="text-[11px] font-bold opacity-80 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Search & Filter Controls ────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search subcategory by name, slug, or description..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
              <FiX size={14} />
            </button>
          )}
        </div>

        {/* Parent Category Filter Dropdown */}
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="w-full sm:w-56 p-2 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-amber-400"
        >
          <option value="ALL">All Parent Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-full sm:w-36 p-2 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-amber-400"
        >
          <option value="ALL">All Statuses</option>
          <option value="PUBLISHED">PUBLISHED</option>
          <option value="HIDDEN">HIDDEN</option>
        </select>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="w-full sm:w-40 p-2 text-xs font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none"
        >
          <option value="sortOrder">Sort by Display Order</option>
          <option value="name">Sort by Name</option>
          <option value="createdAt">Sort by Creation Date</option>
        </select>
      </div>

      {/* ── Subcategories Table ─────────────────────────────── */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 font-semibold bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <FiRefreshCw className="animate-spin w-8 h-8 mx-auto text-amber-500 mb-3" />
          Loading subcategories catalog...
        </div>
      ) : subcategories.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-gray-100 p-8">
          <FiLayers size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="font-bold text-gray-700">No subcategories found</p>
          <p className="text-xs text-gray-400 mt-1">Click &quot;Add New Subcategory&quot; to create your first subcategory item.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-extrabold">
              <tr>
                <th className="p-4">Subcategory</th>
                <th className="p-4">Parent Category</th>
                <th className="p-4">Assigned Products</th>
                <th className="p-4">Order & Status</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subcategories.map(sub => {
                const prodCount = sub._count?.products || 0;
                const isPublished = sub.status === 'PUBLISHED';

                return (
                  <tr key={sub.id} className="hover:bg-amber-50/30 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={sub.image || 'https://via.placeholder.com/80'}
                          alt={sub.name}
                          className="w-12 h-12 rounded-xl object-cover border border-amber-300 shrink-0 shadow-sm"
                        />
                        <div>
                          <button
                            onClick={() => openEdit(sub)}
                            className="font-bold text-gray-900 hover:text-amber-600 text-sm transition text-left cursor-pointer"
                          >
                            {sub.name}
                          </button>
                          <p className="text-[10px] text-gray-400 font-mono">slug: /{sub.slug}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200 inline-flex items-center gap-1">
                        <FiGrid size={12} /> {sub.category?.name || 'Unassigned'}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className={`font-black text-xs px-2.5 py-1 rounded-xl border ${
                        prodCount > 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200'
                      }`}>
                        📦 {sub.name} — {prodCount} Product(s)
                      </span>
                    </td>

                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(sub)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border cursor-pointer ${
                            isPublished ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {isPublished ? 'PUBLISHED' : 'HIDDEN'}
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400">Display Order: #{sub.sortOrder || 0}</p>
                    </td>

                    <td className="p-4 text-gray-600 font-medium">
                      {formatDate(sub.createdAt)}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(sub)}
                          className="p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition cursor-pointer"
                          title="Edit Subcategory"
                        >
                          <FiEdit size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(sub)}
                          className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer"
                          title="Delete Subcategory"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Subcategory Add/Edit Drawer ─────────────────────── */}
      <SubcategoryDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        editSubcategory={editingSubcategory}
        categories={categories}
        onSaved={fetchSubcategories}
      />

      {/* ── Smart Delete Modal (With Product Transfer) ──────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                <FiAlertTriangle className="text-amber-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Remove Subcategory</h3>
                <p className="text-xs text-gray-500">
                  {(deleteTarget._count?.products || 0) > 0 ? 'Product transfer required' : 'Confirm subcategory deletion'}
                </p>
              </div>
            </div>

            {(deleteTarget._count?.products || 0) > 0 ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs">
                  <p className="font-bold text-amber-900 mb-1">
                    ⚠️ Subcategory &quot;{deleteTarget.name}&quot; contains {deleteTarget._count?.products} assigned product(s).
                  </p>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    Please select a target subcategory to transfer these products before removing this subcategory.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Target Subcategory to Transfer Products *
                  </label>
                  <select
                    value={targetSubId}
                    onChange={e => setTargetSubId(e.target.value)}
                    className="w-full p-2.5 border border-amber-300 rounded-xl text-xs font-bold bg-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Select Destination Subcategory --</option>
                    {subcategories
                      .filter(s => s.id !== deleteTarget.id && s.categoryId === deleteTarget.categoryId)
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s._count?.products || 0} products)</option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="deleteMode"
                      checked={deleteMode === 'TRANSFER'}
                      onChange={() => setDeleteMode('TRANSFER')}
                      className="text-amber-500 focus:ring-amber-400"
                    />
                    <div>
                      <p className="font-bold text-gray-900">Transfer Products & Remove Subcategory</p>
                      <p className="text-[10px] text-gray-500">Safely moves all {deleteTarget._count?.products} products to target subcategory</p>
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
                      <p className="font-bold text-red-900">Delete Subcategory AND All Products</p>
                      <p className="text-[10px] text-red-600">Permanently deletes all {deleteTarget._count?.products} assigned products</p>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-700 mb-5 bg-gray-50 border border-gray-100 rounded-2xl p-3.5">
                Are you sure you want to remove subcategory <strong>&quot;{deleteTarget.name}&quot;</strong>? This action cannot be undone.
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
                disabled={deleting || ((deleteTarget._count?.products || 0) > 0 && deleteMode === 'TRANSFER' && !targetSubId)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Processing...' : (deleteTarget._count?.products || 0) > 0 ? 'Transfer & Remove' : 'Remove Subcategory'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubcategories;
