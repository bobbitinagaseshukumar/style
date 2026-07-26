import React, { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import api from '../../config/api';
import {
  FiEdit, FiTrash2, FiPlus, FiSearch, FiX, FiAlertTriangle,
  FiEye, FiHome, FiCheck, FiStar, FiTrendingUp, FiZap, FiPackage, FiFilter
} from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatCurrency';
import { toast } from 'react-toastify';
import { AnimatePresence } from 'framer-motion';
import ProductWizard from './ProductWizard';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [categories, setCategories] = useState([]);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.allSettled([
        api.get('/products?includeAll=true&limit=100'),
        api.get('/categories')
      ]);

      if (prodRes.status === 'fulfilled') {
        setProducts(prodRes.value.data?.data?.products || []);
      }
      if (catRes.status === 'fulfilled') {
        setCategories(catRes.value.data?.data || []);
      }
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => { setEditingProduct(null); setWizardOpen(true); };
  const openEdit = (product) => { setEditingProduct(product); setWizardOpen(true); };
  const closeWizard = () => { setWizardOpen(false); setEditingProduct(null); };

  // Quick Toggle Flags
  const handleToggleFlag = async (product, flagName) => {
    const newValue = !product[flagName];
    // Optimistic UI update
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, [flagName]: newValue } : p));
    try {
      await api.put(`/products/${product.id}`, { [flagName]: newValue });
      toast.success(`Updated ${flagName} for "${product.name}"`);
    } catch (err) {
      toast.error('Failed to update product flag');
      fetchAll();
    }
  };

  // Quick Change Status
  const handleChangeStatus = async (product, newStatus) => {
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
    try {
      await api.put(`/products/${product.id}`, { status: newStatus });
      toast.success(`Product status set to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
      fetchAll();
    }
  };

  // Soft / Hard Delete
  const confirmDelete = (product) => setDeleteTarget(product);

  const handleDelete = async (hardDelete = false) => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/products/${deleteTarget.id}${hardDelete ? '?hardDelete=true' : ''}`);
      toast.success(`"${deleteTarget.name}" removed successfully`);
      setProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = products.filter(p => {
    const matchesSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || (p.status || 'PUBLISHED').toUpperCase() === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || p.categoryId === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Publishing & Inventory Control</h1>
          <p className="text-sm text-gray-500">{products.length} products total • Manage visibility, homepage placement & section badges</p>
        </div>
        <Button icon={FiPlus} onClick={openAdd}>Publish New Product</Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products, SKU, or category..."
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-yellow-400 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <FiX size={14} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400" size={14} />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published (Live)</option>
            <option value="DRAFT">Draft</option>
            <option value="HIDDEN">Hidden</option>
            <option value="ARCHIVED">Archived</option>
            <option value="DELETED">Soft Deleted</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-48" />
                <div className="h-3 bg-gray-100 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center">
          <p className="text-gray-400 font-medium">No products found matching filters</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase">Product</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase">Category & Subcategory</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase">Price & Stock</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase">Home Page</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase">Sections & Badges</th>
                <th className="px-5 py-3.5 text-right text-[11px] font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((product) => {
                const img = product.images?.[0]?.url || 'https://placehold.co/40x40/f3f4f6/9ca3af?text=IMG';
                const pStatus = (product.status || 'PUBLISHED').toUpperCase();

                return (
                  <tr key={product.id} className="hover:bg-gray-50/70 transition">
                    {/* Product Name & SKU */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img src={img} alt="" className="w-11 h-11 rounded-xl object-cover bg-gray-100 shrink-0 border" />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-xs truncate max-w-[180px]">{product.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{product.sku}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category & Subcategory */}
                    <td className="px-5 py-4 text-xs text-gray-600 whitespace-nowrap">
                      <p className="font-semibold text-gray-900">{product.category?.name || '—'}</p>
                      <p className="text-[10px] text-gray-400">{product.subCategory?.name || 'Main Catalog'}</p>
                    </td>

                    {/* Price & Stock */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="font-bold text-gray-900 text-xs">{formatCurrency(product.discountPrice || product.price)}</p>
                      <p className={`text-[10px] font-semibold ${product.stock === 0 ? 'text-red-500' : 'text-gray-500'}`}>
                        {product.stock === 0 ? 'Out of Stock' : `${product.stock} pcs in stock`}
                      </p>
                    </td>

                    {/* Status Dropdown */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <select
                        value={pStatus}
                        onChange={(e) => handleChangeStatus(product, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border outline-none cursor-pointer ${
                          pStatus === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          pStatus === 'DRAFT' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                          pStatus === 'HIDDEN' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-purple-50 text-purple-700 border-purple-200'
                        }`}
                      >
                        <option value="PUBLISHED">Published</option>
                        <option value="DRAFT">Draft</option>
                        <option value="HIDDEN">Hidden</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                    </td>

                    {/* Home Page Display Toggle */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleFlag(product, 'showOnHomepage')}
                        title={product.showOnHomepage ? "Click to remove from Home Page" : "Click to show on Home Page"}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                          product.showOnHomepage
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                      >
                        <FiHome size={11} />
                        {product.showOnHomepage ? 'Shown on Home' : 'Removed from Home'}
                      </button>
                    </td>

                    {/* Section Badges Toggles */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        <button
                          onClick={() => handleToggleFlag(product, 'featured')}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold border cursor-pointer ${
                            product.featured ? 'bg-yellow-400 text-black border-yellow-500' : 'bg-gray-100 text-gray-400 border-gray-200'
                          }`}
                        >
                          ⭐ Featured
                        </button>

                        <button
                          onClick={() => handleToggleFlag(product, 'trending')}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold border cursor-pointer ${
                            product.trending ? 'bg-blue-500 text-white border-blue-600' : 'bg-gray-100 text-gray-400 border-gray-200'
                          }`}
                        >
                          🔥 Trending
                        </button>

                        <button
                          onClick={() => handleToggleFlag(product, 'newArrival')}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold border cursor-pointer ${
                            product.newArrival ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-gray-100 text-gray-400 border-gray-200'
                          }`}
                        >
                          ✨ New
                        </button>

                        <button
                          onClick={() => handleToggleFlag(product, 'bestSeller')}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold border cursor-pointer ${
                            product.bestSeller ? 'bg-purple-500 text-white border-purple-600' : 'bg-gray-100 text-gray-400 border-gray-200'
                          }`}
                        >
                          🏆 Best
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(product)}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title="Edit product"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(product)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition cursor-pointer"
                          title="Delete product"
                        >
                          <FiTrash2 className="w-4 h-4" />
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <FiAlertTriangle className="text-red-500 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Remove Product</h3>
                <p className="text-xs text-gray-500">Choose Soft Delete (Hide) or Permanent Delete</p>
              </div>
            </div>
            <p className="text-xs text-gray-700 mb-5 bg-red-50 border border-red-100 rounded-xl p-3 leading-relaxed">
              Are you sure you want to remove <strong>&quot;{deleteTarget.name}&quot;</strong>?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleDelete(false)}
                disabled={deleting}
                className="w-full py-2.5 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition shadow-sm cursor-pointer"
              >
                📦 Soft Delete (Hide & Archive)
              </button>
              <button
                onClick={() => handleDelete(true)}
                disabled={deleting}
                className="w-full py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition shadow-sm cursor-pointer"
              >
                🗑️ Permanent Delete from Database
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="w-full py-2 rounded-xl text-gray-500 text-xs font-semibold hover:bg-gray-100 transition mt-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Wizard Modal */}
      <AnimatePresence>
        {wizardOpen && (
          <ProductWizard
            editProduct={editingProduct}
            onClose={closeWizard}
            onSaved={fetchAll}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProducts;
