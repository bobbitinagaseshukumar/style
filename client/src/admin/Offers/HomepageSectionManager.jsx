import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiEdit2, FiTrash2, FiCopy, FiEye, FiEyeOff, FiMove, FiCheck,
  FiSearch, FiFilter, FiCalendar, FiSmartphone, FiMonitor, FiGrid,
  FiList, FiUpload, FiArrowUp, FiArrowDown, FiLayers, FiImage
} from 'react-icons/fi';
import api from '../../config/api';
import BannerCropperModal from '../Banner/BannerCropperModal';

const LAYOUT_TYPES = [
  { id: 'GRID', name: 'Product Grid', icon: FiGrid, desc: 'Classic multi-column grid layout' },
  { id: 'SLIDER', name: 'Product Slider', icon: FiList, desc: 'Horizontal sliding showcase' },
  { id: 'CAROUSEL', name: 'Premium Carousel', icon: FiLayers, desc: 'Autoplay interactive carousel' },
  { id: 'TWO_COLUMN', name: 'Two Column Showcase', icon: FiGrid, desc: 'Side-by-side featured showcase' },
  { id: 'FEATURED', name: 'Large Featured Collection', icon: FiImage, desc: 'Hero collection style banner with products' },
];

const HomepageSectionManager = () => {
  const [sections, setSections] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('INFO'); // INFO | LAYOUT | BANNER | PRODUCTS | SCHEDULE
  const [searchQuery, setSearchQuery] = useState('');

  // Image Cropper State
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState(null);

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    subtitle: '',
    description: '',
    bannerUrl: '',
    layoutType: 'GRID',
    productIds: [],
    status: 'PUBLISHED',
    isActive: true,
    productsPerRow: 4,
    bgColor: '#FFFFFF',
    textColor: '#111827',
    buttonText: 'Explore Collection',
    buttonLink: '',
    startDate: '',
    endDate: '',
    devices: ['DESKTOP', 'TABLET', 'MOBILE'],
    sortOrder: 0,
  });

  // Product Filter State inside Modal
  const [prodSearch, setProdSearch] = useState('');
  const [prodCategory, setProdCategory] = useState('');

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [secRes, prodRes, catRes] = await Promise.allSettled([
        api.get('/cms/homepage/admin/all'),
        api.get('/products?limit=100'),
        api.get('/categories'),
      ]);

      if (secRes.status === 'fulfilled' && secRes.value.data?.success) {
        setSections(secRes.value.data.data || []);
      }
      if (prodRes.status === 'fulfilled' && prodRes.value.data?.data) {
        const prods = prodRes.value.data.data.products || prodRes.value.data.data || [];
        setAllProducts(prods);
      }
      if (catRes.status === 'fulfilled' && catRes.value.data?.data) {
        setCategories(catRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load homepage sections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      slug: '',
      subtitle: '',
      description: '',
      bannerUrl: '',
      layoutType: 'GRID',
      productIds: [],
      status: 'PUBLISHED',
      isActive: true,
      productsPerRow: 4,
      bgColor: '#FFFFFF',
      textColor: '#111827',
      buttonText: 'Explore Collection',
      buttonLink: '',
      startDate: '',
      endDate: '',
      devices: ['DESKTOP', 'TABLET', 'MOBILE'],
      sortOrder: sections.length,
    });
    setActiveTab('INFO');
    setIsModalOpen(true);
  };

  const openEditModal = (sec) => {
    setEditingId(sec.id);
    let pIds = [];
    try { pIds = typeof sec.productIds === 'string' ? JSON.parse(sec.productIds) : sec.productIds || []; } catch (e) { pIds = []; }
    let devs = ['DESKTOP', 'TABLET', 'MOBILE'];
    try { devs = typeof sec.devices === 'string' ? JSON.parse(sec.devices) : sec.devices || devs; } catch (e) {}

    setFormData({
      title: sec.title || '',
      slug: sec.slug || '',
      subtitle: sec.subtitle || '',
      description: sec.description || '',
      bannerUrl: sec.bannerUrl || '',
      layoutType: sec.layoutType || 'GRID',
      productIds: pIds,
      status: sec.status || 'PUBLISHED',
      isActive: sec.isActive !== false,
      productsPerRow: sec.productsPerRow || 4,
      bgColor: sec.bgColor || '#FFFFFF',
      textColor: sec.textColor || '#111827',
      buttonText: sec.buttonText || 'Explore Collection',
      buttonLink: sec.buttonLink || '',
      startDate: sec.startDate ? new Date(sec.startDate).toISOString().slice(0, 16) : '',
      endDate: sec.endDate ? new Date(sec.endDate).toISOString().slice(0, 16) : '',
      devices: devs,
      sortOrder: sec.sortOrder || 0,
    });
    setActiveTab('INFO');
    setIsModalOpen(true);
  };

  const handleBannerSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setRawImageSrc(reader.result);
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCroppedImageSave = (croppedDataUrl) => {
    setFormData((prev) => ({ ...prev, bannerUrl: croppedDataUrl }));
    setCropperOpen(false);
  };

  const toggleProductSelection = (productId) => {
    setFormData((prev) => {
      const exists = prev.productIds.includes(productId);
      const nextIds = exists
        ? prev.productIds.filter((id) => id !== productId)
        : [...prev.productIds, productId];
      return { ...prev, productIds: nextIds };
    });
  };

  const moveProductOrder = (index, direction) => {
    setFormData((prev) => {
      const nextIds = [...prev.productIds];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= nextIds.length) return prev;
      const temp = nextIds[index];
      nextIds[index] = nextIds[targetIndex];
      nextIds[targetIndex] = temp;
      return { ...prev, productIds: nextIds };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return alert('Section Title is required');

    try {
      if (editingId) {
        await api.put(`/cms/homepage/sections/${editingId}`, formData);
      } else {
        await api.post('/cms/homepage/sections', formData);
      }
      setIsModalOpen(false);
      fetchInitialData();
    } catch (err) {
      console.error('Failed to save homepage section:', err);
      alert('Failed to save section. Please try again.');
    }
  };

  const handleToggleStatus = async (sec) => {
    const nextStatus = sec.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED';
    try {
      await api.put(`/cms/homepage/sections/${sec.id}`, { status: nextStatus, isActive: nextStatus === 'PUBLISHED' });
      fetchInitialData();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDuplicate = async (sec) => {
    try {
      await api.post(`/cms/homepage/sections/${sec.id}/duplicate`);
      fetchInitialData();
    } catch (err) {
      console.error('Failed to duplicate section:', err);
    }
  };

  const handleDelete = async (sec) => {
    if (!window.confirm(`Are you sure you want to delete "${sec.title}"? The section will be removed from the Homepage, but products will remain safe in inventory.`)) return;
    try {
      await api.delete(`/cms/homepage/sections/${sec.id}`);
      fetchInitialData();
    } catch (err) {
      console.error('Failed to delete section:', err);
    }
  };

  const handleMoveSort = async (index, direction) => {
    const newSections = [...sections];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    const items = newSections.map((sec, idx) => ({ id: sec.id, sortOrder: idx }));
    setSections(newSections);

    try {
      await api.put('/cms/homepage/sections/reorder', { items });
    } catch (err) {
      console.error('Failed to reorder sections:', err);
    }
  };

  // Filtered sections for main list
  const filteredSections = sections.filter((sec) =>
    sec.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered products for modal picker
  const filteredProducts = allProducts.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(prodSearch.toLowerCase()) || p.sku?.toLowerCase().includes(prodSearch.toLowerCase());
    const matchesCategory = !prodCategory || p.category?.id === prodCategory || p.categoryId === prodCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* ── HEADER & TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-charcoal-900 border border-gold-500/30 p-6 rounded-3xl shadow-2xl">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-gold-400">Enterprise CMS Page Builder</span>
          <h1 className="text-2xl font-serif font-bold text-white mt-1">Homepage Section Manager</h1>
          <p className="text-xs text-gray-400 mt-1">
            Create, customize, schedule, and reorder dynamic homepage sections without writing code.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gold-500 hover:bg-gold-400 text-charcoal-900 font-extrabold text-sm transition-all shadow-lg cursor-pointer"
        >
          <FiPlus className="w-5 h-5" /> + Create Homepage Section
        </button>
      </div>

      {/* ── SEARCH & FILTER BAR ── */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search homepage sections by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500 transition-colors"
          />
        </div>
        <span className="text-xs text-gray-500 font-semibold px-3 py-1 bg-gray-50 rounded-lg">
          Total: {sections.length} Sections
        </span>
      </div>

      {/* ── SECTIONS CARDS LIST ── */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500">Loading Homepage Sections...</p>
        </div>
      ) : filteredSections.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <FiLayers className="w-12 h-12 text-gold-500 mx-auto opacity-50" />
          <h3 className="text-lg font-serif font-bold text-gray-800">No Homepage Sections Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Click "+ Create Homepage Section" to start building dynamic homepage product showcases.
          </p>
          <button
            onClick={openCreateModal}
            className="px-6 py-2.5 rounded-xl bg-gold-500 text-charcoal-900 font-bold text-xs shadow hover:bg-gold-400 transition"
          >
            Create First Section
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSections.map((sec, idx) => {
            let pIds = [];
            try { pIds = typeof sec.productIds === 'string' ? JSON.parse(sec.productIds) : sec.productIds || []; } catch (e) {}

            return (
              <motion.div
                key={sec.id}
                layout
                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Banner / Header Image Preview */}
                  <div className="relative h-40 bg-charcoal-900 overflow-hidden">
                    {sec.bannerUrl ? (
                      <img src={sec.bannerUrl} alt={sec.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-black flex items-center justify-center p-4 text-center">
                        <span className="text-gold-400 font-serif font-bold text-lg">{sec.title}</span>
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider shadow-md ${
                        sec.status === 'PUBLISHED' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {sec.status}
                      </span>
                    </div>

                    {/* Layout Type Pill */}
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-gold-400 text-[10px] font-bold border border-gold-500/30">
                        {sec.layoutType}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-gold-600 uppercase tracking-widest">Order: #{idx + 1}</span>
                      <h3 className="text-base font-bold text-charcoal-900 line-clamp-1">{sec.title}</h3>
                      {sec.subtitle && <p className="text-xs text-gray-500 line-clamp-1">{sec.subtitle}</p>}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <span>Assigned Products: <strong className="text-charcoal-900">{pIds.length}</strong></span>
                      <span>Grid: <strong>{sec.productsPerRow || 4} / Row</strong></span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveSort(idx, -1)}
                      disabled={idx === 0}
                      title="Move Up"
                      className="p-2 rounded-xl bg-white border text-gray-600 hover:text-gold-600 disabled:opacity-30 cursor-pointer"
                    >
                      <FiArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveSort(idx, 1)}
                      disabled={idx === filteredSections.length - 1}
                      title="Move Down"
                      className="p-2 rounded-xl bg-white border text-gray-600 hover:text-gold-600 disabled:opacity-30 cursor-pointer"
                    >
                      <FiArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(sec)}
                      title={sec.status === 'PUBLISHED' ? 'Hide Section' : 'Publish Section'}
                      className="p-2 rounded-xl bg-white border text-gray-600 hover:text-blue-600 cursor-pointer"
                    >
                      {sec.status === 'PUBLISHED' ? <FiEyeOff className="w-3.5 h-3.5 text-emerald-600" /> : <FiEye className="w-3.5 h-3.5 text-gray-400" />}
                    </button>

                    <button
                      onClick={() => handleDuplicate(sec)}
                      title="Duplicate Section"
                      className="p-2 rounded-xl bg-white border text-gray-600 hover:text-amber-600 cursor-pointer"
                    >
                      <FiCopy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => openEditModal(sec)}
                      title="Edit Section"
                      className="p-2 rounded-xl bg-gold-50 border border-gold-200 text-gold-700 hover:bg-gold-100 cursor-pointer"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(sec)}
                      title="Delete Section"
                      className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 cursor-pointer"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── CREATE / EDIT HOMEPAGE SECTION MODAL ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white max-w-4xl w-full rounded-3xl shadow-2xl overflow-hidden my-8 border border-gray-200 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-charcoal-900 border-b border-gold-500/30 p-6 flex items-center justify-between shrink-0">
                <div>
                  <span className="text-xs font-bold text-gold-400 uppercase tracking-widest">Homepage Section Builder</span>
                  <h2 className="text-xl font-serif font-bold text-white">
                    {editingId ? 'Edit Homepage Section' : 'Create New Homepage Section'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex border-b border-gray-100 bg-gray-50 shrink-0 overflow-x-auto">
                {[
                  { id: 'INFO', label: '1. Basic Info' },
                  { id: 'LAYOUT', label: '2. Layout & Colors' },
                  { id: 'BANNER', label: '3. Section Banner' },
                  { id: 'PRODUCTS', label: `4. Select Products (${formData.productIds.length})` },
                  { id: 'SCHEDULE', label: '5. Schedule & Devices' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`px-5 py-3.5 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      activeTab === t.id
                        ? 'bg-white text-gold-600 border-b-2 border-gold-500 shadow-sm'
                        : 'text-gray-500 hover:text-charcoal-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Modal Form Body */}
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* ── TAB 1: BASIC INFO ── */}
                {activeTab === 'INFO' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                        Section Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Festival Silk Sarees, Luxury Jewellery, Men's Royal Shirts..."
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                          Subtitle (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Handcrafted weaves for grand celebrations"
                          value={formData.subtitle}
                          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value, isActive: e.target.value === 'PUBLISHED' })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500"
                        >
                          <option value="PUBLISHED">Published (Visible on Homepage)</option>
                          <option value="DRAFT">Draft</option>
                          <option value="HIDDEN">Hidden</option>
                          <option value="ARCHIVED">Archived</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                        Description (Optional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Brief description displayed under the section header..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                          "View All" Button Text
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Explore Collection, Shop Now, View All"
                          value={formData.buttonText}
                          onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                          Button Link URL (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. /categories/womens-sarees"
                          value={formData.buttonLink}
                          onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 2: LAYOUT & COLORS ── */}
                {activeTab === 'LAYOUT' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-2">
                        Select Layout Style
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {LAYOUT_TYPES.map((lt) => (
                          <div
                            key={lt.id}
                            onClick={() => setFormData({ ...formData, layoutType: lt.id })}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                              formData.layoutType === lt.id
                                ? 'border-gold-500 bg-gold-50/50 ring-2 ring-gold-500/20'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <lt.icon className="w-5 h-5 text-gold-600 mb-2" />
                            <h4 className="text-sm font-bold text-charcoal-900">{lt.name}</h4>
                            <p className="text-[11px] text-gray-500 mt-0.5">{lt.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                          Products Per Row (Desktop)
                        </label>
                        <select
                          value={formData.productsPerRow}
                          onChange={(e) => setFormData({ ...formData, productsPerRow: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500"
                        >
                          <option value={2}>2 Products / Row</option>
                          <option value={3}>3 Products / Row</option>
                          <option value={4}>4 Products / Row (Recommended)</option>
                          <option value={5}>5 Products / Row</option>
                          <option value={6}>6 Products / Row</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                          Section Background Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={formData.bgColor}
                            onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                            className="w-10 h-10 rounded-lg cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={formData.bgColor}
                            onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                            className="flex-1 px-3 py-2 border rounded-xl text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                          Header Text Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={formData.textColor}
                            onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                            className="w-10 h-10 rounded-lg cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={formData.textColor}
                            onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                            className="flex-1 px-3 py-2 border rounded-xl text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 3: BANNER ── */}
                {activeTab === 'BANNER' && (
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide">
                      Section Header Banner (Optional)
                    </label>
                    {formData.bannerUrl ? (
                      <div className="relative rounded-2xl overflow-hidden border border-gray-200 group">
                        <img src={formData.bannerUrl} alt="Banner" className="w-full h-48 object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, bannerUrl: '' })}
                          className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-700 transition"
                        >
                          Remove Banner
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-3xl p-8 text-center bg-gray-50 hover:bg-gray-100/80 transition-colors">
                        <FiUpload className="w-10 h-10 text-gold-500 mx-auto mb-2" />
                        <p className="text-sm font-bold text-charcoal-900">Upload Section Banner</p>
                        <p className="text-xs text-gray-500 mt-1">Recommended aspect ratio 16:9 or 21:9</p>
                        <label className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500 text-charcoal-900 font-bold text-xs shadow hover:bg-gold-400 cursor-pointer">
                          <span>Choose Image & Crop</span>
                          <input type="file" accept="image/*" onChange={handleBannerSelect} className="hidden" />
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB 4: SELECT PRODUCTS ── */}
                {activeTab === 'PRODUCTS' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50 p-3 rounded-2xl border">
                      <div className="flex items-center gap-2 flex-1 w-full">
                        <FiSearch className="text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search products by name or SKU..."
                          value={prodSearch}
                          onChange={(e) => setProdSearch(e.target.value)}
                          className="w-full bg-transparent text-xs focus:outline-none"
                        />
                      </div>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        className="text-xs px-3 py-1.5 rounded-xl border bg-white focus:outline-none"
                      >
                        <option value="">All Categories</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Selected Products Count Banner */}
                    <div className="flex items-center justify-between text-xs bg-gold-50 border border-gold-200 px-4 py-2.5 rounded-xl text-gold-800 font-semibold">
                      <span>Selected Products: <strong>{formData.productIds.length}</strong></span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, productIds: [] })}
                        className="text-red-600 font-bold hover:underline"
                      >
                        Clear All
                      </button>
                    </div>

                    {/* Selected Order Manager List (if selected) */}
                    {formData.productIds.length > 0 && (
                      <div className="space-y-2 border-b pb-4">
                        <span className="text-[11px] font-bold text-gray-500 uppercase">Product Display Order:</span>
                        <div className="flex gap-2 overflow-x-auto py-2">
                          {formData.productIds.map((id, index) => {
                            const p = allProducts.find(prod => prod.id === id);
                            if (!p) return null;
                            const img = p.images?.[0]?.url || 'https://via.placeholder.com/100';
                            return (
                              <div key={id} className="relative group shrink-0 w-24 bg-white rounded-xl border p-1 text-center shadow-sm">
                                <img src={img} alt={p.name} className="w-full h-16 object-cover rounded-lg mb-1" />
                                <p className="text-[10px] font-bold line-clamp-1 text-charcoal-900">{p.name}</p>
                                <div className="flex justify-center gap-1 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => moveProductOrder(index, -1)}
                                    disabled={index === 0}
                                    className="p-1 rounded bg-gray-100 disabled:opacity-30"
                                  >
                                    <FiArrowUp className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveProductOrder(index, 1)}
                                    disabled={index === formData.productIds.length - 1}
                                    className="p-1 rounded bg-gray-100 disabled:opacity-30"
                                  >
                                    <FiArrowDown className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Products Grid Picker */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
                      {filteredProducts.map((p) => {
                        const isSelected = formData.productIds.includes(p.id);
                        const img = p.images?.[0]?.url || 'https://via.placeholder.com/100';
                        return (
                          <div
                            key={p.id}
                            onClick={() => toggleProductSelection(p.id)}
                            className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                              isSelected ? 'border-gold-500 bg-gold-50/60 ring-2 ring-gold-500/20' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-2">
                              <img src={img} alt={p.name} className="w-full h-full object-cover" />
                              <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border flex items-center justify-center ${
                                isSelected ? 'bg-gold-500 border-gold-600 text-white' : 'bg-white/90 border-gray-300'
                              }`}>
                                {isSelected && <FiCheck className="w-3 h-3" />}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] text-gold-600 font-semibold uppercase">{p.category?.name || 'Item'}</p>
                              <h4 className="text-xs font-bold text-charcoal-900 line-clamp-1">{p.name}</h4>
                              <p className="text-xs font-extrabold text-charcoal-900 mt-1">₹{p.price}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── TAB 5: SCHEDULE & DEVICES ── */}
                {activeTab === 'SCHEDULE' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                          Visibility Start Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                          Visibility End Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-2">
                        Target Devices
                      </label>
                      <div className="flex gap-4">
                        {['DESKTOP', 'TABLET', 'MOBILE'].map((dev) => {
                          const checked = formData.devices.includes(dev);
                          return (
                            <label key={dev} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-charcoal-900">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...formData.devices, dev]
                                    : formData.devices.filter((d) => d !== dev);
                                  setFormData({ ...formData, devices: next });
                                }}
                                className="rounded text-gold-500"
                              />
                              {dev}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Submit Buttons */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-900 font-extrabold text-xs shadow-lg transition cursor-pointer"
                  >
                    {editingId ? 'Save Changes' : 'Publish Homepage Section'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Cropper Modal */}
      {cropperOpen && (
        <BannerCropperModal
          imageSrc={rawImageSrc}
          onCropComplete={handleCroppedImageSave}
          onClose={() => setCropperOpen(false)}
        />
      )}
    </div>
  );
};

export default HomepageSectionManager;
