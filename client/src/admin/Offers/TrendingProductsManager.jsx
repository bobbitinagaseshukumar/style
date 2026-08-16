import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/common/Button';
import api from '../../config/api';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  FiPlus, FiTrash2, FiEdit, FiSearch, FiX, FiTrendingUp,
  FiToggleLeft, FiToggleRight, FiGrid, FiSliders, FiCheck, FiArrowUp, FiArrowDown
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { notifyContentUpdated } from '../../utils/cacheUtils';

const TrendingProductsManager = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [masterEnabled, setMasterEnabled] = useState(true);

  // Trending Selection State
  const [selection, setSelection] = useState({
    title: 'Trending Products',
    productIds: [],
    layout: 'GRID',
    productsPerRow: 4,
    limit: 8,
    status: 'PUBLISHED',
    isActive: true
  });

  const [productSearch, setProductSearch] = useState('');
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ─── FETCH ─────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [trendRes, prodRes, setRes] = await Promise.allSettled([
        api.get('/cms/trending-selection/admin'),
        api.get('/products?includeAll=true&limit=100'),
        api.get('/cms/settings'),
      ]);

      if (trendRes.status === 'fulfilled' && trendRes.value.data?.data) {
        const data = trendRes.value.data.data;
        let pIds = [];
        try { pIds = typeof data.productIds === 'string' ? JSON.parse(data.productIds) : (data.productIds || []); } catch { pIds = []; }
        setSelection({
          ...data,
          productIds: pIds
        });
      }

      if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data?.data?.products || []);

      if (setRes.status === 'fulfilled') {
        const cfg = setRes.value.data?.data || {};
        setMasterEnabled(cfg.enableTrendingProducts !== false);
      }
    } catch { toast.error('Failed to load trending products configuration'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleMaster = async () => {
    const nextVal = !masterEnabled;
    try {
      await api.put('/cms/settings', { enableTrendingProducts: nextVal });
      setMasterEnabled(nextVal);
      notifyContentUpdated();
      toast.success(nextVal ? 'Trending Products section ENABLED' : 'Trending Products section DISABLED');
    } catch { toast.error('Failed to update setting'); }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/cms/trending-selection/admin', {
        ...selection,
        productIds: JSON.stringify(selection.productIds)
      });
      notifyContentUpdated();
      toast.success('Trending Products configuration saved! 🔥');
      fetchData();
    } catch { toast.error('Failed to save selection'); }
    finally { setSaving(false); }
  };

  const toggleProductSelect = (id) => {
    setSelection(prev => ({
      ...prev,
      productIds: prev.productIds.includes(id) ? prev.productIds.filter(p => p !== id) : [...prev.productIds, id]
    }));
  };

  const moveProduct = (index, direction) => {
    const nextIds = [...selection.productIds];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= nextIds.length) return;
    const [moved] = nextIds.splice(index, 1);
    nextIds.splice(targetIdx, 0, moved);
    setSelection(prev => ({ ...prev, productIds: nextIds }));
  };

  const filteredProductsForSelector = products.filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku?.toLowerCase().includes(productSearch.toLowerCase()));

  /* ═══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900">Trending Products Manager</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-black border border-blue-200">🔥 MANUAL CURATION</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Manually choose exact products, order, grid layout, and row items displayed in Trending Products</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleToggleMaster} className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black border transition cursor-pointer ${masterEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            {masterEnabled ? <FiToggleRight size={20} className="text-emerald-600" /> : <FiToggleLeft size={20} className="text-gray-400" />}
            {masterEnabled ? 'Trending Section ENABLED' : 'Trending Section DISABLED'}
          </button>
          <Button icon={FiCheck} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Trending Config'}
          </Button>
        </div>
      </div>

      {!masterEnabled && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
          <FiTrendingUp size={16} />
          Trending Products section is currently <strong>DISABLED</strong>. It will be hidden on the customer website.
        </div>
      )}

      {/* Layout & Options Control Bar */}
      <div className="bg-white border rounded-3xl p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900 text-sm">Homepage Display Options</h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Section Title</label>
            <input type="text" value={selection.title} onChange={e => setSelection({ ...selection, title: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-xs font-bold" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Display Layout</label>
            <select value={selection.layout} onChange={e => setSelection({ ...selection, layout: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-xs bg-white font-semibold">
              <option value="GRID">Grid Layout</option>
              <option value="SLIDER">Slider Layout</option>
              <option value="CAROUSEL">Carousel Layout</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Products Per Row</label>
            <select value={selection.productsPerRow} onChange={e => setSelection({ ...selection, productsPerRow: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl border text-xs bg-white font-semibold">
              <option value={2}>2 Products / Row</option>
              <option value={3}>3 Products / Row</option>
              <option value={4}>4 Products / Row</option>
              <option value={5}>5 Products / Row</option>
              <option value={6}>6 Products / Row</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Total Products to Display</label>
            <select value={selection.limit} onChange={e => setSelection({ ...selection, limit: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl border text-xs bg-white font-semibold">
              <option value={4}>4 Products</option>
              <option value={8}>8 Products</option>
              <option value={12}>12 Products</option>
              <option value={16}>16 Products</option>
              <option value={24}>24 Products</option>
            </select>
          </div>
        </div>
      </div>

      {/* Selected Products Area */}
      <div className="bg-white border rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-gray-900 text-base">Selected Trending Products ({selection.productIds.length})</h3>
            <p className="text-xs text-gray-500">Only these admin-chosen products will appear in the Trending section (in exact order below)</p>
          </div>
          <button onClick={() => setProductSelectorOpen(true)} className="px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-extrabold hover:bg-amber-400 cursor-pointer flex items-center gap-1">
            <FiPlus size={14} /> Pick Products ({products.length} available)
          </button>
        </div>

        {selection.productIds.length === 0 ? (
          <div className="p-8 border border-dashed rounded-2xl text-center text-gray-400 text-xs">
            No trending products selected. Click &quot;Pick Products&quot; to manually choose products.
          </div>
        ) : (
          <div className="space-y-2">
            {selection.productIds.map((id, index) => {
              const p = products.find(prod => prod.id === id);
              if (!p) return null;

              return (
                <div key={id} className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 bg-gray-50 text-xs">
                  <span className="font-bold text-gray-400 w-6 text-center">{index + 1}</span>
                  <img src={p.images?.[0]?.url || 'https://placehold.co/40'} alt="" className="w-10 h-10 rounded-xl object-cover border bg-white shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-400">{p.sku} • {formatCurrency(p.discountPrice || p.price)}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => moveProduct(index, -1)} disabled={index === 0} className="p-1.5 rounded-lg border bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 cursor-pointer"><FiArrowUp size={12} /></button>
                    <button onClick={() => moveProduct(index, 1)} disabled={index === selection.productIds.length - 1} className="p-1.5 rounded-lg border bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 cursor-pointer"><FiArrowDown size={12} /></button>
                    <button onClick={() => toggleProductSelect(id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 cursor-pointer"><FiX size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Selector Sub-Modal */}
      <AnimatePresence>
        {productSelectorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-3xl max-h-[88vh] shadow-2xl border flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-sm">Select Trending Products ({selection.productIds.length} selected)</h3>
                <button onClick={() => setProductSelectorOpen(false)}><FiX size={18} /></button>
              </div>

              <div className="p-3 border-b">
                <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search products..." className="w-full px-3 py-2 border rounded-xl text-xs outline-none" />
              </div>

              <div className="flex-1 overflow-y-auto p-3 divide-y">
                {filteredProductsForSelector.map(p => {
                  const isSelected = selection.productIds.includes(p.id);
                  return (
                    <div key={p.id} onClick={() => toggleProductSelect(p.id)} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer ${isSelected ? 'bg-amber-50 border border-amber-200' : 'hover:bg-gray-50'}`}>
                      <input type="checkbox" checked={isSelected} onChange={() => {}} className="rounded text-amber-500 cursor-pointer" />
                      <img src={p.images?.[0]?.url || 'https://placehold.co/40'} alt="" className="w-10 h-10 rounded-xl object-cover border bg-white shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-xs truncate">{p.name}</p>
                        <p className="text-[10px] text-gray-400">{p.sku} • Stock: {p.stock}</p>
                      </div>
                      <p className="text-xs font-bold text-gray-900">{formatCurrency(p.discountPrice || p.price)}</p>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 border-t bg-gray-50 flex justify-end">
                <button onClick={() => setProductSelectorOpen(false)} className="px-5 py-2 bg-amber-500 text-black text-xs font-extrabold rounded-xl">Done</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrendingProductsManager;
