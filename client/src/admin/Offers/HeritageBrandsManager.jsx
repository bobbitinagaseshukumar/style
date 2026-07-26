import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/common/Button';
import api from '../../config/api';
import BannerCropperModal from '../Banner/BannerCropperModal';
import {
  FiPlus, FiTrash2, FiEdit, FiX, FiCopy, FiCheck,
  FiUploadCloud, FiToggleLeft, FiToggleRight, FiAward,
  FiGlobe, FiExternalLink
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const fadeInUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -14 } };

const HeritageBrandsManager = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [masterEnabled, setMasterEnabled] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: 'Royal Kanjivaram Weavers',
    logoUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200',
    bannerUrl: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800',
    description: 'Century-old heritage silk weaving traditions from South India.',
    brandStory: 'Passed down through five generations of master artisans.',
    website: 'https://styleverse.com/brands/kanjivaram',
    category: 'Silk Sarees',
    buttonText: 'Shop Brand Collection',
    priority: 10,
    status: 'PUBLISHED',
    isActive: true,
  });

  // Cropper
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState(null);
  const [cropTargetField, setCropTargetField] = useState('logoUrl');

  // Delete Target
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ─── FETCH ─────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [brandRes, setRes] = await Promise.allSettled([
        api.get('/cms/heritage-brands/admin/all'),
        api.get('/cms/settings'),
      ]);

      if (brandRes.status === 'fulfilled') setBrands(brandRes.value.data?.data || []);
      if (setRes.status === 'fulfilled') {
        const cfg = setRes.value.data?.data || {};
        setMasterEnabled(cfg.enableHeritageBrands !== false);
      }
    } catch { toast.error('Failed to load heritage brands'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleMaster = async () => {
    const nextVal = !masterEnabled;
    try {
      await api.put('/cms/settings', { enableHeritageBrands: nextVal });
      setMasterEnabled(nextVal);
      toast.success(nextVal ? 'Heritage Brands section ENABLED' : 'Heritage Brands section DISABLED');
    } catch { toast.error('Failed to update setting'); }
  };

  const openCreate = () => {
    setEditingBrand(null);
    setForm({
      name: 'Royal Kanjivaram Weavers',
      logoUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200',
      bannerUrl: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800',
      description: 'Century-old heritage silk weaving traditions from South India.',
      brandStory: 'Passed down through five generations of master artisans.',
      website: 'https://styleverse.com/brands/kanjivaram',
      category: 'Silk Sarees',
      buttonText: 'Shop Brand Collection',
      priority: 10,
      status: 'PUBLISHED',
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (brand) => {
    setEditingBrand(brand);
    setForm({
      name: brand.name || '',
      logoUrl: brand.logoUrl || '',
      bannerUrl: brand.bannerUrl || '',
      description: brand.description || '',
      brandStory: brand.brandStory || '',
      website: brand.website || '',
      category: brand.category || '',
      buttonText: brand.buttonText || 'Shop Now',
      priority: brand.priority || 0,
      status: brand.status || 'PUBLISHED',
      isActive: brand.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleFileSelect = (file, field) => {
    if (!file) return;
    setCropTargetField(field);
    const reader = new FileReader();
    reader.onload = () => { setCropperSrc(reader.result); setCropperOpen(true); };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Brand name required'); return; }

    try {
      if (editingBrand) {
        await api.put(`/cms/heritage-brands/${editingBrand.id}`, form);
        toast.success('Heritage Brand updated!');
      } else {
        await api.post('/cms/heritage-brands', form);
        toast.success('Heritage Brand added!');
      }
      setModalOpen(false);
      fetchData();
    } catch { toast.error('Failed to save brand'); }
  };

  const handleTogglePublish = async (brand) => {
    const newStatus = brand.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED';
    try {
      await api.put(`/cms/heritage-brands/${brand.id}`, { status: newStatus, isActive: newStatus === 'PUBLISHED' });
      toast.success(newStatus === 'PUBLISHED' ? 'Brand published' : 'Brand hidden');
      fetchData();
    } catch { toast.error('Failed to toggle status'); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/cms/heritage-brands/${deleteTarget.id}`);
      toast.success('Heritage Brand deleted');
      setDeleteTarget(null);
      fetchData();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  /* ═══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900">Featured Heritage Brands Manager</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-black border border-amber-200">👑 LUXURY HERITAGE</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Showcase artisanal heritage brands, brand stories, logos, banners, and collection links</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleToggleMaster} className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black border transition cursor-pointer ${masterEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            {masterEnabled ? <FiToggleRight size={20} className="text-emerald-600" /> : <FiToggleLeft size={20} className="text-gray-400" />}
            {masterEnabled ? 'Heritage Section ENABLED' : 'Heritage Section DISABLED'}
          </button>
          <Button icon={FiPlus} onClick={openCreate}>+ Add Heritage Brand</Button>
        </div>
      </div>

      {!masterEnabled && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
          <FiAward size={16} />
          Heritage Brands section is currently <strong>DISABLED</strong>. Heritage brands will not appear on the customer homepage.
        </div>
      )}

      {/* Brands Grid */}
      {loading ? (
        <div className="p-8 text-center text-gray-400">Loading brands...</div>
      ) : brands.length === 0 ? (
        <div className="bg-white border rounded-3xl p-16 text-center shadow-sm">
          <FiAward size={40} className="text-amber-500 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 text-lg mb-1">No Heritage Brands Created Yet</h3>
          <p className="text-xs text-gray-400 mb-5">Create featured heritage brands and highlight artisanal craftsmanship on your storefront.</p>
          <Button icon={FiPlus} onClick={openCreate}>Add Heritage Brand</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map(brand => (
            <motion.div key={brand.id} layout variants={fadeInUp} initial="initial" animate="animate"
              className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
              <div>
                <div className="aspect-[2.2/1] rounded-2xl overflow-hidden bg-gray-900 border mb-3 relative">
                  {brand.bannerUrl && <img src={brand.bannerUrl} alt="" className="w-full h-full object-cover opacity-80" />}
                  {brand.logoUrl && (
                    <img src={brand.logoUrl} alt="" className="absolute bottom-2 left-2 w-10 h-10 rounded-xl object-cover border-2 border-white shadow-md bg-white" />
                  )}
                </div>

                <h3 className="font-bold text-gray-900 text-base">{brand.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{brand.description || 'No description'}</p>
                {brand.category && <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-2">{brand.category}</span>}
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${brand.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600'}`}>
                  {brand.status}
                </span>

                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleTogglePublish(brand)} className="px-3 py-1 rounded-xl text-xs font-bold border hover:bg-gray-100">
                    {brand.status === 'PUBLISHED' ? 'Hide' : 'Publish'}
                  </button>
                  <button onClick={() => openEdit(brand)} className="p-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"><FiEdit size={13} /></button>
                  <button onClick={() => setDeleteTarget(brand)} className="p-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"><FiTrash2 size={13} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl border flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/80">
                <h2 className="font-black text-gray-900 text-base">{editingBrand ? 'Edit Heritage Brand' : '+ Add Heritage Brand'}</h2>
                <button onClick={() => setModalOpen(false)}><FiX size={20} /></button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Brand Name *</label>
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Category</label>
                    <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Silk Sarees" className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Brand Logo (Upload + Crop)</label>
                  <label className="border-2 border-dashed rounded-2xl p-3 text-center cursor-pointer bg-gray-50 block">
                    <FiUploadCloud size={20} className="mx-auto text-amber-500 mb-0.5" />
                    <span className="text-xs font-bold text-gray-700">Choose Brand Logo</span>
                    <input type="file" accept="image/*" onChange={e => handleFileSelect(e.target.files?.[0], 'logoUrl')} className="hidden" />
                  </label>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Brand Banner (Upload + Crop)</label>
                  <label className="border-2 border-dashed rounded-2xl p-3 text-center cursor-pointer bg-gray-50 block">
                    <FiUploadCloud size={20} className="mx-auto text-amber-500 mb-0.5" />
                    <span className="text-xs font-bold text-gray-700">Choose Brand Banner</span>
                    <input type="file" accept="image/*" onChange={e => handleFileSelect(e.target.files?.[0], 'bannerUrl')} className="hidden" />
                  </label>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none resize-none" />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Brand Story</label>
                  <textarea value={form.brandStory} onChange={e => setForm({ ...form, brandStory: e.target.value })} rows={2} placeholder="Artisanal heritage history..." className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Website URL</label>
                    <input type="url" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://styleverse.com/brand" className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none font-mono" />
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

                <div className="flex gap-3 pt-3 border-t">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl border text-xs font-semibold">Cancel</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-amber-500 text-black text-xs font-extrabold">{editingBrand ? 'Update Brand' : 'Publish Brand'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BannerCropperModal isOpen={cropperOpen} onClose={() => setCropperOpen(false)} imageSrc={cropperSrc} onCropComplete={url => { setForm({ ...form, [cropTargetField]: url }); toast.success('Image cropped!'); }} />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border shadow-2xl">
            <h3 className="font-bold text-base mb-2">Delete Heritage Brand</h3>
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

export default HeritageBrandsManager;
