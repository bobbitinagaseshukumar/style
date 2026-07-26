import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/common/Button';
import api from '../../config/api';
import { formatDate } from '../../utils/formatDate';
import BannerCropperModal from '../Banner/BannerCropperModal';
import {
  FiPlus, FiTrash2, FiEdit, FiSearch, FiX, FiCopy, FiCheck,
  FiStar, FiUploadCloud, FiCheckCircle, FiUser, FiMapPin,
  FiEye, FiEyeOff, FiToggleLeft, FiToggleRight, FiMessageSquare
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const fadeInUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -14 } };

const CustomerReviewsManager = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [masterEnabled, setMasterEnabled] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  // Form State
  const [form, setForm] = useState({
    customerName: 'Priya Sharma',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    productPurchased: 'Kanjivaram Silk Saree',
    rating: 5,
    heading: 'Absolutely Royal & Elegant!',
    comment: 'The quality of the silk and zari border is stunning. Wrapped in luxury packaging!',
    isVerified: true,
    location: 'Mumbai, India',
    status: 'PUBLISHED',
    isActive: true,
  });

  // Cropper
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState(null);

  // Delete Target
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ─── FETCH REVIEWS & STORE SETTINGS ───────────────────── */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [revRes, setRes] = await Promise.allSettled([
        api.get('/cms/reviews/admin/all'),
        api.get('/cms/settings'),
      ]);

      if (revRes.status === 'fulfilled') setReviews(revRes.value.data?.data || []);
      if (setRes.status === 'fulfilled') {
        const cfg = setRes.value.data?.data || {};
        setMasterEnabled(cfg.enableCustomerReviews !== false);
      }
    } catch { toast.error('Failed to load reviews'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ─── TOGGLE MASTER SWITCH ──────────────────────────────── */
  const handleToggleMaster = async () => {
    const nextVal = !masterEnabled;
    try {
      await api.put('/cms/settings', { enableCustomerReviews: nextVal });
      setMasterEnabled(nextVal);
      toast.success(nextVal ? 'Customer Reviews section Enabled' : 'Customer Reviews section Disabled');
    } catch { toast.error('Failed to update setting'); }
  };

  /* ─── OPEN MODAL ────────────────────────────────────────── */
  const openCreate = () => {
    setEditingReview(null);
    setForm({
      customerName: 'Priya Sharma',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      productPurchased: 'Kanjivaram Silk Saree',
      rating: 5,
      heading: 'Absolutely Royal & Elegant!',
      comment: 'The quality of the silk and zari border is stunning. Wrapped in luxury packaging!',
      isVerified: true,
      location: 'Mumbai, India',
      status: 'PUBLISHED',
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (rev) => {
    setEditingReview(rev);
    setForm({
      customerName: rev.customerName || '',
      avatarUrl: rev.avatarUrl || '',
      productPurchased: rev.productPurchased || '',
      rating: rev.rating || 5,
      heading: rev.heading || '',
      comment: rev.comment || '',
      isVerified: rev.isVerified !== false,
      location: rev.location || '',
      status: rev.status || 'PUBLISHED',
      isActive: rev.isActive !== false,
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
    if (!form.customerName.trim() || !form.comment.trim()) { toast.error('Name & Comment are required'); return; }

    try {
      if (editingReview) {
        await api.put(`/cms/reviews/${editingReview.id}`, form);
        toast.success('Review updated! ⭐');
      } else {
        await api.post('/cms/reviews', form);
        toast.success('Review created! 🎉');
      }
      setModalOpen(false);
      fetchData();
    } catch { toast.error('Failed to save review'); }
  };

  const handleTogglePublish = async (rev) => {
    const newStatus = rev.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED';
    try {
      await api.put(`/cms/reviews/${rev.id}`, { status: newStatus, isActive: newStatus === 'PUBLISHED' });
      toast.success(newStatus === 'PUBLISHED' ? 'Review published' : 'Review hidden');
      fetchData();
    } catch { toast.error('Failed to toggle review'); }
  };

  const handleDuplicate = async (rev) => {
    try {
      await api.post(`/cms/reviews/${rev.id}/duplicate`);
      toast.success('Review duplicated as Draft');
      fetchData();
    } catch { toast.error('Duplicate failed'); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/cms/reviews/${deleteTarget.id}`);
      toast.success('Review deleted');
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
            <h1 className="text-2xl font-black text-gray-900">Customer Reviews Manager</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-black border border-amber-200">⭐ REVIEWS & TESTIMONIALS</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Control customer testimonials, star ratings, verified badges, and display visibility</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Master Switch */}
          <button onClick={handleToggleMaster} className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black border transition cursor-pointer ${masterEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            {masterEnabled ? <FiToggleRight size={20} className="text-emerald-600" /> : <FiToggleLeft size={20} className="text-gray-400" />}
            {masterEnabled ? 'Reviews Section ENABLED' : 'Reviews Section DISABLED'}
          </button>

          <Button icon={FiPlus} onClick={openCreate}>+ Add New Review</Button>
        </div>
      </div>

      {/* Warning banner if master disabled */}
      {!masterEnabled && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
          <FiMessageSquare size={16} />
          Customer Reviews section is currently <strong>DISABLED</strong>. The reviews block will be hidden on the customer website.
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border rounded-2xl p-4 animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-100" />
              <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-1/3" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white border rounded-3xl p-16 text-center shadow-sm">
          <FiStar size={40} className="text-amber-400 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 text-lg mb-1">No Reviews Added Yet</h3>
          <p className="text-xs text-gray-400 mb-5">Create verified customer reviews and display star ratings on your homepage.</p>
          <Button icon={FiPlus} onClick={openCreate}>Add First Review</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map(rev => (
            <motion.div key={rev.id} layout variants={fadeInUp} initial="initial" animate="animate"
              className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img src={rev.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.customerName)}&background=D4AF37&color=fff`} alt="" className="w-12 h-12 rounded-full object-cover border" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-gray-900 text-sm">{rev.customerName}</h4>
                        {rev.isVerified && <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5"><FiCheckCircle size={10} /> Verified</span>}
                      </div>
                      <p className="text-[11px] text-gray-400">{rev.location || 'Customer'} • {rev.productPurchased || 'Purchased Item'}</p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, idx) => (
                      <FiStar key={idx} size={14} className={idx < rev.rating ? 'fill-amber-400' : 'text-gray-200'} />
                    ))}
                  </div>
                </div>

                {rev.heading && <h5 className="font-bold text-gray-900 text-xs mb-1">&quot;{rev.heading}&quot;</h5>}
                <p className="text-xs text-gray-600 italic bg-gray-50 p-3 rounded-2xl border border-gray-100">&quot;{rev.comment}&quot;</p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${rev.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {rev.status}
                </span>

                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleTogglePublish(rev)} className="px-3 py-1 rounded-xl text-xs font-bold border border-gray-200 hover:bg-gray-100 cursor-pointer">
                    {rev.status === 'PUBLISHED' ? 'Hide' : 'Publish'}
                  </button>
                  <button onClick={() => openEdit(rev)} className="p-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer"><FiEdit size={13} /></button>
                  <button onClick={() => handleDuplicate(rev)} className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 cursor-pointer"><FiCopy size={13} /></button>
                  <button onClick={() => setDeleteTarget(rev)} className="p-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 cursor-pointer"><FiTrash2 size={13} /></button>
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
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/80">
                <h2 className="font-black text-gray-900 text-base">{editingReview ? 'Edit Review' : '+ Add New Review'}</h2>
                <button onClick={() => setModalOpen(false)}><FiX size={20} /></button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Customer Name *</label>
                    <input type="text" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} required className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Star Rating (1-5)</label>
                    <select value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })} className="w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white">
                      <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                      <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                      <option value={3}>⭐⭐⭐ (3 Stars)</option>
                      <option value={2}>⭐⭐ (2 Stars)</option>
                      <option value={1}>⭐ (1 Star)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Profile Photo (Upload + Crop)</label>
                  <div className="flex items-center gap-3">
                    <img src={form.avatarUrl || 'https://placehold.co/50'} alt="" className="w-12 h-12 rounded-full object-cover border" />
                    <label className="flex-1 border-2 border-dashed rounded-2xl p-3 text-center cursor-pointer bg-gray-50">
                      <FiUploadCloud size={20} className="mx-auto text-amber-500 mb-0.5" />
                      <span className="text-xs font-bold text-gray-700">Choose Profile Photo</span>
                      <input type="file" accept="image/*" onChange={e => handleFileSelect(e.target.files?.[0])} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Product Purchased</label>
                    <input type="text" value={form.productPurchased} onChange={e => setForm({ ...form, productPurchased: e.target.value })} placeholder="Kanjivaram Silk Saree" className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Location (Optional)</label>
                    <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Mumbai, India" className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Review Heading</label>
                  <input type="text" value={form.heading} onChange={e => setForm({ ...form, heading: e.target.value })} placeholder="Absolutely Royal!" className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none" />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Review Comment *</label>
                  <textarea value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} rows={3} required placeholder="Detailed review content..." className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none resize-none" />
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isVerified} onChange={e => setForm({ ...form, isVerified: e.target.checked })} className="rounded text-amber-500" />
                    <span className="text-xs font-bold text-gray-700">Verified Purchase Badge</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-3 border-t">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl border text-xs font-semibold">Cancel</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-amber-500 text-black text-xs font-extrabold">{editingReview ? 'Update Review' : 'Publish Review'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BannerCropperModal isOpen={cropperOpen} onClose={() => setCropperOpen(false)} imageSrc={cropperSrc} onCropComplete={url => { setForm({ ...form, avatarUrl: url }); toast.success('Photo updated!'); }} />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border shadow-2xl">
            <h3 className="font-bold text-base mb-2">Delete Review</h3>
            <p className="text-xs text-gray-600 mb-4">Permanently delete review by &quot;{deleteTarget.customerName}&quot;?</p>
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

export default CustomerReviewsManager;
