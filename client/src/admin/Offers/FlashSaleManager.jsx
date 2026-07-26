import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/common/Button';
import api from '../../config/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import BannerCropperModal from '../Banner/BannerCropperModal';
import {
  FiPlus, FiTrash2, FiEdit, FiSearch, FiX, FiCopy, FiCheck,
  FiEye, FiEyeOff, FiImage, FiRefreshCw, FiUploadCloud,
  FiAlertTriangle, FiZap, FiClock, FiCheckSquare, FiSquare,
  FiCalendar, FiSliders, FiPlay, FiPause, FiTag, FiDollarSign, FiPercent
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const fadeInUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -14 } };

const FlashSaleManager = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: 'Midnight Flash Sale',
    description: 'Exclusive midnight deals with up to 50% discount!',
    bannerUrl: '',
    bgColor: '#111827',
    textColor: '#FFFFFF',
    buttonColor: '#D4AF37',
    discountType: 'PERCENTAGE',
    discountValue: '30',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    productIds: [],
    status: 'PUBLISHED',
    isActive: true,
  });

  // Product Selection Modal inside Form
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Cropper Modal
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState(null);

  // Delete Target
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ─── FETCH SALES & PRODUCTS ────────────────────────────── */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [salesRes, prodRes] = await Promise.allSettled([
        api.get('/cms/flash-sales/admin/all'),
        api.get('/products?includeAll=true&limit=100'),
      ]);

      if (salesRes.status === 'fulfilled') setSales(salesRes.value.data?.data || []);
      if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data?.data?.products || []);
    } catch { toast.error('Failed to load flash sales'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ─── OPEN CREATE / EDIT MODAL ──────────────────────────── */
  const openCreate = () => {
    setEditingSale(null);
    const now = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    setForm({
      name: 'Midnight Flash Sale',
      description: 'Exclusive midnight deals with up to 50% discount!',
      bannerUrl: '',
      bgColor: '#111827',
      textColor: '#FFFFFF',
      buttonColor: '#D4AF37',
      discountType: 'PERCENTAGE',
      discountValue: '30',
      startDate: now.toISOString().slice(0, 16),
      endDate: tomorrow.toISOString().slice(0, 16),
      productIds: [],
      status: 'PUBLISHED',
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (sale) => {
    setEditingSale(sale);
    let pIds = [];
    try { pIds = typeof sale.productIds === 'string' ? JSON.parse(sale.productIds) : (sale.productIds || []); } catch { pIds = []; }

    setForm({
      name: sale.name || '',
      description: sale.description || '',
      bannerUrl: sale.bannerUrl || '',
      bgColor: sale.bgColor || '#111827',
      textColor: sale.textColor || '#FFFFFF',
      buttonColor: sale.buttonColor || '#D4AF37',
      discountType: sale.discountType || 'PERCENTAGE',
      discountValue: String(sale.discountValue || 30),
      startDate: sale.startDate ? new Date(sale.startDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      endDate: sale.endDate ? new Date(sale.endDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      productIds: pIds,
      status: sale.status || 'PUBLISHED',
      isActive: sale.isActive !== false,
    });
    setModalOpen(true);
  };

  /* ─── FILE SELECT → CROPPER ─────────────────────────────── */
  const handleFileSelect = (file) => {
    if (!file) return;
    const valid = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (!valid.includes(file.type)) { toast.error('Invalid file format. Use JPG, PNG, WEBP, or AVIF.'); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error('File size exceeds 20MB limit.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setCropperSrc(reader.result); setCropperOpen(true); };
    reader.readAsDataURL(file);
  };

  /* ─── SAVE FLASH SALE ──────────────────────────────────── */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Sale Name is required'); return; }
    if (form.productIds.length === 0) { toast.error('Select at least 1 product for the Flash Sale'); return; }

    try {
      const payload = {
        ...form,
        discountValue: parseFloat(form.discountValue || 0),
        productIds: JSON.stringify(form.productIds),
      };

      if (editingSale) {
        await api.put(`/cms/flash-sales/${editingSale.id}`, payload);
        toast.success(`"${form.name}" updated! 🔥`);
      } else {
        await api.post('/cms/flash-sales', payload);
        toast.success(`"${form.name}" created & scheduled! ⚡`);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save flash sale'); }
  };

  /* ─── ACTIONS: PAUSE / RESUME / DUPLICATE / DELETE ───────── */
  const handleToggleStatus = async (sale) => {
    const newStatus = sale.status === 'PUBLISHED' ? 'PAUSED' : 'PUBLISHED';
    try {
      await api.put(`/cms/flash-sales/${sale.id}`, { status: newStatus, isActive: newStatus === 'PUBLISHED' });
      toast.success(`"${sale.name}" set to ${newStatus}`);
      fetchData();
    } catch { toast.error('Failed to toggle status'); }
  };

  const handleDuplicate = async (sale) => {
    try {
      await api.post(`/cms/flash-sales/${sale.id}/duplicate`);
      toast.success(`"${sale.name}" duplicated as Draft`);
      fetchData();
    } catch { toast.error('Duplicate failed'); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/cms/flash-sales/${deleteTarget.id}`);
      toast.success('Flash sale deleted');
      setDeleteTarget(null);
      fetchData();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  /* ─── PRODUCT SELECTION HELPERS ─────────────────────────── */
  const toggleProductSelect = (id) => {
    setForm(prev => ({
      ...prev,
      productIds: prev.productIds.includes(id) ? prev.productIds.filter(p => p !== id) : [...prev.productIds, id]
    }));
  };

  const selectAllProducts = () => setForm(prev => ({ ...prev, productIds: products.map(p => p.id) }));
  const clearProductSelection = () => setForm(prev => ({ ...prev, productIds: [] }));

  /* ─── CALCULATE PREVIEW PRICE ───────────────────────────── */
  const calcFlashPrice = (price) => {
    const val = parseFloat(form.discountValue || 0);
    if (form.discountType === 'PERCENTAGE') {
      return Math.max(0, Math.round(price - (price * val / 100)));
    }
    return Math.max(0, price - val);
  };

  const filteredProductsForSelector = products.filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku?.toLowerCase().includes(productSearch.toLowerCase()));

  /* ═══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900">Midnight Flash Sale Manager</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-black border border-red-200 animate-pulse">⚡ LIVE PROMOTIONS</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Create scheduled flash sales with automatic price drops, countdown timers, and promotional badges</p>
        </div>
        <Button icon={FiPlus} onClick={openCreate}>+ Create Flash Sale</Button>
      </div>

      {/* Sales List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white border rounded-2xl p-5 animate-pulse flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gray-100" />
              <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-1/3" /><div className="h-3 bg-gray-100 rounded w-1/4" /></div>
            </div>
          ))}
        </div>
      ) : sales.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-sm">
          <div className="w-20 h-20 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-100">
            <FiZap size={40} />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-1">No Flash Sales Created Yet</h3>
          <p className="text-xs text-gray-400 mb-6 max-w-md mx-auto">Create scheduled flash sales to offer limited-time discounts with live countdown timers on your storefront.</p>
          <Button icon={FiPlus} onClick={openCreate}>Create Your First Flash Sale</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sales.map(sale => {
            let pIds = [];
            try { pIds = typeof sale.productIds === 'string' ? JSON.parse(sale.productIds) : (sale.productIds || []); } catch { pIds = []; }
            const now = new Date();
            const start = sale.startDate ? new Date(sale.startDate) : null;
            const end = sale.endDate ? new Date(sale.endDate) : null;
            const isLive = sale.status === 'PUBLISHED' && sale.isActive && start && end && now >= start && now <= end;
            const isExpired = end && now > end;

            return (
              <motion.div key={sale.id} layout variants={fadeInUp} initial="initial" animate="animate"
                className={`bg-white border rounded-3xl p-5 shadow-sm hover:shadow-lg transition-all ${isLive ? 'border-amber-400 ring-2 ring-amber-100' : 'border-gray-200'}`}>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Banner / Color preview */}
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border flex items-center justify-center relative" style={{ backgroundColor: sale.bgColor || '#111827' }}>
                    {sale.bannerUrl ? (
                      <img src={sale.bannerUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FiZap size={28} style={{ color: sale.buttonColor || '#D4AF37' }} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-base">{sale.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        isLive ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' :
                        isExpired ? 'bg-gray-100 text-gray-500 border-gray-200' :
                        sale.status === 'PAUSED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {isLive ? '⚡ LIVE NOW' : isExpired ? '⏹ EXPIRED' : sale.status}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mt-1 truncate">{sale.description || 'No description'}</p>

                    <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[11px] text-gray-600">
                      <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {sale.discountType === 'PERCENTAGE' ? `${sale.discountValue}% OFF` : `₹${sale.discountValue} OFF`}
                      </span>
                      <span className="font-semibold bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                        📦 {pIds.length} Products Selected
                      </span>
                      {start && end && (
                        <span className="text-gray-400 font-medium flex items-center gap-1">
                          <FiCalendar size={12} /> {formatDate(start)} → {formatDate(end)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    <button onClick={() => handleToggleStatus(sale)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${sale.status === 'PUBLISHED' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                      {sale.status === 'PUBLISHED' ? <><FiPause size={12} /> Pause</> : <><FiPlay size={12} /> Resume</>}
                    </button>
                    <button onClick={() => openEdit(sale)} className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 hover:bg-blue-100 transition cursor-pointer flex items-center gap-1">
                      <FiEdit size={12} /> Edit
                    </button>
                    <button onClick={() => handleDuplicate(sale)} className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer" title="Duplicate"><FiCopy size={14} /></button>
                    <button onClick={() => setDeleteTarget(sale)} className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition cursor-pointer" title="Delete"><FiTrash2 size={14} /></button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/*   CREATE / EDIT FLASH SALE MODAL                        */}
      {/* ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] shadow-2xl border border-gray-100 flex flex-col overflow-hidden">

              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 shrink-0">
                <div>
                  <h2 className="text-lg font-black text-gray-900">{editingSale ? 'Edit Flash Sale' : '+ Create Flash Sale'}</h2>
                  <p className="text-xs text-gray-500">Configure promotional discount, schedule, and selected products</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-200 text-gray-500 transition cursor-pointer"><FiX size={20} /></button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Sale Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Flash Sale Name *</label>
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Midnight Flash Sale" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs bg-white">
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                      <option value="HIDDEN">Hidden</option>
                      <option value="PAUSED">Paused</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Up to 50% OFF on selected products!" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 resize-none" />
                </div>

                {/* Banner Upload */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Sale Banner Image</label>
                  <div className="flex items-center gap-3">
                    {form.bannerUrl && (
                      <div className="w-24 h-16 rounded-xl overflow-hidden bg-gray-900 border shrink-0">
                        <img src={form.bannerUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <label className="flex-1 border-2 border-dashed border-gray-300 hover:border-amber-400 rounded-2xl p-4 text-center cursor-pointer bg-gray-50 transition-colors">
                      <FiUploadCloud size={24} className="mx-auto text-amber-500 mb-1" />
                      <span className="text-xs font-bold text-gray-700 block">Upload Banner (Drag & Drop or Gallery)</span>
                      <span className="text-[10px] text-gray-400 block">JPG, PNG, WEBP, AVIF (Max 20MB)</span>
                      <input type="file" accept="image/*" onChange={e => handleFileSelect(e.target.files?.[0])} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Background Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.bgColor} onChange={e => setForm({ ...form, bgColor: e.target.value })} className="w-9 h-9 rounded-xl border cursor-pointer" />
                      <input type="text" value={form.bgColor} onChange={e => setForm({ ...form, bgColor: e.target.value })} className="w-full px-2 py-1.5 border rounded-xl text-xs font-mono" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.textColor} onChange={e => setForm({ ...form, textColor: e.target.value })} className="w-9 h-9 rounded-xl border cursor-pointer" />
                      <input type="text" value={form.textColor} onChange={e => setForm({ ...form, textColor: e.target.value })} className="w-full px-2 py-1.5 border rounded-xl text-xs font-mono" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Button Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.buttonColor} onChange={e => setForm({ ...form, buttonColor: e.target.value })} className="w-9 h-9 rounded-xl border cursor-pointer" />
                      <input type="text" value={form.buttonColor} onChange={e => setForm({ ...form, buttonColor: e.target.value })} className="w-full px-2 py-1.5 border rounded-xl text-xs font-mono" />
                    </div>
                  </div>
                </div>

                {/* Discount Type & Value */}
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-3">
                  <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider block">Flash Sale Discount Settings</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Discount Type</label>
                      <div className="flex gap-2">
                        <label className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition ${form.discountType === 'PERCENTAGE' ? 'bg-amber-400 text-black border-amber-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                          <input type="radio" name="discType" checked={form.discountType === 'PERCENTAGE'} onChange={() => setForm({ ...form, discountType: 'PERCENTAGE' })} className="hidden" />
                          <FiPercent size={13} /> Percentage (%)
                        </label>
                        <label className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition ${form.discountType === 'FIXED' ? 'bg-amber-400 text-black border-amber-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                          <input type="radio" name="discType" checked={form.discountType === 'FIXED'} onChange={() => setForm({ ...form, discountType: 'FIXED' })} className="hidden" />
                          <FiDollarSign size={13} /> Fixed Amount (₹)
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Discount Value</label>
                      <input type="number" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} min="1" required className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold outline-none focus:border-amber-500" />
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Start Date & Time *</label>
                    <input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">End Date & Time *</label>
                    <input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500" />
                  </div>
                </div>

                {/* Selected Products Picker */}
                <div className="border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-gray-900">Participating Products ({form.productIds.length} Selected)</h4>
                      <p className="text-[10px] text-gray-400">Only selected products will display the Flash Sale price & badge</p>
                    </div>
                    <button type="button" onClick={() => setProductSelectorOpen(true)} className="px-3 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-extrabold hover:bg-amber-400 transition cursor-pointer flex items-center gap-1">
                      <FiPlus size={13} /> Choose Products ({products.length} available)
                    </button>
                  </div>

                  {/* Selected products list preview */}
                  {form.productIds.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                      {form.productIds.map(id => {
                        const p = products.find(prod => prod.id === id);
                        if (!p) return null;
                        const fPrice = calcFlashPrice(p.price);
                        return (
                          <div key={id} className="flex items-center gap-2 p-2 rounded-xl border border-gray-100 bg-gray-50 text-xs">
                            <img src={p.images?.[0]?.url || 'https://placehold.co/40'} alt="" className="w-8 h-8 rounded-lg object-cover bg-white shrink-0 border" />
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-900 text-[11px] truncate">{p.name}</p>
                              <p className="text-[10px] text-gray-400">
                                <span className="line-through">{formatCurrency(p.price)}</span> → <span className="font-bold text-emerald-600">{formatCurrency(fPrice)}</span>
                              </p>
                            </div>
                            <button type="button" onClick={() => toggleProductSelect(id)} className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"><FiX size={14} /></button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-red-500 font-semibold bg-red-50 p-3 rounded-xl border border-red-100">⚠ No products selected yet. Click &quot;Choose Products&quot; to pick products for this Flash Sale.</p>
                  )}
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-3 border-t border-gray-100">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition cursor-pointer">Cancel</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black text-xs font-extrabold shadow-md hover:shadow-lg transition cursor-pointer">
                    {editingSale ? 'Update Flash Sale' : 'Publish & Schedule Flash Sale'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*   PRODUCT SELECTOR SUB-MODAL                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {productSelectorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-3xl max-h-[88vh] shadow-2xl border border-gray-100 flex flex-col overflow-hidden">

              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 shrink-0">
                <div>
                  <h3 className="font-black text-gray-900 text-base">Select Products for Flash Sale</h3>
                  <p className="text-xs text-gray-500">{form.productIds.length} of {products.length} products selected</p>
                </div>
                <button onClick={() => setProductSelectorOpen(false)} className="p-2 rounded-xl hover:bg-gray-200 text-gray-500 transition cursor-pointer"><FiX size={18} /></button>
              </div>

              {/* Search & Actions */}
              <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3 shrink-0">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search product name, SKU..." className="w-full pl-8 pr-4 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none" />
                </div>
                <button type="button" onClick={selectAllProducts} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 cursor-pointer">Select All</button>
                <button type="button" onClick={clearProductSelection} className="px-3 py-2 rounded-xl text-gray-500 text-xs font-semibold hover:bg-gray-100 cursor-pointer">Clear</button>
              </div>

              {/* Product List */}
              <div className="flex-1 overflow-y-auto p-4 divide-y divide-gray-100">
                {filteredProductsForSelector.map(product => {
                  const isSelected = form.productIds.includes(product.id);
                  const flashPrice = calcFlashPrice(product.price);

                  return (
                    <div key={product.id} onClick={() => toggleProductSelect(product.id)} className={`flex items-center gap-3 p-3 rounded-2xl transition cursor-pointer ${isSelected ? 'bg-amber-50/80 border border-amber-200' : 'hover:bg-gray-50'}`}>
                      <input type="checkbox" checked={isSelected} onChange={() => {}} className="rounded text-amber-500 w-4 h-4 cursor-pointer" />
                      <img src={product.images?.[0]?.url || 'https://placehold.co/40'} alt="" className="w-10 h-10 rounded-xl object-cover bg-white shrink-0 border" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-xs truncate">{product.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{product.sku} • Stock: {product.stock}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-gray-900">{formatCurrency(flashPrice)}</p>
                        <p className="text-[10px] text-gray-400 line-through">{formatCurrency(product.price)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selector Footer */}
              <div className="px-6 py-3 border-t border-gray-100 flex justify-end shrink-0 bg-gray-50">
                <button type="button" onClick={() => setProductSelectorOpen(false)} className="px-5 py-2 rounded-xl bg-amber-500 text-black text-xs font-extrabold hover:bg-amber-400 transition cursor-pointer">
                  Done ({form.productIds.length} Selected)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Cropper Modal */}
      <BannerCropperModal
        isOpen={cropperOpen}
        onClose={() => setCropperOpen(false)}
        imageSrc={cropperSrc}
        onCropComplete={url => { setForm({ ...form, bannerUrl: url }); toast.success('Banner image updated! ✨'); }}
      />

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border">
              <h3 className="font-bold text-gray-900 text-base mb-2">Delete Flash Sale</h3>
              <p className="text-xs text-gray-600 mb-5">Are you sure you want to delete <strong>&quot;{deleteTarget.name}&quot;</strong>? This will remove the promotion from the storefront.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1 py-2 rounded-xl border text-xs font-semibold cursor-pointer">Cancel</button>
                <button onClick={handleDeleteConfirm} disabled={deleting} className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer">{deleting ? 'Deleting...' : 'Delete'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FlashSaleManager;
