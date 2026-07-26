import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/common/Button';
import api from '../../config/api';
import { formatDate } from '../../utils/formatDate';
import BannerCropperModal from '../Banner/BannerCropperModal';
import {
  FiPlus, FiTrash2, FiEdit, FiSearch, FiX, FiCopy, FiCheck,
  FiFilter, FiEye, FiEyeOff, FiImage, FiRefreshCw, FiUploadCloud,
  FiAlertTriangle, FiMonitor, FiTablet, FiSmartphone, FiArrowUp,
  FiArrowDown, FiMove, FiGrid, FiShoppingBag, FiZap, FiStar,
  FiHeart, FiTag, FiClock, FiVideo, FiInstagram, FiMail, FiMapPin,
  FiCheckCircle, FiLayers, FiSliders, FiHelpCircle, FiLock
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const fadeInUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } };

/* ─── Categorized Section Types (60+ presets) ───────────────── */
const SECTION_CATEGORIES = [
  {
    category: '🖼️ Banners & Sliders',
    types: [
      { type: 'HERO_SLIDER', name: 'Hero Banner Slider', desc: 'Main full-width rotating hero banner' },
      { type: 'SINGLE_BANNER', name: 'Single Promo Banner', desc: 'Full-width single static promotional banner' },
      { type: 'DUAL_BANNER', name: 'Dual Banner (2 Column)', desc: 'Side-by-side promo banners' },
      { type: 'TRIPLE_BANNER', name: 'Triple Banner (3 Column)', desc: '3-column grid promotional banner' },
      { type: 'FULL_WIDTH_BANNER', name: 'Full Width Parallax', desc: 'Seamless edge-to-edge image section' },
      { type: 'IMAGE_GRID', name: 'Image Grid Showcase', desc: 'Mosaic masonry image gallery' },
      { type: 'VIDEO_BANNER', name: 'Promotional Video Banner', desc: 'Auto-playing background video banner' },
    ]
  },
  {
    category: '🛍️ Product Showcases',
    types: [
      { type: 'FEATURED_PRODUCTS', name: 'Featured Products', desc: 'Handpicked products grid or slider' },
      { type: 'NEW_ARRIVALS', name: 'New Arrivals', desc: 'Latest arrivals automatically fetched' },
      { type: 'BEST_SELLERS', name: 'Best Sellers', desc: 'Top selling products section' },
      { type: 'TRENDING_PRODUCTS', name: 'Trending Now', desc: 'High demand & viral items' },
      { type: 'RECOMMENDED_PRODUCTS', name: 'Recommended Products', desc: 'Curated store recommendations' },
      { type: 'RECENTLY_ADDED', name: 'Recently Added', desc: 'Fresh catalog additions' },
      { type: 'BOGO_OFFER', name: 'Buy One Get One (BOGO)', desc: 'Special BOGO promotional offer section' },
      { type: 'COMBO_OFFERS', name: 'Combo Deals & Bundles', desc: 'Product bundle deal section' },
    ]
  },
  {
    category: '⚡ Flash Sales & Timers',
    types: [
      { type: 'FLASH_SALE', name: 'Flash Sale Section', desc: 'Countdown timer with discount progress bar' },
      { type: 'DEAL_OF_THE_DAY', name: 'Deal Of The Day', desc: 'Daily special discount spotlight' },
      { type: 'MEGA_SALE', name: 'Mega Sale Banner', desc: 'High priority event sale banner' },
      { type: 'MIDNIGHT_SALE', name: 'Midnight Flash Sale', desc: 'Time-sensitive nighttime flash sale' },
      { type: 'LIMITED_TIME_OFFER', name: 'Limited Time Offer', desc: 'Urgency offer with countdown timer' },
      { type: 'COUNTDOWN_OFFER', name: 'Countdown Offer', desc: 'Live ticking timer banner' },
      { type: 'SEASONAL_SALE', name: 'Seasonal Sale', desc: 'Summer/Festive seasonal campaign' },
    ]
  },
  {
    category: '📂 Categories & Collections',
    types: [
      { type: 'CATEGORIES_GRID', name: 'Categories Grid', desc: 'Visual category grid with images' },
      { type: 'FEATURED_CATEGORIES', name: 'Featured Categories Slider', desc: 'Horizontal category slider' },
      { type: 'SHOP_BY_CATEGORY', name: 'Shop By Category', desc: 'Iconic category selector' },
      { type: 'SHOP_BY_BRAND', name: 'Shop By Brand', desc: 'Brand logos showcase slider' },
      { type: 'WOMENS_COLLECTION', name: 'Womens Collection', desc: 'Sarees, Lehengas & Ethnic Wear' },
      { type: 'MENS_COLLECTION', name: 'Mens Collection', desc: 'Mens Kurta & Ethnic Suits' },
      { type: 'JEWELLERY_COLLECTION', name: 'Jewellery & Accessories', desc: 'Necklaces, Earrings & Royal Jewellery' },
      { type: 'LUXURY_COLLECTION', name: 'Luxury Premium Wear', desc: 'Exclusive designer couture' },
    ]
  },
  {
    category: '🌟 Reviews, Social & Store Info',
    types: [
      { type: 'TESTIMONIALS', name: 'Customer Reviews & Testimonials', desc: 'Rating stars & customer quotes' },
      { type: 'INSTAGRAM_FEED', name: 'Instagram Social Feed', desc: 'Live Instagram grid with shoppable links' },
      { type: 'ANNOUNCEMENT_BAR', name: 'Announcement Bar', desc: 'Top scrolling alert banner' },
      { type: 'COUPON_BANNER', name: 'Coupon & Discount Banner', desc: 'Promotional discount code box' },
      { type: 'NEWSLETTER', name: 'Newsletter Subscription', desc: 'Email signup box for discounts' },
      { type: 'WHY_CHOOSE_US', name: 'Why Choose Us / Store Features', desc: 'Free Shipping, COD, Easy Returns icons' },
      { type: 'WHATSAPP_CONTACT', name: 'WhatsApp Quick Support', desc: 'Direct WhatsApp chat CTA box' },
      { type: 'FAQ_PREVIEW', name: 'Frequently Asked Questions', desc: 'Accordion FAQ preview section' },
    ]
  },
  {
    category: '🛠️ Custom Sections',
    types: [
      { type: 'CUSTOM_HTML', name: 'Custom HTML Section', desc: 'Write raw HTML/CSS custom code' },
      { type: 'CUSTOM_IMAGE_SECTION', name: 'Custom Image Section', desc: 'Upload custom graphic section' },
      { type: 'CUSTOM_PRODUCT_SLIDER', name: 'Custom Product Slider', desc: 'Manual product picker slider' },
    ]
  }
];

const DEFAULT_SECTION_CONFIG = {
  subtitle: '', description: '', imageUrl: '', buttonText: 'Explore Now', buttonLink: '#',
  textColor: '#111827', backgroundColor: '#FFFFFF', buttonColor: '#D4AF37', overlayOpacity: '0.0',
  alignment: 'CENTER', maxProducts: '8', productSort: 'LATEST', categoryFilter: '',
  layout: 'GRID', devices: ['DESKTOP', 'TABLET', 'MOBILE'], status: 'PUBLISHED',
  discountPercent: '30', hoursLeft: '24', flashTitle: 'MIDNIGHT FLASH SALE', altText: '', seoTitle: '', seoDescription: '',
};

/* ═══════════════════════════════════════════════════════════ */
/*   ADMIN HOMEPAGE MANAGEMENT PAGE                            */
/* ═══════════════════════════════════════════════════════ */
const AdminHomepage = () => {
  const [sections, setSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Device Live Preview state (DESKTOP | TABLET | MOBILE)
  const [previewDevice, setPreviewDevice] = useState('DESKTOP');

  // Modals & Drawers
  const [pickerModalOpen, setPickerModalOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionForm, setSectionForm] = useState({ title: '', sectionType: 'FEATURED_PRODUCTS', config: { ...DEFAULT_SECTION_CONFIG } });
  const [saving, setSaving] = useState(false);

  // Cropper Modal state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk actions state
  const [selected, setSelected] = useState(new Set());

  /* ─── FETCH SECTIONS & CATEGORIES ───────────────────────── */
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [secRes, catRes] = await Promise.all([
        api.get('/cms/homepage/admin/all').catch(() => api.get('/cms/homepage')),
        api.get('/categories').catch(() => ({ data: { data: [] } })),
      ]);
      setSections(secRes.data?.data || []);
      setCategories(catRes.data?.data || []);
    } catch {
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ─── REORDER HANDLERS ──────────────────────────────────── */
  const handleMove = async (index, direction) => {
    const newIdx = direction === 'UP' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;

    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;

    // Update sortOrder
    const reordered = updated.map((sec, i) => ({ ...sec, sortOrder: i }));
    setSections(reordered);

    try {
      await api.put('/cms/homepage/sections/reorder', { sections: reordered });
      toast.success('Section order updated!');
    } catch {
      toast.error('Failed to update order');
      fetchAll();
    }
  };

  /* ─── CREATE SECTION FROM PICKER ────────────────────────── */
  const handleAddSectionType = async (item) => {
    setPickerModalOpen(false);
    try {
      const payload = {
        title: item.name,
        sectionType: item.type,
        config: JSON.stringify({ ...DEFAULT_SECTION_CONFIG }),
        sortOrder: sections.length,
        isActive: true,
      };
      const { data } = await api.post('/cms/homepage/sections', payload);
      toast.success(`Section "${item.name}" added to Homepage! 🎉`);
      fetchAll();
      // Automatically open editor for the new section
      if (data?.data) openEditor(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add section');
    }
  };

  /* ─── OPEN EDITOR ───────────────────────────────────────── */
  const openEditor = (section) => {
    setEditingSection(section);
    let parsedConfig = { ...DEFAULT_SECTION_CONFIG };
    try {
      if (typeof section.config === 'string') parsedConfig = { ...DEFAULT_SECTION_CONFIG, ...JSON.parse(section.config) };
      else if (typeof section.config === 'object') parsedConfig = { ...DEFAULT_SECTION_CONFIG, ...section.config };
    } catch {}

    setSectionForm({
      title: section.title || '',
      sectionType: section.sectionType || 'FEATURED_PRODUCTS',
      config: parsedConfig,
      isActive: section.isActive !== false,
    });
    setEditorOpen(true);
  };

  /* ─── FILE SELECT / CROPPER FOR SECTION IMAGE ───────────── */
  const handleFileSelect = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropperSrc(reader.result);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (url) => {
    setSectionForm(prev => ({
      ...prev,
      config: { ...prev.config, imageUrl: url }
    }));
    toast.success('Image Cropped & Uploaded! ✨');
  };

  /* ─── SAVE SECTION EDITS ────────────────────────────────── */
  const handleSaveSection = async (e) => {
    e.preventDefault();
    if (!sectionForm.title.trim()) { toast.error('Section Title is required'); return; }

    try {
      setSaving(true);
      const payload = {
        title: sectionForm.title,
        sectionType: sectionForm.sectionType,
        config: JSON.stringify(sectionForm.config),
        isActive: sectionForm.isActive,
      };

      if (editingSection) {
        await api.put(`/cms/homepage/sections/${editingSection.id}`, payload);
        toast.success(`Section "${sectionForm.title}" updated!`);
      } else {
        await api.post('/cms/homepage/sections', payload);
        toast.success(`Section "${sectionForm.title}" created!`);
      }
      setEditorOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save section');
    } finally { setSaving(false); }
  };

  /* ─── DUPLICATE SECTION ─────────────────────────────────── */
  const handleDuplicate = async (section) => {
    try {
      await api.post(`/cms/homepage/sections/${section.id}/duplicate`);
      toast.success(`Section "${section.title}" duplicated!`);
      fetchAll();
    } catch { toast.error('Failed to duplicate section'); }
  };

  /* ─── TOGGLE PUBLISH / HIDE ─────────────────────────────── */
  const handleTogglePublish = async (section) => {
    const newActive = !section.isActive;
    try {
      await api.put(`/cms/homepage/sections/${section.id}`, { isActive: newActive });
      toast.success(newActive ? `Section "${section.title}" published!` : `Section "${section.title}" hidden!`);
      fetchAll();
    } catch { toast.error('Failed to update status'); }
  };

  /* ─── DELETE SECTION ────────────────────────────────────── */
  const handleDeleteSubmit = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/cms/homepage/sections/${deleteTarget.id}`);
      toast.success('Section deleted permanently');
      setDeleteTarget(null);
      fetchAll();
    } catch { toast.error('Failed to delete section'); }
    finally { setDeleting(false); }
  };

  /* ─── BULK ACTIONS ──────────────────────────────────────── */
  const handleBulkAction = async (action) => {
    if (selected.size === 0) { toast.info('Select sections first'); return; }
    const ids = [...selected];
    try {
      if (action === 'PUBLISH') {
        await Promise.all(ids.map(id => api.put(`/cms/homepage/sections/${id}`, { isActive: true })));
        toast.success(`${ids.length} Sections Published!`);
      } else if (action === 'HIDE') {
        await Promise.all(ids.map(id => api.put(`/cms/homepage/sections/${id}`, { isActive: false })));
        toast.success(`${ids.length} Sections Hidden!`);
      } else if (action === 'DELETE') {
        await Promise.all(ids.map(id => api.delete(`/cms/homepage/sections/${id}`)));
        toast.success(`${ids.length} Sections Deleted!`);
      }
      setSelected(new Set());
      fetchAll();
    } catch { toast.error('Bulk action failed'); }
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* ─── FILTER ────────────────────────────────────────────── */
  const filteredSections = useMemo(() => sections.filter(sec => {
    const matchSearch = !search || sec.title?.toLowerCase().includes(search.toLowerCase()) || sec.sectionType?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || (statusFilter === 'PUBLISHED' ? sec.isActive : !sec.isActive);
    return matchSearch && matchStatus;
  }), [sections, search, statusFilter]);

  /* ═══════════════════════════════════════════════════════════ */
  return (
    <motion.div initial="initial" animate="animate" className="space-y-6">

      {/* ── HEADER ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Homepage Control Center</h1>
          <p className="text-sm text-gray-500">Visual page builder to create, edit, reorder, publish & delete homepage sections in real time.</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition cursor-pointer" title="Refresh">
            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <Button icon={FiPlus} onClick={() => setPickerModalOpen(true)}>+ Add Homepage Section</Button>
        </div>
      </div>

      {/* ── DEVICE PREVIEW SELECTOR BAR ───────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500">Live Device View:</span>
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            {[
              { key: 'DESKTOP', icon: FiMonitor, label: 'Desktop' },
              { key: 'TABLET', icon: FiTablet, label: 'Tablet' },
              { key: 'MOBILE', icon: FiSmartphone, label: 'Mobile' },
            ].map(d => {
              const Icon = d.icon;
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setPreviewDevice(d.key)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                    previewDevice === d.key ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  <Icon size={12} /> {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2 flex-1 max-w-md ml-auto">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sections..." className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><FiX size={14} /></button>}
          </div>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white">
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published Only</option>
            <option value="HIDDEN">Hidden Only</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Controls */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 p-3 rounded-2xl">
          <span className="text-xs font-bold text-amber-800">{selected.size} sections selected</span>
          <div className="flex items-center gap-1.5 ml-auto">
            <button onClick={() => handleBulkAction('PUBLISH')} className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-sm hover:bg-emerald-700">Publish All</button>
            <button onClick={() => handleBulkAction('HIDE')} className="px-3 py-1 rounded-lg bg-gray-600 text-white text-xs font-bold shadow-sm hover:bg-gray-700">Hide All</button>
            <button onClick={() => handleBulkAction('DELETE')} className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-bold shadow-sm hover:bg-red-700">Delete All</button>
          </div>
        </div>
      )}

      {/* ── HOMEPAGE SECTIONS LIST ────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-3xl p-5 animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-100" />
              <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-1/3" /><div className="h-3 bg-gray-100 rounded w-1/4" /></div>
            </div>
          ))}
        </div>
      ) : filteredSections.length === 0 ? (
        /* EMPTY STATE */
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-sm">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-100">
            <FiLayers size={40} />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-1">No homepage sections have been created.</h3>
          <p className="text-xs text-gray-400 mb-6 max-w-sm mx-auto">Build your customer homepage visual layout by adding hero sliders, product showcases, flash sales, and custom promotional sections.</p>
          <Button icon={FiPlus} onClick={() => setPickerModalOpen(true)}>Create Your First Homepage Section</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSections.map((sec, index) => {
            const isSelected = selected.has(sec.id);
            let parsed = {};
            try { if (typeof sec.config === 'string') parsed = JSON.parse(sec.config); else if (typeof sec.config === 'object') parsed = sec.config; } catch {}

            return (
              <motion.div
                key={sec.id}
                layout
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                className={`bg-white border rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isSelected ? 'border-amber-400 ring-2 ring-amber-200' : 'border-gray-200'
                }`}
              >
                {/* Drag / Index & Info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button onClick={() => handleMove(index, 'UP')} disabled={index === 0} className="p-1 rounded text-gray-400 hover:text-black disabled:opacity-20 cursor-pointer"><FiArrowUp size={14} /></button>
                    <span className="text-xs font-mono font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">#{index + 1}</span>
                    <button onClick={() => handleMove(index, 'DOWN')} disabled={index === sections.length - 1} className="p-1 rounded text-gray-400 hover:text-black disabled:opacity-20 cursor-pointer"><FiArrowDown size={14} /></button>
                  </div>

                  <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(sec.id)} className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer shrink-0" />

                  {/* Section Type Icon Badge */}
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 shadow-sm font-black text-sm">
                    <FiLayers size={20} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-base truncate">{sec.title}</h3>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${sec.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {sec.isActive ? 'PUBLISHED' : 'HIDDEN'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                        {sec.sectionType}
                      </span>
                      {parsed.maxProducts && (
                        <span className="text-[10px] text-gray-400 font-semibold">
                          Max Products: {parsed.maxProducts}
                        </span>
                      )}
                      {parsed.productSort && (
                        <span className="text-[10px] text-gray-400 font-semibold">
                          Sort: {parsed.productSort}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section Quick Actions */}
                <div className="flex items-center gap-2 ml-auto md:ml-0 shrink-0">
                  <button onClick={() => openEditor(sec)} className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold border border-blue-200 transition cursor-pointer flex items-center gap-1">
                    <FiEdit size={13} /> Edit
                  </button>
                  <button onClick={() => handleDuplicate(sec)} className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold border border-indigo-200 transition cursor-pointer flex items-center gap-1">
                    <FiCopy size={13} /> Duplicate
                  </button>
                  <button onClick={() => handleTogglePublish(sec)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${sec.isActive ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    {sec.isActive ? <><FiEyeOff size={13} /> Hide</> : <><FiEye size={13} /> Publish</>}
                  </button>
                  <button onClick={() => setDeleteTarget(sec)} className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition cursor-pointer" title="Delete">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/*   MODAL 1: ADD HOMEPAGE SECTION TYPE PICKER             */}
      {/* ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {pickerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl border border-gray-100 flex flex-col overflow-hidden">

              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div>
                  <h2 className="text-lg font-bold text-charcoal-900">+ Add Homepage Section</h2>
                  <p className="text-xs text-gray-500">Choose from 60+ pre-built section types to add to your visual homepage builder</p>
                </div>
                <button onClick={() => setPickerModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-200 text-gray-500 transition"><FiX size={20} /></button>
              </div>

              {/* Picker Search */}
              <div className="p-4 border-b border-gray-100 bg-white">
                <div className="relative">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input type="text" value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} placeholder="Filter section types..." className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none" />
                </div>
              </div>

              {/* Picker Body Grid */}
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                {SECTION_CATEGORIES.map(cat => {
                  const filteredTypes = cat.types.filter(t => !pickerSearch || t.name.toLowerCase().includes(pickerSearch.toLowerCase()) || t.desc.toLowerCase().includes(pickerSearch.toLowerCase()));
                  if (filteredTypes.length === 0) return null;

                  return (
                    <div key={cat.category} className="space-y-3">
                      <h3 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/50 w-fit">{cat.category}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredTypes.map(item => (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => handleAddSectionType(item)}
                            className="p-4 rounded-2xl border border-gray-200 bg-white hover:border-amber-400 hover:bg-amber-50/40 text-left transition-all group shadow-sm cursor-pointer flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-xs text-charcoal-900 group-hover:text-amber-800">{item.name}</h4>
                                <span className="text-[10px] font-bold text-amber-600 opacity-0 group-hover:opacity-100 transition">+ Add</span>
                              </div>
                              <p className="text-[11px] text-gray-400 leading-snug">{item.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*   MODAL 2: SECTION EDITOR WITH RESPONSIVE PREVIEW       */}
      {/* ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {editorOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setEditorOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl overflow-y-auto">

              <form onSubmit={handleSaveSection} className="flex flex-col h-full">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-charcoal-900">Customize Homepage Section</h2>
                    <p className="text-xs text-gray-500">Section Type: <span className="font-bold text-amber-700">{sectionForm.sectionType}</span></p>
                  </div>
                  <button type="button" onClick={() => setEditorOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition"><FiX size={20} /></button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                  {/* Section Title & Subtitle */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">1. Section Identity</h3>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Section Title *</label>
                      <input type="text" value={sectionForm.title} onChange={e => setSectionForm({ ...sectionForm, title: e.target.value })} required className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Subtitle</label>
                      <input type="text" value={sectionForm.config.subtitle || ''} onChange={e => setSectionForm({ ...sectionForm, config: { ...sectionForm.config, subtitle: e.target.value } })} placeholder="e.g. Handcrafted pure silk sarees with gold zari" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                    </div>
                  </div>

                  {/* Image Upload Zone */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">2. Banner / Background Image</h3>
                    <div className="flex items-center gap-3">
                      {sectionForm.config.imageUrl ? (
                        <div className="relative w-28 h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0">
                          <img src={sectionForm.config.imageUrl} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => { setCropperSrc(sectionForm.config.imageUrl); setCropperOpen(true); }} className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px] font-bold opacity-0 hover:opacity-100 transition">
                            <FiCrop size={14} /> Crop
                          </button>
                        </div>
                      ) : null}
                      <label className="flex-1 border-2 border-dashed border-gray-300 hover:border-amber-400 rounded-xl p-4 text-center cursor-pointer bg-gray-50 transition">
                        <FiUploadCloud size={24} className="mx-auto text-amber-500 mb-1" />
                        <span className="text-xs font-bold text-gray-700 block">Click or Drag & Drop Image</span>
                        <input type="file" accept="image/*" onChange={e => handleFileSelect(e.target.files?.[0])} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {/* Product Settings if Product Type */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">3. Product & Catalog Display Settings</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Filter Category</label>
                        <select value={sectionForm.config.categoryFilter || ''} onChange={e => setSectionForm({ ...sectionForm, config: { ...sectionForm.config, categoryFilter: e.target.value } })} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white">
                          <option value="">All Categories</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Sorting Rule</label>
                        <select value={sectionForm.config.productSort || 'LATEST'} onChange={e => setSectionForm({ ...sectionForm, config: { ...sectionForm.config, productSort: e.target.value } })} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white">
                          <option value="LATEST">Latest Additions</option>
                          <option value="BEST_SELLING">Best Selling</option>
                          <option value="HIGHEST_RATED">Highest Rated</option>
                          <option value="PRICE_LOW">Price: Low to High</option>
                          <option value="PRICE_HIGH">Price: High to Low</option>
                          <option value="RANDOM">Random Selection</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Max Products Displayed</label>
                        <input type="number" value={sectionForm.config.maxProducts || '8'} onChange={e => setSectionForm({ ...sectionForm, config: { ...sectionForm.config, maxProducts: e.target.value } })} min="1" max="50" className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Layout Style</label>
                        <select value={sectionForm.config.layout || 'GRID'} onChange={e => setSectionForm({ ...sectionForm, config: { ...sectionForm.config, layout: e.target.value } })} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white">
                          <option value="GRID">Product Grid</option>
                          <option value="SLIDER">Horizontal Slider</option>
                          <option value="LIST">Compact List</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Colors & Alignment */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">4. Styling & Colors</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Text Color</label>
                        <input type="color" value={sectionForm.config.textColor || '#111827'} onChange={e => setSectionForm({ ...sectionForm, config: { ...sectionForm.config, textColor: e.target.value } })} className="w-full h-9 rounded-xl border cursor-pointer" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Background</label>
                        <input type="color" value={sectionForm.config.backgroundColor || '#FFFFFF'} onChange={e => setSectionForm({ ...sectionForm, config: { ...sectionForm.config, backgroundColor: e.target.value } })} className="w-full h-9 rounded-xl border cursor-pointer" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Button Color</label>
                        <input type="color" value={sectionForm.config.buttonColor || '#D4AF37'} onChange={e => setSectionForm({ ...sectionForm, config: { ...sectionForm.config, buttonColor: e.target.value } })} className="w-full h-9 rounded-xl border cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  {/* Status & Active Toggle */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">5. Visibility & Publishing</h3>
                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-xl bg-gray-50">
                      <input type="checkbox" checked={sectionForm.isActive} onChange={e => setSectionForm({ ...sectionForm, isActive: e.target.checked })} className="rounded text-amber-500 focus:ring-amber-400" />
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Publish Section to Homepage</span>
                        <span className="text-[10px] text-gray-500">Uncheck to hide this section from live customers</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="sticky bottom-0 z-10 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
                  <button type="button" onClick={() => setEditorOpen(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black text-xs font-extrabold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer">
                    {saving ? 'Saving Section...' : 'Save Section'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*   IMAGE CROPPER MODAL INTEGRATION                       */}
      {/* ═══════════════════════════════════════════════════════ */}
      <BannerCropperModal
        isOpen={cropperOpen}
        onClose={() => setCropperOpen(false)}
        imageSrc={cropperSrc}
        onCropComplete={handleCropComplete}
      />

      {/* ═══════════════════════════════════════════════════════ */}
      {/*   DELETE CONFIRMATION DIALOG                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                  <FiAlertTriangle className="text-red-600 w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Delete Section</h3>
                  <p className="text-xs text-gray-500">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-xs text-gray-700 mb-5 bg-red-50 border border-red-100 rounded-xl p-3">
                Are you sure you want to permanently delete section &quot;{deleteTarget.title}&quot; from the homepage?
              </p>

              <div className="flex gap-2">
                <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1 py-2.5 rounded-xl border text-gray-600 text-xs font-semibold hover:bg-gray-100 transition">Cancel</button>
                <button onClick={handleDeleteSubmit} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition shadow-md cursor-pointer">
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminHomepage;
