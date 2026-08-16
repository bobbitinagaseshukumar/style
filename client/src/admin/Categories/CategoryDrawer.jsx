import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiUploadCloud, FiCrop, FiCheck, FiHome, FiGlobe,
  FiEye, FiTag, FiCheckSquare, FiAlertCircle, FiSmartphone, FiMonitor
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../config/api';
import GlobalImageEditor from '../../components/common/GlobalImageEditor';

const CategoryDrawer = ({ isOpen, onClose, editCategory = null, onSaved }) => {
  const [form, setForm] = useState({
    name: '',
    shortDesc: '',
    description: '',
    image: '',
    banner: '',
    status: 'PUBLISHED',
    showOnHomepage: true,
    inNavMenu: true,
    inMegaMenu: true,
    inSearchFilters: true,
    inMobileMenu: true,
    isFeaturedCategory: false,
    isTrendingCategory: false,
    isLuxuryCollection: false,
    isNewCollection: false,
    isFestivalCollection: false,
    isPremiumCollection: false,
    sortOrder: 0,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  });

  const [cropperModal, setCropperModal] = useState({ open: false, target: 'image', aspect: 1 });
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop' | 'mobile'

  useEffect(() => {
    if (editCategory) {
      setForm({
        name: editCategory.name || '',
        shortDesc: editCategory.shortDesc || '',
        description: editCategory.description || '',
        image: editCategory.image || '',
        banner: editCategory.banner || '',
        status: (editCategory.status || 'PUBLISHED').toUpperCase(),
        showOnHomepage: editCategory.showOnHomepage !== false,
        inNavMenu: editCategory.inNavMenu !== false,
        inMegaMenu: editCategory.inMegaMenu !== false,
        inSearchFilters: editCategory.inSearchFilters !== false,
        inMobileMenu: editCategory.inMobileMenu !== false,
        isFeaturedCategory: editCategory.isFeaturedCategory || false,
        isTrendingCategory: editCategory.isTrendingCategory || false,
        isLuxuryCollection: editCategory.isLuxuryCollection || false,
        isNewCollection: editCategory.isNewCollection || false,
        isFestivalCollection: editCategory.isFestivalCollection || false,
        isPremiumCollection: editCategory.isPremiumCollection || false,
        sortOrder: editCategory.sortOrder || 0,
        seoTitle: editCategory.seoTitle || '',
        seoDescription: editCategory.seoDescription || '',
        seoKeywords: editCategory.seoKeywords || '',
      });
    } else {
      setForm({
        name: '', shortDesc: '', description: '', image: '', banner: '',
        status: 'PUBLISHED', showOnHomepage: true, inNavMenu: true, inMegaMenu: true,
        inSearchFilters: true, inMobileMenu: true, isFeaturedCategory: false,
        isTrendingCategory: false, isLuxuryCollection: false, isNewCollection: false,
        isFestivalCollection: false, isPremiumCollection: false, sortOrder: 0,
        seoTitle: '', seoDescription: '', seoKeywords: ''
      });
    }
  }, [editCategory]);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // Open cropper for category image or banner
  const openCropperFor = (target) => {
    setCropperModal({
      open: true,
      target,
      aspect: target === 'banner' ? 3 / 1 : 1
    });
  };

  const handleCropComplete = (croppedUrl) => {
    handleChange(cropperModal.target, croppedUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.name.trim()) {
      toast.error('Category Name is required');
      return;
    }
    if (!form.image) {
      toast.error('Please upload and crop a Category Image from your device');
      return;
    }

    try {
      setSaving(true);
      if (editCategory) {
        await api.put(`/categories/${editCategory.id}`, form);
        toast.success(`Category "${form.name}" updated successfully!`);
      } else {
        await api.post('/categories', form);
        toast.success(`Category "${form.name}" published successfully!`);
      }
      try {
        localStorage.removeItem('__KVLR_HOME_PERSISTENT_CACHE_V3__');
        sessionStorage.removeItem('__KVLR_HOME_CACHE__');
        sessionStorage.removeItem('__KVLR_MEGA_CACHE__');
        window.dispatchEvent(new Event('kvlr:content-updated'));
      } catch (e) {}
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-white w-full max-w-4xl h-full shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {editCategory ? `Edit Category: ${editCategory.name}` : 'Create New Category'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Device image upload, cropping, homepage visibility & placement controls</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-200 transition">
            <FiX size={20} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Form Inputs */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">

            {/* 1. Category Details */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
              <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider">1. Category Details</h3>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Category Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Royal Silk Sarees"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Short Description</label>
                <input
                  type="text"
                  value={form.shortDesc}
                  onChange={(e) => handleChange('shortDesc', e.target.value)}
                  placeholder="e.g. Handcrafted wedding & festive silks"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Full Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Detailed description for category page header..."
                  rows={2}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 bg-white resize-none"
                />
              </div>
            </div>

            {/* 2. Device Image Upload & Cropper */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
              <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider">2. Images (Device Upload & Cropper)</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Main Category Image Upload */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">Category Thumbnail *</label>
                  {form.image ? (
                    <div className="relative group rounded-2xl overflow-hidden border border-gray-200 h-36 bg-white flex items-center justify-center">
                      <img src={form.image} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => openCropperFor('image')}
                        className="absolute inset-0 bg-black/50 text-white font-bold text-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FiCrop /> Crop / Re-upload
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openCropperFor('image')}
                      className="w-full h-36 rounded-2xl border-2 border-dashed border-gray-300 hover:border-amber-400 bg-white flex flex-col items-center justify-center p-4 text-center transition cursor-pointer"
                    >
                      <FiUploadCloud size={24} className="text-amber-500 mb-1" />
                      <span className="text-xs font-bold text-gray-800">Upload & Crop Photo</span>
                      <span className="text-[10px] text-gray-400">From Computer or Mobile</span>
                    </button>
                  )}
                </div>

                {/* Banner Image Upload */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">Category Banner (Optional)</label>
                  {form.banner ? (
                    <div className="relative group rounded-2xl overflow-hidden border border-gray-200 h-36 bg-white flex items-center justify-center">
                      <img src={form.banner} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => openCropperFor('banner')}
                        className="absolute inset-0 bg-black/50 text-white font-bold text-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FiCrop /> Crop / Re-upload
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openCropperFor('banner')}
                      className="w-full h-36 rounded-2xl border-2 border-dashed border-gray-300 hover:border-amber-400 bg-white flex flex-col items-center justify-center p-4 text-center transition cursor-pointer"
                    >
                      <FiUploadCloud size={24} className="text-amber-500 mb-1" />
                      <span className="text-xs font-bold text-gray-800">Upload Banner</span>
                      <span className="text-[10px] text-gray-400">Landscape 3:1 aspect ratio</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Home Page Visibility Toggle */}
            <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent p-5 rounded-2xl border border-amber-200/60">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-2.5">
                  <FiHome className="text-amber-500 mt-0.5" size={18} />
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs">Home Page Visibility Control</h4>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      Disabling this removes the category <strong>ONLY from the Home Page</strong> while keeping it visible in Navigation, Search, Category listings & Products!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleChange('showOnHomepage', !form.showOnHomepage)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                    form.showOnHomepage ? 'bg-amber-400 text-black shadow-sm' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {form.showOnHomepage ? '✓ Shown on Home' : 'Hidden from Home'}
                </button>
              </div>
            </div>

            {/* 4. Category Status & Placement Badges */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
              <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider">4. Publishing Status & Section Badges</h3>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 bg-white font-bold"
                >
                  <option value="PUBLISHED">Published (Visible to all customers)</option>
                  <option value="DRAFT">Draft (Admin only)</option>
                  <option value="HIDDEN">Hidden (Database only)</option>
                  <option value="ARCHIVED">Archived (Preserved for future)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'isFeaturedCategory', label: '⭐ Featured Category' },
                  { key: 'isTrendingCategory', label: '🔥 Trending Category' },
                  { key: 'isLuxuryCollection', label: '👑 Luxury Collection' },
                  { key: 'isNewCollection', label: '✨ New Collection' },
                  { key: 'isFestivalCollection', label: '🪔 Festival Collection' },
                  { key: 'isPremiumCollection', label: '💎 Premium Collection' },
                ].map((b) => (
                  <button
                    key={b.key}
                    type="button"
                    onClick={() => handleChange(b.key, !form[b.key])}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      form[b.key] ? 'border-amber-400 bg-amber-50 text-amber-950' : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    <span>{b.label}</span>
                    {form[b.key] && <FiCheck className="text-amber-600" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Navigation Visibility Toggles */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3">
              <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider">5. Navigation Visibility</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'inNavMenu', label: 'Header Navigation Menu' },
                  { key: 'inMegaMenu', label: 'Mega Menu Dropdown' },
                  { key: 'inSearchFilters', label: 'Search & Sidebar Filters' },
                  { key: 'inMobileMenu', label: 'Mobile Drawer Menu' },
                ].map((n) => (
                  <label key={n.key} className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-xl border border-gray-200">
                    <input
                      type="checkbox"
                      checked={form[n.key]}
                      onChange={(e) => handleChange(n.key, e.target.checked)}
                      className="rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                    />
                    <span className="font-medium text-gray-700">{n.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 6. SEO Meta */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3">
              <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider">6. SEO Meta Settings</h3>
              <input
                type="text"
                value={form.seoTitle}
                onChange={(e) => handleChange('seoTitle', e.target.value)}
                placeholder="SEO Title (e.g. Pure Silk Sarees Online — StyleVerse)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 bg-white"
              />
              <textarea
                value={form.seoDescription}
                onChange={(e) => handleChange('seoDescription', e.target.value)}
                placeholder="SEO Description for search engines..."
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 bg-white resize-none"
              />
            </div>
          </form>

          {/* Right Column: Live Storefront Preview */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-0 bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider flex items-center gap-1.5">
                  <FiEye className="text-amber-500" /> Live Storefront Preview
                </h3>

                <div className="flex bg-gray-200 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('desktop')}
                    className={`p-1.5 rounded-md text-xs font-bold ${previewMode === 'desktop' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                  >
                    <FiMonitor size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('mobile')}
                    className={`p-1.5 rounded-md text-xs font-bold ${previewMode === 'mobile' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                  >
                    <FiSmartphone size={14} />
                  </button>
                </div>
              </div>

              {/* Preview Card */}
              <div className={`mx-auto transition-all ${previewMode === 'mobile' ? 'max-w-[260px]' : 'w-full'}`}>
                <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-md">
                  {/* Banner */}
                  {form.banner ? (
                    <img src={form.banner} alt="" className="w-full h-24 object-cover" />
                  ) : (
                    <div className="w-full h-20 bg-gradient-to-r from-charcoal-900 to-amber-900 flex items-center justify-center text-white/40 text-[10px]">
                      No Banner Uploaded
                    </div>
                  )}

                  {/* Thumbnail & Title */}
                  <div className="p-4 flex items-center gap-3">
                    {form.image ? (
                      <img src={form.image} alt="" className="w-12 h-12 rounded-xl object-cover border border-amber-300 shrink-0 shadow" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-xs shrink-0">
                        No Photo
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 text-xs truncate">{form.name || 'Category Name'}</h4>
                      <p className="text-[10px] text-gray-400 truncate">{form.shortDesc || 'Short category description...'}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="px-4 pb-3 flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[9px]">
                      {form.status}
                    </span>
                    {form.showOnHomepage && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[9px]">
                        Home Page Visible
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            {saving ? 'Publishing...' : (editCategory ? 'Save Changes' : 'Publish Category')}
          </button>
        </div>
      </motion.div>

      {/* Image Cropper Modal */}
      <GlobalImageEditor
        isOpen={cropperModal.open}
        title={`Crop ${cropperModal.target === 'banner' ? 'Category Banner' : 'Category Thumbnail'}`}
        aspectRatio={cropperModal.aspect}
        aspectPresets={
          cropperModal.target === 'banner'
            ? [
                { label: '3:1', value: 3 },
                { label: '16:9', value: 16 / 9 },
                { label: '4:3', value: 4 / 3 }
              ]
            : [
                { label: '1:1', value: 1 },
                { label: '3:4', value: 3 / 4 },
                { label: '4:5', value: 4 / 5 }
              ]
        }
        onClose={() => setCropperModal({ ...cropperModal, open: false })}
        onComplete={(url) => handleCropComplete(url)}
        showFileSelect={true}
      />
    </div>
  );
};

export default CategoryDrawer;
