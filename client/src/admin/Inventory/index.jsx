import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { FiBox, FiAlertTriangle, FiEdit2, FiCheck, FiPlus, FiMinus } from 'react-icons/fi';
import { toast } from 'react-toastify';

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStock, setNewStock] = useState('0');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/products?limit=100');
      setProducts(data.data?.products || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      await api.put(`/products/${selectedProduct.id}`, { stock: parseInt(newStock) });
      toast.success(`Stock for '${selectedProduct.name}' updated to ${newStock} pcs!`);
      setSelectedProduct(null);
      fetchInventory();
    } catch (err) {
      toast.error('Failed to update stock');
    }
  };

  const lowStockCount = products.filter(p => p.stock < 10).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory & Stock Tracking</h1>
          <p className="text-sm text-gray-500">Monitor real-time stock levels, low-stock warnings, and reorder alerts</p>
        </div>
        {lowStockCount > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-bold shadow-sm">
            <FiAlertTriangle className="w-4 h-4 animate-bounce" /> {lowStockCount} Products Low in Stock
          </span>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading inventory...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product SKU</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((p) => {
                const isLow = p.stock < 10 && p.stock > 0;
                const isOut = p.stock === 0;

                return (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-charcoal-900 text-sm">{p.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{p.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {p.category?.name || 'General'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-charcoal-900">
                      {p.stock} pcs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                        isOut ? 'bg-red-100 text-red-800' :
                        isLow ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'IN STOCK'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setNewStock(String(p.stock));
                        }}
                        className="text-gold-600 hover:text-gold-800 p-2 rounded-lg hover:bg-gold-50 transition"
                        title="Adjust Stock Qty"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {selectedProduct && (
        <Modal isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} title={`Adjust Stock - ${selectedProduct.name}`}>
          <form onSubmit={handleUpdateStock} className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-2">SKU: {selectedProduct.sku}</p>
              <Input
                label="New Stock Quantity (pcs)"
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setSelectedProduct(null)}>Cancel</Button>
              <Button type="submit">Save Stock Qty</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminInventory;
