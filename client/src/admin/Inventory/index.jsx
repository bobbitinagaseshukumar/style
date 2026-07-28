import React, { useState, useEffect, useMemo } from 'react';
import api from '../../config/api';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import {
  FiBox,
  FiAlertTriangle,
  FiEdit2,
  FiTrash2,
  FiXCircle,
  FiSearch,
  FiRefreshCw,
  FiCheckCircle,
  FiLayers
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | IN_STOCK | LOW_STOCK | OUT_OF_STOCK

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStock, setNewStock] = useState('0');
  const [updating, setUpdating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products?limit=200&includeAll=true');
      const list = res.data?.data?.products || res.data?.products || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setProducts(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load inventory data:', err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const nameMatch = (p.name || '').toLowerCase().includes(search.toLowerCase());
      const skuMatch = (p.sku || '').toLowerCase().includes(search.toLowerCase());
      const categoryMatch = (p.category?.name || '').toLowerCase().includes(search.toLowerCase());
      const matchesSearch = nameMatch || skuMatch || categoryMatch;

      const isOut = p.stock === 0;
      const isLow = p.stock > 0 && p.stock < 10;
      const isIn = p.stock >= 10;

      if (!matchesSearch) return false;
      if (statusFilter === 'OUT_OF_STOCK') return isOut;
      if (statusFilter === 'LOW_STOCK') return isLow;
      if (statusFilter === 'IN_STOCK') return isIn;
      return true;
    });
  }, [products, search, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = products.length;
    const low = products.filter((p) => p.stock > 0 && p.stock < 10).length;
    const out = products.filter((p) => p.stock === 0).length;
    const inStock = products.filter((p) => p.stock >= 10).length;
    return { total, low, out, inStock };
  }, [products]);

  // Update Stock API Call
  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      setUpdating(true);
      const parsedStock = Math.max(0, parseInt(newStock) || 0);
      await api.put(`/products/${selectedProduct.id}`, { stock: parsedStock });
      toast.success(`Stock for '${selectedProduct.name}' updated to ${parsedStock} pcs!`);
      setSelectedProduct(null);
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setUpdating(false);
    }
  };

  // Quick Set Out of Stock (0)
  const handleSetOutOfStock = async (product) => {
    if (!window.confirm(`Set stock level to 0 (OUT OF STOCK) for '${product.name}'?`)) return;
    try {
      await api.put(`/products/${product.id}`, { stock: 0 });
      toast.info(`'${product.name}' is now marked OUT OF STOCK.`);
      fetchInventory();
    } catch (err) {
      toast.error('Failed to update stock level');
    }
  };

  // Delete Stock / Product
  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/products/${deleteTarget.id}`);
      toast.success(`Deleted stock item '${deleteTarget.name}' successfully.`);
      setDeleteTarget(null);
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete stock item');
    } finally {
      setDeleting(false);
    }
  };

  // Batch Reset All Product Stocks to 0
  const handleResetAllStocks = async () => {
    if (!window.confirm('⚠️ Are you sure you want to reset ALL product stock levels to 0? Stock will automatically increase when you add/edit stock and decrease as customers purchase.')) return;
    try {
      setLoading(true);
      await api.put('/products/admin/reset-all-stocks');
      toast.info('All product stock levels have been reset to 0 pcs.');
      fetchInventory();
    } catch (err) {
      toast.error('Failed to reset all stocks');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <FiBox className="text-gold-600" /> Inventory & Stock Control
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time stock sync: Admin adds/creates stock ↗️ | Customer purchases decrease stock ↘️
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetAllStocks}
            className="px-3.5 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold hover:bg-red-100 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Reset all product stocks to 0"
          >
            <FiXCircle className="w-4 h-4" /> Reset All Stocks (0)
          </button>
          <button
            onClick={fetchInventory}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            title="Refresh Inventory List"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-charcoal-900 text-white border-charcoal-900 shadow-md'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">Total Items</span>
            <FiLayers className="w-5 h-5 opacity-70" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.total}</p>
        </div>

        <div
          onClick={() => setStatusFilter('IN_STOCK')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'IN_STOCK'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">In Stock</span>
            <FiCheckCircle className="w-5 h-5 opacity-70" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.inStock}</p>
        </div>

        <div
          onClick={() => setStatusFilter('LOW_STOCK')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'LOW_STOCK'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md'
              : 'bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">Low Stock (&lt;10)</span>
            <FiAlertTriangle className="w-5 h-5 opacity-70" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.low}</p>
        </div>

        <div
          onClick={() => setStatusFilter('OUT_OF_STOCK')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'OUT_OF_STOCK'
              ? 'bg-red-600 text-white border-red-600 shadow-md'
              : 'bg-red-50 text-red-900 border-red-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">Out of Stock</span>
            <FiXCircle className="w-5 h-5 opacity-70" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.out}</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by SKU, Product Name, Category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-gold-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'All Stock' },
            { id: 'IN_STOCK', label: 'In Stock' },
            { id: 'LOW_STOCK', label: 'Low Stock' },
            { id: 'OUT_OF_STOCK', label: 'Out of Stock' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-gold-500 text-black shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-200">
          <FiRefreshCw className="w-6 h-6 animate-spin mx-auto text-gold-500 mb-2" />
          <p className="text-xs font-bold">Loading real-time stock entries...</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 text-left">Product SKU & Details</th>
                  <th className="px-6 py-3.5 text-left">Category</th>
                  <th className="px-6 py-3.5 text-left">Current Stock</th>
                  <th className="px-6 py-3.5 text-left">Stock Status</th>
                  <th className="px-6 py-3.5 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredProducts.map((p) => {
                  const isLow = p.stock < 10 && p.stock > 0;
                  const isOut = p.stock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-charcoal-900 text-sm">{p.name}</div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">SKU: {p.sku || 'N/A'}</div>
                      </td>

                      <td className="px-6 py-4 font-medium text-gray-600">
                        {p.category?.name || 'General'}
                      </td>

                      <td className="px-6 py-4 font-extrabold text-charcoal-900 text-sm">
                        {p.stock} pcs
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                            isOut
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : isLow
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {isOut ? '❌ OUT OF STOCK' : isLow ? '⚠️ LOW STOCK' : '✅ IN STOCK'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Adjust Stock Qty */}
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setNewStock(String(p.stock));
                            }}
                            className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                            title="Edit Stock Count"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>

                          {/* Quick Set Out of Stock (0) */}
                          <button
                            onClick={() => handleSetOutOfStock(p)}
                            className="p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition cursor-pointer"
                            title="Mark Out of Stock (Set 0)"
                          >
                            <FiXCircle className="w-4 h-4" />
                          </button>

                          {/* Delete Product / Stock Entry */}
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer"
                            title="Delete Stock / Product Entry"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      No stock entries match the current filter or search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {selectedProduct && (
        <Modal isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} title={`Adjust Stock — ${selectedProduct.name}`}>
          <form onSubmit={handleUpdateStock} className="space-y-4 text-xs">
            <div>
              <p className="text-xs text-gray-500 mb-2">SKU: <strong className="font-mono">{selectedProduct.sku}</strong></p>
              <Input
                label="Stock Quantity (pcs)"
                type="number"
                min="0"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                required
              />
            </div>

            {/* Quick Add Buttons */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1.5">Quick Stock Shortcuts:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewStock('0')}
                  className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 font-bold hover:bg-red-200 transition cursor-pointer"
                >
                  Set 0 (Out of Stock)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(10)}
                  className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 font-bold hover:bg-blue-200 transition cursor-pointer"
                >
                  +10 pcs
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(50)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 font-bold hover:bg-emerald-200 transition cursor-pointer"
                >
                  +50 pcs
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setSelectedProduct(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? 'Saving...' : 'Save Stock Count'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete Stock Entry">
          <div className="space-y-4 text-xs">
            <p className="text-gray-700">
              Are you sure you want to delete <strong className="text-red-600">{deleteTarget.name}</strong> from stock/inventory? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Item'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminInventory;
