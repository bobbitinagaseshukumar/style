import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/common/Button';
import api from '../../config/api';
import { formatCurrency } from '../../utils/formatCurrency';
import GlobalImageEditor from '../../components/common/GlobalImageEditor';
import {
  FiPlus, FiTrash2, FiEdit, FiSearch, FiX, FiCopy, FiCheck,
  FiLayers, FiImage, FiUploadCloud, FiPause, FiPlay
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const fadeInUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -14 } };

const ProductCollectionsManager = () => {
  const [collections, setCollections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCol, setEditingCol] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: 'Festive Collection',
    slug: 'festive-collection',
    description: 'Curated luxury festive wear',
    bannerUrl: '',
    productIds: [],
    status: 'PUBLISHED',
    isActive: true,
  });

  // Selector
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Cropper
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ─── FETCH ─────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [colRes, prodRes] = await Promise.allSettled([
        api.get('/cms/collections/admin/all'),
        api.get('/products?includeAll=true&limit=100'),
      ]);

      if (colRes.status === 'fulfilled') setCollections(colRes.value.data?.data || []);
      if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data?.data?.products || []);
    } catch { toast.error('Failed to load collections'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditingCol(null);
    setForm({
      name: 'Festive Collection',
      slug: 'festive-collection',
      description: 'Curated luxury festive wear',
      bannerUrl: '',
      productIds: [],
      status: 'PUBLISHED',
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (col) => {
    setEditingCol(col);
    let pIds = [];
    try { pIds = typeof col.productIds === 'string' ? JSON.parse(col.productIds) : (col.productIds || []); } catch { pIds = []; }
    setForm({
      name: col.name || '',
      slug: col.slug || '',
      description: col.description || '',
      bannerUrl: col.bannerUrl || '',
      productIds: pIds,
      status: col.status || 'PUBLISHED',
      isActive: col.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setCropperSrc(reader.result); setCropperOpen(true); };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Collection name required'); return; }

    try {
      const payload = { ...form, productIds: JSON.stringify(form.productIds) };
      if (editingCol) {
        await api.put(`/cms/collections/${editingCol.id}`, payload);
        toast.success(`"${form.name}" updated! ✨`);
      } else {
        await api.post('/cms/collections', payload);
        toast.success(`"${form.name}" created! 💎`);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) { toast.error('Failed to save collection'); }
  };

  const handleToggleStatus = async (col) => {
    const newStatus = col.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED';
    try {
      await api.put(`/cms/collections/${col.id}`, { status: newStatus, isActive: newStatus === 'PUBLISHED' });
      toast.success(`Collection set to ${newStatus}`);
      fetchData();
    } catch { toast.error('Failed to update status'); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/cms/collections/${deleteTarget.id}`);
      toast.success('Collection deleted');
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

  /* ═══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <FiLayers className="text-amber-500" /> Homepage Product Collections
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Create unlimited curated product collections displayed across the storefront</p>
        </div>
        <Button icon={FiPlus} onClick={openCreate}>+ Create Collection</Button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">Loading collections...</div>
      ) : collections.length === 0 ? (
        <div className="bg-white border rounded-3xl p-16 text-center shadow-sm">
          <FiLayers size={40} className="text-amber-500 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 text-lg mb-1">No Product Collections Created Yet</h3>
          <p className="text-xs text-gray-400 mb-5">Group products into collections like Festive, Bridal, Summer, and Luxury.</p>
          <Button icon={FiPlus} onClick={openCreate}>Create Product Collection</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map(col => {
            let pIds = [];
            try { pIds = typeof col.productIds === 'string' ? JSON.parse(col.productIds) : (col.productIds || []); } catch { pIds = []; }

            return (
              <motion.div key={col.id} layout variants={fadeInUp} initial="initial" animate="animate"
                className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  {col.bannerUrl ? (
                    <div className="aspect-[2/1] rounded-2xl overflow-hidden bg-gray-100 mb-3 border">
                      <img src={col.bannerUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-[2/1] rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-3">
                      <FiLayers size={32} className="text-amber-500" />
                    </div>
                  )}
                  <h3 className="font-bold text-gray-900 text-base">{col.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{col.description || 'No description'}</p>
                  <p className="text-[10px] text-amber-700 font-bold mt-2 bg-amber-50 px-2 py-0.5 rounded w-fit border border-amber-200">
                    📦 {pIds.length} Products
                  </p>
                </div>

                <div className="flex items-center gap-1.5 pt-4 mt-4 border-t border-gray-100 justify-end">
                  <button onClick={() => handleToggleStatus(col)} className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${col.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600'}`}>
                    {col.status}
                  </button>
                  <button onClick={() => openEdit(col)} className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"><FiEdit size={13} /></button>
                  <button onClick={() => setDeleteTarget(col)} className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"><FiTrash2 size={13} /></button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/80">
                <h2 className="font-black text-gray-900 text-base">{editingCol ? 'Edit Collection' : '+ Create Collection'}</h2>
                <button onClick={() => setModalOpen(false)}><FiX size={20} /></button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Collection Name *</label>
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white">
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                      <option value="HIDDEN">Hidden</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none resize-none" />
                </div>

                {/* Banner Upload */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Collection Banner Image</label>
                  <label className="border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer bg-gray-50 block">
                    <FiUploadCloud size={24} className="mx-auto text-amber-500 mb-1" />
                    <span className="text-xs font-bold text-gray-700 block">Upload Banner (Drag & Drop or Gallery)</span>
                    <input type="file" accept="image/*" onChange={e => handleFileSelect(e.target.files?.[0])} className="hidden" />
                  </label>
                </div>

                {/* Products */}
                <div className="border rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-xs">Products ({form.productIds.length} Selected)</h4>
                    <button type="button" onClick={() => setProductSelectorOpen(true)} className="px-3 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-bold">+ Choose Products</button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl border text-xs font-semibold">Cancel</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-amber-500 text-black text-xs font-extrabold">{editingCol ? 'Update' : 'Publish Collection'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Selector Sub-Modal */}
      <AnimatePresence>
        {productSelectorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] shadow-2xl border flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-sm">Select Products ({form.productIds.length} selected)</h3>
                <button onClick={() => setProductSelectorOpen(false)}><FiX size={18} /></button>
              </div>
              <div className="p-3 border-b">
                <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search products..." className="w-full px-3 py-2 border rounded-xl text-xs outline-none" />
              </div>
              <div className="flex-1 overflow-y-auto p-3 divide-y">
                {products.filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                  <div key={p.id} onClick={() => toggleProductSelect(p.id)} className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer text-xs">
                    <input type="checkbox" checked={form.productIds.includes(p.id)} onChange={() => {}} className="rounded text-amber-500 cursor-pointer" />
                    <img src={p.images?.[0]?.url || 'https://placehold.co/40'} alt="" className="w-8 h-8 rounded-lg object-cover border shrink-0" />
                    <p className="font-bold text-gray-900 truncate flex-1">{p.name}</p>
                    <p className="font-bold text-gray-900">{formatCurrency(p.discountPrice || p.price)}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t bg-gray-50 flex justify-end">
                <button onClick={() => setProductSelectorOpen(false)} className="px-4 py-2 bg-amber-500 text-black text-xs font-bold rounded-xl">Done</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <GlobalImageEditor isOpen={cropperOpen} onClose={() => setCropperOpen(false)} imageSrc={cropperSrc} onComplete={url => { setForm({ ...form, bannerUrl: url }); toast.success('Banner cropped!'); }} aspectRatio={16/9} title="Edit Collection Banner" showFileSelect={false} />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border shadow-2xl">
            <h3 className="font-bold text-base mb-2">Delete Collection</h3>
            <p className="text-xs text-gray-600 mb-4">Delete &quot;{deleteTarget.name}&quot;?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 border rounded-xl text-xs">Cancel</button>
              <button onClick={handleDeleteConfirm} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">{deleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCollectionsManager;
