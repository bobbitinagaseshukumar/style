import React, { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import api from '../../config/api';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiX, FiAlertTriangle } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatCurrency';
import { toast } from 'react-toastify';
import { AnimatePresence } from 'framer-motion';
import ProductWizard from './ProductWizard';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/products?limit=100');
      setProducts(data?.data?.products || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => { setEditingProduct(null); setWizardOpen(true); };
  const openEdit = (product) => { setEditingProduct(product); setWizardOpen(true); };
  const closeWizard = () => { setWizardOpen(false); setEditingProduct(null); };

  const confirmDelete = (product) => setDeleteTarget(product);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/products/${deleteTarget.id}`);
      toast.success(`"${deleteTarget.name}" deleted successfully`);
      setProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products Management</h1>
          <p className="text-sm text-gray-500">{products.length} products in store</p>
        </div>
        <Button icon={FiPlus} onClick={openAdd}>Add New Product</Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <FiX size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
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
          <p className="text-gray-400 font-medium">No products found</p>
          {search && <p className="text-sm text-gray-400 mt-1">Try a different search term</p>}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Badges</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((product) => {
                const img = product.images?.[0]?.url || 'https://placehold.co/40x40/f3f4f6/9ca3af?text=IMG';
                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img src={img} alt="" className="w-11 h-11 rounded-xl object-cover bg-gray-100 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate max-w-[180px]">{product.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {product.category?.name || '—'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="font-bold text-gray-900 text-sm">{formatCurrency(product.discountPrice || product.price)}</p>
                      {product.discountPercent > 0 && (
                        <p className="text-xs text-gray-400 line-through">{formatCurrency(product.price)}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${product.stock === 0 ? 'text-red-500' : product.stock < 5 ? 'text-orange-500' : 'text-gray-700'}`}>
                        {product.stock} pcs
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {product.featured && <span className="px-2 py-0.5 rounded-md bg-yellow-50 text-yellow-700 text-[10px] font-bold border border-yellow-200">Featured</span>}
                        {product.trending && <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">Trending</span>}
                        {product.newArrival && <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">New</span>}
                        {product.bestSeller && <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">Best</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(product)}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                          title="Edit product"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(product)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition"
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

      {/* ── Delete Confirmation Modal ───────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <FiAlertTriangle className="text-red-500 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Product</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? 'Deleting...' : (<><FiTrash2 size={13} /> Delete</>)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Product Wizard ─────────────────────────────────── */}
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
