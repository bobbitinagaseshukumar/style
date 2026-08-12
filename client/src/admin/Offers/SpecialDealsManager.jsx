import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/common/Button';
import api from '../../config/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import GlobalImageEditor from '../../components/common/GlobalImageEditor';
import {
  FiPlus, FiTrash2, FiEdit, FiSearch, FiX, FiCopy, FiCheck,
  FiEye, FiEyeOff, FiImage, FiRefreshCw, FiUploadCloud,
  FiAlertTriangle, FiTag, FiCalendar, FiPlay, FiPause, FiExternalLink
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const fadeInUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -14 } };

const SpecialDealsManager = () => {
  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: 'Festive Special Deal',
    description: 'Exclusive bundle discounts on luxury saree & jewellery collections',
    bannerUrl: '',
    buttonText: 'Shop Special Deal',
    buttonLink: '/offers',
    bgColor: '#111827',
    textColor: '#FFFFFF',
    productIds: [],
    startDate: '',
    endDate: '',
    status: 'PUBLISHED',
    isActive: true,
  });

  // Product Selector Modal
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Cropper Modal
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState(null);

  // Delete Target
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ─── FETCH DATA ────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [dealsRes, prodRes] = await Promise.allSettled([
        api.get('/cms/special-deals/admin/all'),
        api.get('/products?includeAll=true&limit=100'),
      ]);

      if (dealsRes.status === 'fulfilled') setDeals(dealsRes.value.data?.data || []);
      if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data?.data?.products || []);
    } catch { toast.error('Failed to load special deals'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ─── OPEN CREATE / EDIT MODAL ──────────────────────────── */
  const openCreate = () => {
    setEditingDeal(null);
    setForm({
      name: 'Festive Special Deal',
      description: 'Exclusive bundle discounts on luxury saree & jewellery collections',
      bannerUrl: '',
      buttonText: 'Shop Special Deal',
      buttonLink: '/offers',
      bgColor: '#111827',
      textColor: '#FFFFFF',
      productIds: [],
      startDate: '',
      endDate: '',
      status: 'PUBLISHED',
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (deal) => {
    setEditingDeal(deal);
    let pIds = [];
    try { pIds = typeof deal.productIds === 'string' ? JSON.parse(deal.productIds) : (deal.productIds || []); } catch { pIds = []; }

    setForm({
      name: deal.name || '',
      description: deal.description || '',
      bannerUrl: deal.bannerUrl || '',
      buttonText: deal.buttonText || 'Shop Special Deal',
      buttonLink: deal.buttonLink || '/offers',
      bgColor: deal.bgColor || '#111827',
      textColor: deal.textColor || '#FFFFFF',
      productIds: pIds,
      startDate: deal.startDate ? new Date(deal.startDate).toISOString().slice(0, 16) : '',
      endDate: deal.endDate ? new Date(deal.endDate).toISOString().slice(0, 16) : '',
      status: deal.status || 'PUBLISHED',
      isActive: deal.isActive !== false,
    });
    setModalOpen(true);
  };

  /* ─── FILE SELECT ───────────────────────────────────────── */
  const handleFileSelect = (file) => {
    if (!file) return;
    const valid = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (!valid.includes(file.type)) { toast.error('Invalid file format'); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error('Max file size is 20MB'); return; }
    const reader = new FileReader();
    reader.onload = () => { setCropperSrc(reader.result); setCropperOpen(true); };
    reader.readAsDataURL(file);
  };

  /* ─── SAVE SPECIAL DEAL ─────────────────────────────────── */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Deal Name is required'); return; }

    try {
      const payload = {
        ...form,
        productIds: JSON.stringify(form.productIds),
      };

      if (editingDeal) {
        await api.put(`/cms/special-deals/${editingDeal.id}`, payload);
        toast.success(`"${form.name}" updated! ✨`);
      } else {
        await api.post('/cms/special-deals', payload);
        toast.success(`"${form.name}" published! 🎉`);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save deal'); }
  };

  /* ─── ACTIONS ───────────────────────────────────────────── */
  const handleToggleStatus = async (deal) => {
    const newStatus = deal.status === 'PUBLISHED' ? 'PAUSED' : 'PUBLISHED';
    try {
      await api.put(`/cms/special-deals/${deal.id}`, { status: newStatus, isActive: newStatus === 'PUBLISHED' });
      toast.success(`"${deal.name}" set to ${newStatus}`);
      fetchData();
    } catch { toast.error('Failed to update status'); }
  };

  const handleDuplicate = async (deal) => {
    try {
      await api.post(`/cms/special-deals/${deal.id}/duplicate`);
      toast.success(`"${deal.name}" duplicated as Draft`);
      fetchData();
    } catch { toast.error('Duplicate failed'); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/cms/special-deals/${deleteTarget.id}`);
      toast.success('Special deal deleted');
      setDeleteTarget(null);
      fetchData();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  const toggleProductSelect = (id) => {
    setForm(prev => ({
      ...prev,
      productIds: prev.productIds.includes(id) ? prev.productIds.filter(p => p !== id) : [...prev.productIds, id]
    }));
  };

  const filteredProductsForSelector = products.filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku?.toLowerCase().includes(productSearch.toLowerCase()));

  /* ═══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900">Special Deals Manager</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-gold-100 text-gold-700 text-xs font-black border border-gold-200">🎁 HOMEPAGE PROMOTIONS</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Manage promotional deal banners and curated product sets displayed on the customer homepage</p>
        </div>
        <Button icon={FiPlus} onClick={openCreate}>+ Create Special Deal</Button>
      </div>

      {/* Deals List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white border rounded-2xl p-5 animate-pulse flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gray-100" />
              <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-1/3" /><div className="h-3 bg-gray-100 rounded w-1/4" /></div>
            </div>
          ))}
        </div>
      ) : deals.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-sm">
          <div className="w-20 h-20 rounded-3xl bg-gold-50 text-gold-600 flex items-center justify-center mx-auto mb-4 border border-gold-100">
            <FiTag size={40} />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-1">No Special Deals Created Yet</h3>
          <p className="text-xs text-gray-400 mb-6 max-w-md mx-auto">Create curated promotional deals and feature selected products on your homepage.</p>
          <Button icon={FiPlus} onClick={openCreate}>Create Special Deal</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {deals.map(deal => {
            let pIds = [];
            try { pIds = typeof deal.productIds === 'string' ? JSON.parse(deal.productIds) : (deal.productIds || []); } catch { pIds = []; }

            return (
              <motion.div key={deal.id} layout variants={fadeInUp} initial="initial" animate="animate"
                className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm hover:shadow-lg transition-all">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Banner Preview */}
                  <div className="w-24 h-20 rounded-2xl overflow-hidden shrink-0 border flex items-center justify-center relative" style={{ backgroundColor: deal.bgColor || '#111827' }}>
                    {deal.bannerUrl ? (
                      <img src={deal.bannerUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FiTag size={28} className="text-gold-500" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-base">{deal.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        deal.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        deal.status === 'PAUSED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        {deal.status}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mt-1 truncate">{deal.description || 'No description'}</p>

                    <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[11px] text-gray-600">
                      <span className="font-semibold bg-gold-50 text-gold-800 px-2.5 py-0.5 rounded border border-gold-200">
                        📦 {pIds.length} Selected Products
                      </span>
                      {deal.buttonText && (
                        <span className="text-gray-400 font-medium flex items-center gap-1">
                          <FiExternalLink size={12} /> Button: &quot;{deal.buttonText}&quot; ({deal.buttonLink})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    <button onClick={() => handleToggleStatus(deal)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${deal.status === 'PUBLISHED' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                      {deal.status === 'PUBLISHED' ? <><FiPause size={12} /> Pause</> : <><FiPlay size={12} /> Resume</>}
                    </button>
                    <button onClick={() => openEdit(deal)} className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 hover:bg-blue-100 transition cursor-pointer flex items-center gap-1">
                      <FiEdit size={12} /> Edit
                    </button>
                    <button onClick={() => handleDuplicate(deal)} className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer" title="Duplicate"><FiCopy size={14} /></button>
                    <button onClick={() => setDeleteTarget(deal)} className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition cursor-pointer" title="Delete"><FiTrash2 size={14} /></button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/*   CREATE / EDIT SPECIAL DEAL MODAL                       */}
      {/* ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] shadow-2xl border border-gray-100 flex flex-col overflow-hidden">

              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 shrink-0">
                <div>
                  <h2 className="text-lg font-black text-gray-900">{editingDeal ? 'Edit Special Deal' : '+ Create Special Deal'}</h2>
                  <p className="text-xs text-gray-500">Configure deal banner, button links, background style, and selected products</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-200 text-gray-500 transition cursor-pointer"><FiX size={20} /></button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Deal Name *</label>
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Festive Special Deal" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-gold-500" />
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
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Deal details..." className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-gold-500 resize-none" />
                </div>

                {/* Banner Upload */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Deal Banner Image</label>
                  <div className="flex items-center gap-3">
                    {form.bannerUrl && (
                      <div className="w-24 h-16 rounded-xl overflow-hidden bg-gray-900 border shrink-0">
                        <img src={form.bannerUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <label className="flex-1 border-2 border-dashed border-gray-300 hover:border-gold-400 rounded-2xl p-4 text-center cursor-pointer bg-gray-50 transition-colors">
                      <FiUploadCloud size={24} className="mx-auto text-gold-500 mb-1" />
                      <span className="text-xs font-bold text-gray-700 block">Upload Banner (Drag & Drop or Gallery)</span>
                      <span className="text-[10px] text-gray-400 block">JPG, PNG, WEBP, AVIF (Max 20MB)</span>
                      <input type="file" accept="image/*" onChange={e => handleFileSelect(e.target.files?.[0])} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Button Text & Link */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Button Text</label>
                    <input type="text" value={form.buttonText} onChange={e => setForm({ ...form, buttonText: e.target.value })} placeholder="Shop Special Deal" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-gold-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Button Link</label>
                    <input type="text" value={form.buttonLink} onChange={e => setForm({ ...form, buttonLink: e.target.value })} placeholder="/offers" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-gold-500 font-mono" />
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
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
                </div>

                {/* Schedule */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Start Date & Time (Optional)</label>
                    <input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">End Date & Time (Optional)</label>
                    <input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none" />
                  </div>
                </div>

                {/* Selected Products */}
                <div className="border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-gray-900">Featured Products ({form.productIds.length} Selected)</h4>
                      <p className="text-[10px] text-gray-400">Only selected products will appear inside this Special Deal section</p>
                    </div>
                    <button type="button" onClick={() => setProductSelectorOpen(true)} className="px-3 py-1.5 rounded-xl bg-gold-500 text-black text-xs font-extrabold hover:bg-gold-400 transition cursor-pointer flex items-center gap-1">
                      <FiPlus size={13} /> Select Products ({products.length} available)
                    </button>
                  </div>

                  {form.productIds.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                      {form.productIds.map(id => {
                        const p = products.find(prod => prod.id === id);
                        if (!p) return null;
                        return (
                          <div key={id} className="flex items-center gap-2 p-2 rounded-xl border border-gray-100 bg-gray-50 text-xs">
                            <img src={p.images?.[0]?.url || 'https://placehold.co/40'} alt="" className="w-8 h-8 rounded-lg object-cover bg-white shrink-0 border" />
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-900 text-[11px] truncate">{p.name}</p>
                              <p className="text-[10px] text-gray-400">{formatCurrency(p.discountPrice || p.price)}</p>
                            </div>
                            <button type="button" onClick={() => toggleProductSelect(id)} className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"><FiX size={14} /></button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-xl border">No products selected for this Special Deal yet.</p>
                  )}
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-100">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition cursor-pointer">Cancel</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 text-black text-xs font-extrabold shadow-md hover:shadow-lg transition cursor-pointer">
                    {editingDeal ? 'Update Special Deal' : 'Publish Special Deal'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Selector Sub-Modal */}
      <AnimatePresence>
        {productSelectorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-3xl max-h-[88vh] shadow-2xl border border-gray-100 flex flex-col overflow-hidden">

              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 shrink-0">
                <div>
                  <h3 className="font-black text-gray-900 text-base">Select Products for Special Deal</h3>
                  <p className="text-xs text-gray-500">{form.productIds.length} of {products.length} products selected</p>
                </div>
                <button onClick={() => setProductSelectorOpen(false)} className="p-2 rounded-xl hover:bg-gray-200 text-gray-500 transition cursor-pointer"><FiX size={18} /></button>
              </div>

              <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3 shrink-0">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search product name..." className="w-full pl-8 pr-4 py-2 rounded-xl border text-xs outline-none" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 divide-y divide-gray-100">
                {filteredProductsForSelector.map(product => {
                  const isSelected = form.productIds.includes(product.id);
                  return (
                    <div key={product.id} onClick={() => toggleProductSelect(product.id)} className={`flex items-center gap-3 p-3 rounded-2xl transition cursor-pointer ${isSelected ? 'bg-gold-50/80 border border-gold-200' : 'hover:bg-gray-50'}`}>
                      <input type="checkbox" checked={isSelected} onChange={() => {}} className="rounded text-gold-500 w-4 h-4 cursor-pointer" />
                      <img src={product.images?.[0]?.url || 'https://placehold.co/40'} alt="" className="w-10 h-10 rounded-xl object-cover bg-white shrink-0 border" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-xs truncate">{product.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{product.sku}</p>
                      </div>
                      <p className="text-xs font-black text-gray-900 shrink-0">{formatCurrency(product.discountPrice || product.price)}</p>
                    </div>
                  );
                })}
              </div>

              <div className="px-6 py-3 border-t border-gray-100 flex justify-end shrink-0 bg-gray-50">
                <button type="button" onClick={() => setProductSelectorOpen(false)} className="px-5 py-2 rounded-xl bg-gold-500 text-black text-xs font-extrabold hover:bg-gold-400 transition cursor-pointer">
                  Done ({form.productIds.length} Selected)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Cropper */}
      <GlobalImageEditor
        isOpen={cropperOpen}
        onClose={() => setCropperOpen(false)}
        imageSrc={cropperSrc}
        onComplete={url => { setForm({ ...form, bannerUrl: url }); toast.success('Banner cropped & updated! ✨'); }}
        aspectRatio={16/9}
        title="Edit Deal Image"
        showFileSelect={false}
      />

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border">
              <h3 className="font-bold text-gray-900 text-base mb-2">Delete Special Deal</h3>
              <p className="text-xs text-gray-600 mb-5">Are you sure you want to delete <strong>&quot;{deleteTarget.name}&quot;</strong>?</p>
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

export default SpecialDealsManager;
