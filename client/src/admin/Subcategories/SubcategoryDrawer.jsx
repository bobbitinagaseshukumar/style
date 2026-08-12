import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  FiX, FiUploadCloud, FiCheck, FiCrop, FiImage, FiGrid, FiLayers
} from 'react-icons/fi';
import api from '../../config/api';
import GlobalImageEditor from '../../components/common/GlobalImageEditor';

const SubcategoryDrawer = ({ isOpen, onClose, editSubcategory, categories = [], onSaved }) => {
  const [form, setForm] = useState({
    categoryId: '',
    name: '',
    slug: '',
    description: '',
    image: '',
    sortOrder: 0,
    status: 'PUBLISHED',
    isFeatured: false
  });

  const [saving, setSaving] = useState(false);
  const [cropperRawSrc, setCropperRawSrc] = useState(null);
  const [cropperOpen, setCropperOpen] = useState(false);

  useEffect(() => {
    if (editSubcategory) {
      setForm({
        categoryId: editSubcategory.categoryId || '',
        name: editSubcategory.name || '',
        slug: editSubcategory.slug || '',
        description: editSubcategory.description || '',
        image: editSubcategory.image || '',
        sortOrder: editSubcategory.sortOrder || 0,
        status: editSubcategory.status || 'PUBLISHED',
        isFeatured: editSubcategory.isFeatured || false
      });
    } else {
      setForm({
        categoryId: categories.length > 0 ? categories[0].id : '',
        name: '',
        slug: '',
        description: '',
        image: '',
        sortOrder: 0,
        status: 'PUBLISHED',
        isFeatured: false
      });
    }
  }, [editSubcategory, categories]);

  const handleNameChange = (val) => {
    const name = val;
    let slug = form.slug;
    if (!editSubcategory || !form.slug) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    setForm(prev => ({ ...prev, name, slug }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropperRawSrc(reader.result);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropDone = (croppedDataUrl) => {
    setForm(prev => ({ ...prev, image: croppedDataUrl }));
    toast.success('Subcategory image cropped & optimized! ✨');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.categoryId) {
      toast.error('Please select a Parent Category');
      return;
    }
    if (!form.name.trim()) {
      toast.error('Subcategory Name is required');
      return;
    }
    if (!form.image) {
      toast.error('Subcategory Image is required');
      return;
    }

    try {
      setSaving(true);
      if (editSubcategory) {
        await api.put(`/subcategories/${editSubcategory.id}`, form);
        toast.success(`Subcategory "${form.name}" updated!`);
      } else {
        await api.post('/subcategories', form);
        toast.success(`Subcategory "${form.name}" created!`);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Slide Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
          <div>
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <FiLayers className="text-amber-500" />
              {editSubcategory ? `Edit Subcategory: ${editSubcategory.name}` : 'Add New Subcategory'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Amazon/Flipkart style parent category binding & image studio</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
            <FiX size={16} />
          </button>
        </div>

        {/* Drawer Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Parent Category Dropdown (REQUIRED) */}
          <div>
            <label className="block font-bold text-gray-800 mb-1">
              Parent Category * <span className="text-gray-400 font-normal">(Select 1 Parent Category)</span>
            </label>
            <select
              required
              value={form.categoryId}
              onChange={e => setForm({ ...form, categoryId: e.target.value })}
              className="w-full p-3 border border-amber-300 rounded-xl text-xs font-bold bg-amber-50/20 focus:outline-none focus:border-amber-500"
            >
              <option value="">-- Select Parent Category --</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Subcategory Name & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-800 mb-1">Subcategory Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Shirts, Sarees, Kurtis"
                className="w-full p-2.5 border rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-800 mb-1">URL Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value })}
                className="w-full p-2.5 border rounded-xl bg-gray-50 font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Subcategory Description */}
          <div>
            <label className="block font-bold text-gray-800 mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Short description of this subcategory collection..."
              className="w-full p-2.5 border rounded-xl"
            />
          </div>

          {/* Subcategory Image Upload & Cropper Trigger */}
          <div>
            <label className="block font-bold text-gray-800 mb-1">
              Subcategory Image * <span className="text-gray-400 font-normal">(Device upload with cropper)</span>
            </label>
            {form.image ? (
              <div className="relative rounded-2xl overflow-hidden border border-amber-200 group">
                <img src={form.image} alt="Subcategory preview" className="w-full h-44 object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <label className="px-3 py-1.5 rounded-xl bg-white text-black font-bold text-xs cursor-pointer flex items-center gap-1">
                    <FiCrop size={14} /> Replace / Crop
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-gray-200 hover:border-amber-400 rounded-2xl p-6 text-center block cursor-pointer transition bg-gray-50/50">
                <FiUploadCloud size={32} className="mx-auto text-amber-500 mb-2" />
                <p className="font-bold text-gray-800">Click to upload subcategory image from device</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Built-in image cropper opens automatically</p>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}
          </div>

          {/* Display Order & Status Options */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block font-bold text-gray-800 mb-1">Display Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value || 0) })}
                className="w-full p-2.5 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-800 mb-1">Visibility Status</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full p-2.5 border rounded-xl bg-white font-bold"
              >
                <option value="PUBLISHED">PUBLISHED (Visible)</option>
                <option value="HIDDEN">HIDDEN (Disabled)</option>
              </select>
            </div>
          </div>

          {/* Featured Subcategory Switch */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={e => setForm({ ...form, isFeatured: e.target.checked })}
              className="rounded text-amber-500"
            />
            <div>
              <p className="font-bold text-gray-900">Featured Subcategory</p>
              <p className="text-[10px] text-gray-400">Showcase prominently on customer category navigation cards</p>
            </div>
          </label>

          {/* Drawer Footer Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-100 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border text-gray-600 font-semibold hover:bg-gray-100 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs shadow-md transition cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Subcategory'}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Cropper Modal */}
      <GlobalImageEditor
        isOpen={cropperOpen}
        imageSrc={cropperRawSrc}
        onClose={() => setCropperOpen(false)}
        onComplete={(url) => handleCropDone(url)}
        aspectRatio={1}
        aspectPresets={[
          { label: '1:1', value: 1 },
          { label: '3:4', value: 3/4 },
          { label: '4:5', value: 4/5 },
          { label: '16:9', value: 16/9 },
        ]}
        title="Crop Subcategory Image"
        showFileSelect={false}
      />
    </div>
  );
};

export default SubcategoryDrawer;
