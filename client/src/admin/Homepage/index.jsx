import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/common/Button';
import api from '../../config/api';
import { formatDate } from '../../utils/formatDate';
import GlobalImageEditor from '../../components/common/GlobalImageEditor';
import {
  FiPlus, FiTrash2, FiEdit, FiSearch, FiX, FiCopy, FiCheck,
  FiFilter, FiEye, FiEyeOff, FiImage, FiRefreshCw, FiUploadCloud,
  FiAlertTriangle, FiMonitor, FiTablet, FiSmartphone, FiArrowUp,
  FiArrowDown, FiGrid, FiZap, FiStar, FiTag, FiClock, FiVideo,
  FiLayers, FiSliders, FiCrop, FiCalendar, FiSettings, FiLayout,
  FiType, FiLink, FiChevronDown, FiChevronUp, FiExternalLink, FiMenu
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import FlashSaleManager from '../Offers/FlashSaleManager';
import SpecialDealsManager from '../Offers/SpecialDealsManager';
import ProductCollectionsManager from '../Offers/ProductCollectionsManager';
import CustomerReviewsManager from '../Offers/CustomerReviewsManager';
import SocialFollowManager from '../Offers/SocialFollowManager';
import HeritageBrandsManager from '../Offers/HeritageBrandsManager';
import TrendingProductsManager from '../Offers/TrendingProductsManager';
import HomepageSectionManager from '../Offers/HomepageSectionManager';
import HeaderMenuManager from '../Offers/HeaderMenuManager';

/* ─── Animation variants ──────────────────────────────────── */
const fadeInUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 } };
const stagger = { animate: { transition: { staggerChildren: 0.04 } } };

/* ─── 60+ Categorized Section Type Presets ─────────────────── */
const SECTION_CATEGORIES = [
  {
    category: '🖼️ Banners & Sliders', icon: '🖼️',
    types: [
      { type: 'HERO_SLIDER', name: 'Hero Banner Slider', desc: 'Main full-width rotating hero carousel' },
      { type: 'SINGLE_BANNER', name: 'Single Banner', desc: 'Full-width single promotional banner' },
      { type: 'DUAL_BANNER', name: 'Dual Banner (2 Col)', desc: 'Side-by-side promo banners' },
      { type: 'TRIPLE_BANNER', name: 'Triple Banner (3 Col)', desc: '3-column promotional grid' },
      { type: 'FULL_WIDTH_BANNER', name: 'Full Width Banner', desc: 'Edge-to-edge parallax image' },
      { type: 'IMAGE_GRID', name: 'Image Grid', desc: 'Mosaic masonry gallery' },
      { type: 'VIDEO_BANNER', name: 'Video Banner', desc: 'Auto-play background video' },
      { type: 'PROMOTIONAL_VIDEO', name: 'Promotional Video', desc: 'YouTube/Vimeo embed block' },
    ]
  },
  {
    category: '🛍️ Product Showcases', icon: '🛍️',
    types: [
      { type: 'FEATURED_PRODUCTS', name: 'Featured Products', desc: 'Handpicked product grid/slider' },
      { type: 'NEW_ARRIVALS', name: 'New Arrivals', desc: 'Latest arrivals auto-fetched' },
      { type: 'BEST_SELLERS', name: 'Best Sellers', desc: 'Top selling products' },
      { type: 'TRENDING_PRODUCTS', name: 'Trending Products', desc: 'High demand & viral items' },
      { type: 'RECOMMENDED_PRODUCTS', name: 'Recommended Products', desc: 'Curated store picks' },
      { type: 'RECENTLY_ADDED', name: 'Recently Added', desc: 'Fresh catalog additions' },
      { type: 'RECENTLY_VIEWED', name: 'Recently Viewed', desc: 'Customer browsing history' },
      { type: 'RECOMMENDED_FOR_YOU', name: 'Recommended For You', desc: 'Personalized suggestions' },
      { type: 'FREQUENTLY_BOUGHT', name: 'Frequently Bought Together', desc: 'Cross-sell bundles' },
      { type: 'POPULAR_SEARCHES', name: 'Popular Searches', desc: 'Top trending searches' },
      { type: 'TODAYS_DEALS', name: "Today's Deals", desc: 'Daily rotating deals' },
      { type: 'CUSTOM_PRODUCT_SLIDER', name: 'Custom Product Slider', desc: 'Manually picked slider' },
    ]
  },
  {
    category: '⚡ Flash Sales & Offers', icon: '⚡',
    types: [
      { type: 'FLASH_SALE', name: 'Flash Sale', desc: 'Countdown timer + discount progress' },
      { type: 'DEAL_OF_THE_DAY', name: 'Deal Of The Day', desc: 'Daily spotlight discount' },
      { type: 'MEGA_SALE', name: 'Mega Sale', desc: 'High priority event banner' },
      { type: 'MIDNIGHT_SALE', name: 'Midnight Sale', desc: 'Nighttime flash sale' },
      { type: 'LIMITED_TIME_OFFER', name: 'Limited Time Offer', desc: 'Urgency countdown' },
      { type: 'COUNTDOWN_OFFER', name: 'Countdown Offer', desc: 'Live ticking timer' },
      { type: 'BOGO_OFFER', name: 'Buy One Get One', desc: 'BOGO promo section' },
      { type: 'COMBO_OFFERS', name: 'Combo Offers', desc: 'Bundle deals' },
      { type: 'SEASONAL_SALE', name: 'Seasonal Sale', desc: 'Summer/Winter campaign' },
      { type: 'FESTIVAL_SALE', name: 'Festival Sale', desc: 'Diwali/Eid/Christmas deals' },
      { type: 'OFFER_STRIP', name: 'Offer Strip', desc: 'Thin discount banner strip' },
      { type: 'COUPON_BANNER', name: 'Coupon Banner', desc: 'Promo code display section' },
    ]
  },
  {
    category: '📂 Categories & Collections', icon: '📂',
    types: [
      { type: 'CATEGORIES_GRID', name: 'Categories Grid', desc: 'Visual category grid' },
      { type: 'FEATURED_CATEGORIES', name: 'Featured Categories', desc: 'Horizontal category slider' },
      { type: 'SHOP_BY_CATEGORY', name: 'Shop By Category', desc: 'Iconic category selector' },
      { type: 'SHOP_BY_BRAND', name: 'Shop By Brand', desc: 'Brand logo showcase' },
      { type: 'SHOP_BY_COLLECTION', name: 'Shop By Collection', desc: 'Curated collections' },
      { type: 'WOMENS_COLLECTION', name: "Women's Collection", desc: 'Sarees, Lehengas & Ethnic' },
      { type: 'MENS_COLLECTION', name: "Men's Collection", desc: 'Kurta & Ethnic Suits' },
      { type: 'KIDS_COLLECTION', name: 'Kids Collection', desc: 'Children ethnic wear' },
      { type: 'FOOTWEAR_COLLECTION', name: 'Footwear Collection', desc: 'Shoes & sandals' },
      { type: 'ACCESSORIES_COLLECTION', name: 'Accessories Collection', desc: 'Bags, belts & more' },
      { type: 'JEWELLERY_COLLECTION', name: 'Jewellery Collection', desc: 'Necklaces & earrings' },
      { type: 'PREMIUM_COLLECTION', name: 'Premium Collection', desc: 'High-end fashion' },
      { type: 'LUXURY_COLLECTION', name: 'Luxury Collection', desc: 'Designer couture' },
      { type: 'BRAND_SHOWCASE', name: 'Brand Showcase', desc: 'Featured brand cards' },
      { type: 'FEATURED_BRANDS', name: 'Featured Brands', desc: 'Top brands slider' },
    ]
  },
  {
    category: '🌟 Social & Trust', icon: '🌟',
    types: [
      { type: 'TESTIMONIALS', name: 'Customer Reviews', desc: 'Star ratings & quotes' },
      { type: 'CUSTOMER_REVIEWS', name: 'Testimonials', desc: 'Customer testimonial cards' },
      { type: 'INSTAGRAM_FEED', name: 'Instagram Feed', desc: 'Shoppable IG grid' },
      { type: 'SOCIAL_MEDIA_FEED', name: 'Social Media Feed', desc: 'Multi-platform feed' },
      { type: 'NEWSLETTER', name: 'Newsletter Subscription', desc: 'Email signup box' },
      { type: 'DOWNLOAD_APP', name: 'Download Mobile App', desc: 'App store CTA' },
      { type: 'WHY_CHOOSE_US', name: 'Why Choose Us', desc: 'Free shipping, COD icons' },
      { type: 'STORE_FEATURES', name: 'Store Features', desc: 'USP highlights' },
      { type: 'ABOUT_STORE', name: 'About Store', desc: 'Brand story section' },
      { type: 'SERVICES', name: 'Services', desc: 'Service offerings' },
      { type: 'DELIVERY_INFO', name: 'Delivery Information', desc: 'Shipping info banner' },
      { type: 'SHIPPING_BANNER', name: 'Shipping Banner', desc: 'Free delivery notice' },
      { type: 'RETURN_POLICY', name: 'Return Policy Banner', desc: 'Returns & exchange' },
      { type: 'FAQ_PREVIEW', name: 'FAQ Preview', desc: 'Accordion FAQ block' },
      { type: 'BLOG_PREVIEW', name: 'Blog Preview', desc: 'Latest articles' },
    ]
  },
  {
    category: '📢 Announcements & Navigation', icon: '📢',
    types: [
      { type: 'ANNOUNCEMENT_BAR', name: 'Announcement Bar', desc: 'Top sticky alert' },
      { type: 'SCROLLING_ANNOUNCEMENT', name: 'Scrolling Announcement', desc: 'Marquee ticker' },
      { type: 'CONTACT_SECTION', name: 'Contact Section', desc: 'Phone, email & form' },
      { type: 'STORE_LOCATION', name: 'Store Location Map', desc: 'Google Maps embed' },
      { type: 'WHATSAPP_CONTACT', name: 'WhatsApp Contact', desc: 'Quick chat CTA' },
      { type: 'FLOATING_BUTTONS', name: 'Floating Buttons', desc: 'Fixed CTA buttons' },
    ]
  },
  {
    category: '🛠️ Custom Sections', icon: '🛠️',
    types: [
      { type: 'CUSTOM_HTML', name: 'Custom HTML Section', desc: 'Raw HTML/CSS code' },
      { type: 'CUSTOM_IMAGE', name: 'Custom Image Section', desc: 'Upload graphic section' },
      { type: 'CUSTOM_SECTION', name: 'Create Custom Section', desc: 'Build from scratch' },
    ]
  }
];

const ANIMATION_STYLES = [
  { value: 'NONE', label: 'No Animation' },
  { value: 'FADE_IN', label: 'Fade In' },
  { value: 'SLIDE_UP', label: 'Slide Up' },
  { value: 'SLIDE_LEFT', label: 'Slide Left' },
  { value: 'SLIDE_RIGHT', label: 'Slide Right' },
  { value: 'ZOOM_IN', label: 'Zoom In' },
  { value: 'BOUNCE', label: 'Bounce' },
  { value: 'PARALLAX', label: 'Parallax Scroll' },
];

const DEFAULT_CONFIG = {
  subtitle: '', description: '', imageUrl: '', videoUrl: '',
  buttonText: 'Explore Now', buttonLink: '#', buttonEnabled: true, buttonTarget: '_self',
  textColor: '#111827', backgroundColor: '#FFFFFF', buttonColor: '#D4AF37', overlayOpacity: '0',
  alignment: 'CENTER', padding: '48', margin: '0', borderRadius: '0', shadow: 'NONE',
  animationStyle: 'FADE_IN',
  maxProducts: '8', productSort: 'LATEST', categoryFilter: '', layout: 'GRID',
  devices: ['DESKTOP', 'TABLET', 'MOBILE'],
  startDate: '', endDate: '', autoPublish: true, autoHide: false,
  discountPercent: '30', discountFixed: '', flashTitle: '', showCountdown: true, showSoldPercent: false, showProgressBar: true,
  altText: '', seoTitle: '', seoDescription: '', imageTitle: '',
  customHtml: '',
};

/* ─── Collapsible Section Component ───────────────────────── */
const EditorSection = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50/80 text-left cursor-pointer hover:bg-gray-100 transition">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} className="text-amber-600" />}
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">{title}</span>
        </div>
        {open ? <FiChevronUp size={14} className="text-gray-400" /> : <FiChevronDown size={14} className="text-gray-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="p-4 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*   ADMIN HOMEPAGE MANAGEMENT — VISUAL PAGE BUILDER               */
/* ═══════════════════════════════════════════════════════════════ */
const AdminHomepage = () => {
  const [activeTab, setActiveTab] = useState('LAYOUT'); // LAYOUT | FLASH_SALE | SPECIAL_DEALS | COLLECTIONS
  const [sections, setSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Preview device
  const [previewDevice, setPreviewDevice] = useState('DESKTOP');

  // Section type picker modal
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  // Editor drawer
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [form, setForm] = useState({ title: '', sectionType: 'FEATURED_PRODUCTS', isActive: true, config: { ...DEFAULT_CONFIG } });
  const [saving, setSaving] = useState(false);

  // Cropper
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk selection
  const [selected, setSelected] = useState(new Set());

  // Drag state for reorder
  const [dragIdx, setDragIdx] = useState(null);

  /* ─── DATA FETCH ────────────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [secRes, catRes] = await Promise.all([
        api.get('/cms/homepage/admin/all').catch(() => api.get('/cms/homepage')),
        api.get('/categories').catch(() => ({ data: { data: [] } })),
      ]);
      setSections(secRes.data?.data || []);
      setCategories(catRes.data?.data || []);
    } catch { setSections([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ─── CONFIG HELPER ─────────────────────────────────────── */
  const parseConfig = (sec) => {
    try {
      if (typeof sec.config === 'string') return { ...DEFAULT_CONFIG, ...JSON.parse(sec.config) };
      if (typeof sec.config === 'object' && sec.config !== null) return { ...DEFAULT_CONFIG, ...sec.config };
    } catch {}
    return { ...DEFAULT_CONFIG };
  };

  const updateConfig = (key, value) => {
    setForm(prev => ({ ...prev, config: { ...prev.config, [key]: value } }));
  };

  /* ─── REORDER ───────────────────────────────────────────── */
  const handleMove = async (index, direction) => {
    const newIdx = direction === 'UP' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;

    const updated = [...sections];
    [updated[index], updated[newIdx]] = [updated[newIdx], updated[index]];
    const reordered = updated.map((s, i) => ({ ...s, sortOrder: i }));
    setSections(reordered);

    try {
      await api.put('/cms/homepage/sections/reorder', { sections: reordered.map(s => ({ id: s.id, sortOrder: s.sortOrder })) });
      toast.success('Section order updated!');
    } catch { toast.error('Failed to reorder'); fetchAll(); }
  };

  /* ─── DRAG & DROP REORDER ───────────────────────────────── */
  const handleDragStart = (index) => setDragIdx(index);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = async (dropIndex) => {
    if (dragIdx === null || dragIdx === dropIndex) { setDragIdx(null); return; }

    const updated = [...sections];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(dropIndex, 0, moved);
    const reordered = updated.map((s, i) => ({ ...s, sortOrder: i }));
    setSections(reordered);
    setDragIdx(null);

    try {
      await api.put('/cms/homepage/sections/reorder', { sections: reordered.map(s => ({ id: s.id, sortOrder: s.sortOrder })) });
      toast.success('Sections reordered!');
    } catch { toast.error('Failed to reorder'); fetchAll(); }
  };

  /* ─── ADD SECTION TYPE FROM PICKER ──────────────────────── */
  const handleAddType = async (item) => {
    setPickerOpen(false);
    try {
      const { data } = await api.post('/cms/homepage/sections', {
        title: item.name,
        sectionType: item.type,
        config: JSON.stringify({ ...DEFAULT_CONFIG }),
        isActive: true,
      });
      toast.success(`"${item.name}" added to homepage! 🎉`);
      fetchAll();
      if (data?.data) openEditor(data.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add section'); }
  };

  /* ─── OPEN EDITOR ───────────────────────────────────────── */
  const openEditor = (section) => {
    setEditingSection(section);
    const cfg = parseConfig(section);
    // Ensure devices is an array
    if (typeof cfg.devices === 'string') { try { cfg.devices = JSON.parse(cfg.devices); } catch { cfg.devices = ['DESKTOP', 'TABLET', 'MOBILE']; } }
    if (!Array.isArray(cfg.devices)) cfg.devices = ['DESKTOP', 'TABLET', 'MOBILE'];

    setForm({
      title: section.title || '',
      sectionType: section.sectionType || 'FEATURED_PRODUCTS',
      isActive: section.isActive !== false,
      config: cfg,
    });
    setEditorOpen(true);
  };

  /* ─── FILE SELECT → CROPPER ─────────────────────────────── */
  const handleFileSelect = (file) => {
    if (!file) return;
    const valid = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (!valid.includes(file.type)) { toast.error('Invalid file type. Use JPG, PNG, WEBP, or AVIF.'); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error('File too large. Maximum 20MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setCropperSrc(reader.result); setCropperOpen(true); };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (url) => {
    updateConfig('imageUrl', url);
    toast.success('Image cropped & optimized! ✨');
  };

  /* ─── SAVE SECTION ──────────────────────────────────────── */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Section Title is required'); return; }

    try {
      setSaving(true);
      const payload = {
        title: form.title,
        sectionType: form.sectionType,
        config: JSON.stringify(form.config),
        isActive: form.isActive,
      };

      if (editingSection) {
        await api.put(`/cms/homepage/sections/${editingSection.id}`, payload);
        toast.success(`"${form.title}" updated! ✅`);
      } else {
        await api.post('/cms/homepage/sections', payload);
        toast.success(`"${form.title}" created! 🚀`);
      }
      setEditorOpen(false);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  /* ─── DUPLICATE ─────────────────────────────────────────── */
  const handleDuplicate = async (sec) => {
    try {
      await api.post(`/cms/homepage/sections/${sec.id}/duplicate`);
      toast.success(`"${sec.title}" duplicated!`);
      fetchAll();
    } catch { toast.error('Duplicate failed'); }
  };

  /* ─── TOGGLE PUBLISH / HIDE ─────────────────────────────── */
  const handleToggle = async (sec) => {
    try {
      await api.put(`/cms/homepage/sections/${sec.id}`, { isActive: !sec.isActive });
      toast.success(sec.isActive ? `"${sec.title}" hidden` : `"${sec.title}" published!`);
      fetchAll();
    } catch { toast.error('Failed to update visibility'); }
  };

  /* ─── DELETE ────────────────────────────────────────────── */
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/cms/homepage/sections/${deleteTarget.id}`);
      toast.success('Section deleted permanently 🗑️');
      setDeleteTarget(null);
      fetchAll();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  /* ─── BULK ACTIONS ──────────────────────────────────────── */
  const handleBulk = async (action) => {
    if (selected.size === 0) { toast.info('Select sections first'); return; }
    const ids = [...selected];
    try {
      if (action === 'PUBLISH') await Promise.all(ids.map(id => api.put(`/cms/homepage/sections/${id}`, { isActive: true })));
      else if (action === 'HIDE') await Promise.all(ids.map(id => api.put(`/cms/homepage/sections/${id}`, { isActive: false })));
      else if (action === 'DELETE') await Promise.all(ids.map(id => api.delete(`/cms/homepage/sections/${id}`)));
      else if (action === 'DUPLICATE') await Promise.all(ids.map(id => api.post(`/cms/homepage/sections/${id}/duplicate`)));
      toast.success(`Bulk ${action.toLowerCase()} completed!`);
      setSelected(new Set());
      fetchAll();
    } catch { toast.error('Bulk action failed'); }
  };

  const toggleSelect = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll = () => setSelected(new Set(filteredSections.map(s => s.id)));

  /* ─── FILTER ────────────────────────────────────────────── */
  const allTypes = useMemo(() => SECTION_CATEGORIES.flatMap(c => c.types), []);
  const filteredSections = useMemo(() => sections.filter(sec => {
    const q = search.toLowerCase();
    const matchSearch = !search || sec.title?.toLowerCase().includes(q) || sec.sectionType?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || (statusFilter === 'PUBLISHED' ? sec.isActive : !sec.isActive);
    const matchType = typeFilter === 'ALL' || sec.sectionType === typeFilter;
    return matchSearch && matchStatus && matchType;
  }), [sections, search, statusFilter, typeFilter]);

  /* ─── Stats ─────────────────────────────────────────────── */
  const totalSections = sections.length;
  const publishedCount = sections.filter(s => s.isActive).length;
  const hiddenCount = sections.filter(s => !s.isActive).length;

  /* ═══════════════════════════════════════════════════════════ */
  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-6">

      {/* ── HEADER ───────────────────────────────────────── */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Homepage Marketing & Sales Center</h1>
          <p className="text-sm text-gray-500 mt-0.5">Control every homepage section, flash sales, special deals, collections, and page builder</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition cursor-pointer" title="Refresh">
            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          {activeTab === 'LAYOUT' && (
            <Button icon={FiPlus} onClick={() => { setPickerSearch(''); setPickerOpen(true); }}>+ Add Homepage Section</Button>
          )}
        </div>
      </motion.div>

      {/* ── NAVIGATION TABS ───────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-1">
        {[
          { id: 'HEADER_MENU', label: '🧭 Header Menu Manager', icon: FiMenu },
          { id: 'DYNAMIC_SECTIONS', label: '🚀 Dynamic Sections Builder', icon: FiLayers },
          { id: 'LAYOUT', label: '📐 Layout & Page Builder', icon: FiLayout },
          { id: 'TRENDING', label: '🔥 Trending Products', icon: FiZap },
          { id: 'REVIEWS', label: '⭐ Customer Reviews', icon: FiStar },
          { id: 'HERITAGE', label: '👑 Heritage Brands', icon: FiTag },
          { id: 'SOCIAL', label: '📱 Social Media Follow', icon: FiLayout },
          { id: 'FLASH_SALE', label: '⚡ Midnight Flash Sales', icon: FiZap },
          { id: 'SPECIAL_DEALS', label: '🎁 Special Deals', icon: FiTag },
          { id: 'COLLECTIONS', label: '📦 Collections', icon: FiLayers },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border-b-2 ${
              activeTab === tab.id
                ? 'border-amber-500 text-amber-600 bg-amber-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENTS ──────────────────────────────────── */}
      {activeTab === 'HEADER_MENU' && <HeaderMenuManager />}
      {activeTab === 'DYNAMIC_SECTIONS' && <HomepageSectionManager />}
      {activeTab === 'TRENDING' && <TrendingProductsManager />}
      {activeTab === 'REVIEWS' && <CustomerReviewsManager />}
      {activeTab === 'HERITAGE' && <HeritageBrandsManager />}
      {activeTab === 'SOCIAL' && <SocialFollowManager />}
      {activeTab === 'FLASH_SALE' && <FlashSaleManager />}
      {activeTab === 'SPECIAL_DEALS' && <SpecialDealsManager />}
      {activeTab === 'COLLECTIONS' && <ProductCollectionsManager />}

      {activeTab === 'LAYOUT' && (
        <>
          {/* ── STATS DASHBOARD ──────────────────────────────── */}
          <motion.div variants={fadeInUp} className="grid grid-cols-3 sm:grid-cols-3 gap-3">
            {[
              { label: 'Total Sections', count: totalSections, color: 'text-blue-600 bg-blue-50 border-blue-100' },
              { label: 'Published', count: publishedCount, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
              { label: 'Hidden', count: hiddenCount, color: 'text-gray-600 bg-gray-100 border-gray-200' },
            ].map(item => (
              <div key={item.label} className={`p-4 rounded-2xl border shadow-sm ${item.color}`}>
                <p className="text-2xl font-black">{item.count}</p>
                <p className="text-[11px] font-semibold opacity-80 mt-0.5">{item.label}</p>
              </div>
            ))}
          </motion.div>

      {/* ── TOOLBAR: Search, Filters, Device Preview, Bulk ── */}
      <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or type..." className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"><FiX size={14} /></button>}
        </div>

        {/* Status Filter */}
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
          <option value="ALL">All Status</option>
          <option value="PUBLISHED">Published</option>
          <option value="HIDDEN">Hidden</option>
        </select>

        {/* Type Filter */}
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 max-w-[180px]">
          <option value="ALL">All Types</option>
          {allTypes.map(t => <option key={t.type} value={t.type}>{t.name}</option>)}
        </select>

        {/* Device Preview Switcher */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl ml-auto">
          {[
            { key: 'DESKTOP', icon: FiMonitor },
            { key: 'TABLET', icon: FiTablet },
            { key: 'MOBILE', icon: FiSmartphone },
          ].map(d => {
            const Ic = d.icon;
            return (
              <button key={d.key} type="button" onClick={() => setPreviewDevice(d.key)} className={`p-1.5 rounded-lg transition cursor-pointer ${previewDevice === d.key ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`} title={d.key}>
                <Ic size={14} />
              </button>
            );
          })}
        </div>

        <span className="text-xs font-bold text-gray-400">{filteredSections.length} sections</span>
      </motion.div>

      {/* ── BULK ACTIONS BAR ──────────────────────────────── */}
      {selected.size > 0 && (
        <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-2 bg-amber-50 border border-amber-200 p-3 rounded-2xl">
          <span className="text-xs font-bold text-amber-800">{selected.size} selected</span>
          <div className="flex items-center gap-1.5 ml-auto">
            <button onClick={() => handleBulk('PUBLISH')} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition cursor-pointer">Publish</button>
            <button onClick={() => handleBulk('HIDE')} className="px-3 py-1.5 rounded-lg bg-gray-600 text-white text-[10px] font-bold hover:bg-gray-700 transition cursor-pointer">Hide</button>
            <button onClick={() => handleBulk('DUPLICATE')} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-bold hover:bg-indigo-700 transition cursor-pointer">Duplicate</button>
            <button onClick={() => handleBulk('DELETE')} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-[10px] font-bold hover:bg-red-700 transition cursor-pointer">Delete</button>
            <button onClick={() => setSelected(new Set())} className="px-2 py-1.5 rounded-lg text-gray-500 text-[10px] font-bold hover:bg-gray-100 transition cursor-pointer">Clear</button>
          </div>
        </motion.div>
      )}

      {/* ── SECTION CARDS LIST ────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-3xl p-5 animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-100" />
              <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-1/3" /><div className="h-3 bg-gray-100 rounded w-1/4" /></div>
              <div className="w-20 h-8 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredSections.length === 0 ? (
        /* ── EMPTY STATE ──────────────────────────────────── */
        <motion.div variants={fadeInUp} className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-sm">
          <div className="w-24 h-24 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-5 border border-amber-100">
            <FiLayers size={48} />
          </div>
          <h3 className="font-bold text-gray-900 text-xl mb-2">No homepage sections have been created.</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">Start building your visual homepage by adding hero sliders, product showcases, flash sales, testimonials, and 60+ other section types.</p>
          <Button icon={FiPlus} onClick={() => setPickerOpen(true)}>Create Your First Homepage Section</Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {/* Select All */}
          <div className="flex items-center gap-2 px-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={selected.size === filteredSections.length && filteredSections.length > 0} onChange={() => selected.size === filteredSections.length ? setSelected(new Set()) : selectAll()} className="rounded text-amber-500 focus:ring-amber-400 cursor-pointer" />
              <span className="text-xs font-semibold text-gray-500">Select All</span>
            </label>
          </div>

          {filteredSections.map((sec, index) => {
            const isSelected = selected.has(sec.id);
            const cfg = parseConfig(sec);
            const typeMeta = allTypes.find(t => t.type === sec.sectionType);

            return (
              <motion.div
                key={sec.id}
                layout
                variants={fadeInUp}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                className={`bg-white border rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 ${
                  isSelected ? 'border-amber-400 ring-2 ring-amber-200' : dragIdx === index ? 'border-blue-400 ring-2 ring-blue-200 opacity-70' : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 md:p-5">
                  {/* Left: Reorder + Checkbox + Preview */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Reorder controls */}
                    <div className="flex flex-col items-center gap-0.5 shrink-0">
                      <button onClick={() => handleMove(index, 'UP')} disabled={index === 0} className="p-1 rounded text-gray-300 hover:text-gray-600 disabled:opacity-20 cursor-pointer transition"><FiArrowUp size={13} /></button>
                      <span className="text-[10px] font-mono font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 cursor-grab active:cursor-grabbing select-none" title="Drag to reorder">#{index + 1}</span>
                      <button onClick={() => handleMove(index, 'DOWN')} disabled={index === sections.length - 1} className="p-1 rounded text-gray-300 hover:text-gray-600 disabled:opacity-20 cursor-pointer transition"><FiArrowDown size={13} /></button>
                    </div>

                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(sec.id)} className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer shrink-0" />

                    {/* Section preview thumbnail */}
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-gray-200 flex items-center justify-center">
                      {cfg.imageUrl ? (
                        <img src={cfg.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FiLayers size={20} className="text-gray-300" />
                      )}
                    </div>

                    {/* Section info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-sm truncate">{sec.title}</h3>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${sec.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          {sec.isActive ? '● PUBLISHED' : '○ HIDDEN'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                          {typeMeta?.name || sec.sectionType}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 border border-purple-200 text-[10px] font-bold">
                          Priority #{sec.sortOrder}
                        </span>
                        {cfg.startDate && (
                          <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-0.5">
                            <FiCalendar size={10} /> {cfg.startDate} → {cfg.endDate || '∞'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 ml-auto shrink-0 flex-wrap justify-end">
                    <button onClick={() => openEditor(sec)} className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold border border-blue-200 transition cursor-pointer flex items-center gap-1">
                      <FiEdit size={12} /> Edit
                    </button>
                    <button onClick={() => handleDuplicate(sec)} className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[11px] font-bold border border-indigo-200 transition cursor-pointer flex items-center gap-1">
                      <FiCopy size={12} /> Duplicate
                    </button>
                    <button onClick={() => handleToggle(sec)} className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${sec.isActive ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}>
                      {sec.isActive ? <><FiEyeOff size={12} /> Hide</> : <><FiEye size={12} /> Publish</>}
                    </button>
                    <button onClick={() => setDeleteTarget(sec)} className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition cursor-pointer" title="Delete">
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/*   SECTION TYPE PICKER MODAL (60+ types)                 */}
      {/* ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {pickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] shadow-2xl border border-gray-100 flex flex-col overflow-hidden">

              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                <div>
                  <h2 className="text-lg font-black text-gray-900">+ Add Homepage Section</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Choose from 60+ pre-built section types for your visual homepage</p>
                </div>
                <button onClick={() => setPickerOpen(false)} className="p-2 rounded-xl hover:bg-gray-200 text-gray-500 transition cursor-pointer"><FiX size={20} /></button>
              </div>

              {/* Search */}
              <div className="px-6 py-3 border-b border-gray-100">
                <div className="relative">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input type="text" value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} placeholder="Search section types..." autoFocus className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none" />
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5 flex-1 overflow-y-auto space-y-6">
                {SECTION_CATEGORIES.map(cat => {
                  const items = cat.types.filter(t => !pickerSearch || t.name.toLowerCase().includes(pickerSearch.toLowerCase()) || t.desc.toLowerCase().includes(pickerSearch.toLowerCase()));
                  if (items.length === 0) return null;

                  return (
                    <div key={cat.category}>
                      <h3 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/50 w-fit mb-3">{cat.category}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                        {items.map(item => (
                          <button key={item.type} type="button" onClick={() => handleAddType(item)}
                            className="p-3.5 rounded-2xl border border-gray-200 bg-white hover:border-amber-400 hover:bg-amber-50/40 text-left transition-all group shadow-sm cursor-pointer">
                            <div className="flex justify-between items-start mb-0.5">
                              <h4 className="font-bold text-xs text-gray-900 group-hover:text-amber-800 leading-snug">{item.name}</h4>
                              <span className="text-amber-600 opacity-0 group-hover:opacity-100 transition"><FiPlus size={14} /></span>
                            </div>
                            <p className="text-[10px] text-gray-400 leading-snug">{item.desc}</p>
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
      {/*   SECTION EDITOR DRAWER (ALL SETTINGS)                  */}
      {/* ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {editorOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setEditorOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl overflow-hidden flex flex-col">

              <form onSubmit={handleSave} className="flex flex-col h-full">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
                  <div>
                    <h2 className="text-base font-black text-gray-900">{editingSection ? 'Edit Section' : 'New Section'}</h2>
                    <p className="text-[11px] text-gray-500">Type: <span className="font-bold text-amber-700">{allTypes.find(t => t.type === form.sectionType)?.name || form.sectionType}</span></p>
                  </div>
                  <button type="button" onClick={() => setEditorOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition cursor-pointer"><FiX size={20} /></button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

                  {/* 1. Section Identity */}
                  <EditorSection title="Section Identity" icon={FiType}>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Section Title *</label>
                      <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Subtitle</label>
                      <input type="text" value={form.config.subtitle} onChange={e => updateConfig('subtitle', e.target.value)} placeholder="Short description below title" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Description</label>
                      <textarea value={form.config.description} onChange={e => updateConfig('description', e.target.value)} rows={2} placeholder="Detailed description..." className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition resize-none" />
                    </div>
                  </EditorSection>

                  {/* 2. Image Upload */}
                  <EditorSection title="Banner / Background Image" icon={FiImage}>
                    <div className="flex items-center gap-3">
                      {form.config.imageUrl && (
                        <div className="relative w-28 h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-gray-200">
                          <img src={form.config.imageUrl} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => { setCropperSrc(form.config.imageUrl); setCropperOpen(true); }} className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[10px] font-bold opacity-0 hover:opacity-100 transition cursor-pointer gap-1">
                            <FiCrop size={12} /> Crop
                          </button>
                        </div>
                      )}
                      <label className="flex-1 border-2 border-dashed border-gray-300 hover:border-amber-400 rounded-2xl p-5 text-center cursor-pointer bg-gray-50 transition-colors">
                        <FiUploadCloud size={28} className="mx-auto text-amber-500 mb-1" />
                        <span className="text-xs font-bold text-gray-700 block">Upload, Drag & Drop, or Paste</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">JPG, PNG, WEBP, AVIF (Max 20MB)</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e => handleFileSelect(e.target.files?.[0])} className="hidden" />
                      </label>
                    </div>
                    {form.config.videoUrl !== undefined && (
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Video URL (YouTube/Vimeo)</label>
                        <input type="url" value={form.config.videoUrl} onChange={e => updateConfig('videoUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                      </div>
                    )}
                  </EditorSection>

                  {/* 3. CTA Button */}
                  <EditorSection title="CTA Button" icon={FiLink} defaultOpen={false}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.config.buttonEnabled !== false} onChange={e => updateConfig('buttonEnabled', e.target.checked)} className="rounded text-amber-500 focus:ring-amber-400" />
                      <span className="text-xs font-semibold text-gray-700">Enable CTA Button</span>
                    </label>
                    {form.config.buttonEnabled !== false && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-gray-700 block mb-1">Button Text</label>
                            <input type="text" value={form.config.buttonText} onChange={e => updateConfig('buttonText', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-700 block mb-1">Button URL</label>
                            <input type="text" value={form.config.buttonLink} onChange={e => updateConfig('buttonLink', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="radio" name="btnTarget" checked={form.config.buttonTarget === '_self'} onChange={() => updateConfig('buttonTarget', '_self')} className="text-amber-500 focus:ring-amber-400" />
                            <span className="text-xs text-gray-700">Same Tab</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="radio" name="btnTarget" checked={form.config.buttonTarget === '_blank'} onChange={() => updateConfig('buttonTarget', '_blank')} className="text-amber-500 focus:ring-amber-400" />
                            <span className="text-xs text-gray-700">New Tab</span>
                          </label>
                        </div>
                      </>
                    )}
                  </EditorSection>

                  {/* 4. Product Display */}
                  <EditorSection title="Product Display Settings" icon={FiGrid} defaultOpen={false}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Category Filter</label>
                        <select value={form.config.categoryFilter} onChange={e => updateConfig('categoryFilter', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs bg-white">
                          <option value="">All Categories</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Sorting</label>
                        <select value={form.config.productSort} onChange={e => updateConfig('productSort', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs bg-white">
                          <option value="LATEST">Latest</option>
                          <option value="BEST_SELLING">Best Selling</option>
                          <option value="HIGHEST_RATED">Highest Rated</option>
                          <option value="PRICE_LOW">Lowest Price</option>
                          <option value="PRICE_HIGH">Highest Price</option>
                          <option value="MANUAL">Manual Selection</option>
                          <option value="RANDOM">Random</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Max Products</label>
                        <input type="number" value={form.config.maxProducts} onChange={e => updateConfig('maxProducts', e.target.value)} min="1" max="50" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Layout</label>
                        <select value={form.config.layout} onChange={e => updateConfig('layout', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs bg-white">
                          <option value="GRID">Grid</option>
                          <option value="SLIDER">Slider</option>
                          <option value="LIST">List</option>
                        </select>
                      </div>
                    </div>
                  </EditorSection>

                  {/* 5. Flash Sale / Countdown */}
                  <EditorSection title="Flash Sale & Countdown Timer" icon={FiZap} defaultOpen={false}>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Flash Sale Title</label>
                      <input type="text" value={form.config.flashTitle} onChange={e => updateConfig('flashTitle', e.target.value)} placeholder="MIDNIGHT FLASH SALE" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Discount %</label>
                        <input type="number" value={form.config.discountPercent} onChange={e => updateConfig('discountPercent', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Fixed Discount ₹</label>
                        <input type="number" value={form.config.discountFixed} onChange={e => updateConfig('discountFixed', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={form.config.showCountdown !== false} onChange={e => updateConfig('showCountdown', e.target.checked)} className="rounded text-amber-500" />
                        <span className="text-xs text-gray-700">Countdown Timer</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={form.config.showSoldPercent === true} onChange={e => updateConfig('showSoldPercent', e.target.checked)} className="rounded text-amber-500" />
                        <span className="text-xs text-gray-700">Show Sold %</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={form.config.showProgressBar !== false} onChange={e => updateConfig('showProgressBar', e.target.checked)} className="rounded text-amber-500" />
                        <span className="text-xs text-gray-700">Progress Bar</span>
                      </label>
                    </div>
                  </EditorSection>

                  {/* 6. Colors & Styling */}
                  <EditorSection title="Colors & Styling" icon={FiSliders} defaultOpen={false}>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Text Color</label>
                        <input type="color" value={form.config.textColor} onChange={e => updateConfig('textColor', e.target.value)} className="w-full h-9 rounded-xl border cursor-pointer" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Background</label>
                        <input type="color" value={form.config.backgroundColor} onChange={e => updateConfig('backgroundColor', e.target.value)} className="w-full h-9 rounded-xl border cursor-pointer" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Button Color</label>
                        <input type="color" value={form.config.buttonColor} onChange={e => updateConfig('buttonColor', e.target.value)} className="w-full h-9 rounded-xl border cursor-pointer" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Overlay Opacity: {Math.round(form.config.overlayOpacity * 100)}%</label>
                      <input type="range" min="0" max="1" step="0.05" value={form.config.overlayOpacity} onChange={e => updateConfig('overlayOpacity', e.target.value)} className="w-full accent-amber-500 cursor-pointer" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Text Alignment</label>
                        <select value={form.config.alignment} onChange={e => updateConfig('alignment', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white">
                          <option value="LEFT">Left</option>
                          <option value="CENTER">Center</option>
                          <option value="RIGHT">Right</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Animation Style</label>
                        <select value={form.config.animationStyle} onChange={e => updateConfig('animationStyle', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white">
                          {ANIMATION_STYLES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Padding</label>
                        <input type="number" value={form.config.padding} onChange={e => updateConfig('padding', e.target.value)} min="0" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Margin</label>
                        <input type="number" value={form.config.margin} onChange={e => updateConfig('margin', e.target.value)} min="0" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Radius</label>
                        <input type="number" value={form.config.borderRadius} onChange={e => updateConfig('borderRadius', e.target.value)} min="0" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Shadow</label>
                        <select value={form.config.shadow} onChange={e => updateConfig('shadow', e.target.value)} className="w-full px-2 py-2 rounded-xl border border-gray-200 text-xs bg-white">
                          <option value="NONE">None</option>
                          <option value="SM">Small</option>
                          <option value="MD">Medium</option>
                          <option value="LG">Large</option>
                          <option value="XL">Extra Large</option>
                        </select>
                      </div>
                    </div>
                  </EditorSection>

                  {/* 7. Scheduling */}
                  <EditorSection title="Scheduling & Auto Publish" icon={FiCalendar} defaultOpen={false}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Start Date</label>
                        <input type="datetime-local" value={form.config.startDate} onChange={e => updateConfig('startDate', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">End Date</label>
                        <input type="datetime-local" value={form.config.endDate} onChange={e => updateConfig('endDate', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.config.autoPublish !== false} onChange={e => updateConfig('autoPublish', e.target.checked)} className="rounded text-amber-500" />
                        <span className="text-xs text-gray-700">Automatically Publish on Start Date</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.config.autoHide === true} onChange={e => updateConfig('autoHide', e.target.checked)} className="rounded text-amber-500" />
                        <span className="text-xs text-gray-700">Automatically Hide on End Date</span>
                      </label>
                    </div>
                  </EditorSection>

                  {/* 8. Device Targeting */}
                  <EditorSection title="Device Targeting" icon={FiMonitor} defaultOpen={false}>
                    <div className="flex gap-3">
                      {[
                        { key: 'DESKTOP', label: 'Desktop / Laptop', icon: FiMonitor },
                        { key: 'TABLET', label: 'Tablet', icon: FiTablet },
                        { key: 'MOBILE', label: 'Mobile', icon: FiSmartphone },
                      ].map(item => {
                        const Icon = item.icon;
                        const isChecked = Array.isArray(form.config.devices) && form.config.devices.includes(item.key);
                        return (
                          <label key={item.key} className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition ${isChecked ? 'border-amber-400 bg-amber-50/50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                            <input type="checkbox" checked={isChecked} onChange={() => {
                              const devs = Array.isArray(form.config.devices) ? [...form.config.devices] : ['DESKTOP', 'TABLET', 'MOBILE'];
                              if (isChecked) updateConfig('devices', devs.filter(d => d !== item.key));
                              else updateConfig('devices', [...devs, item.key]);
                            }} className="hidden" />
                            <Icon size={18} className={isChecked ? 'text-amber-600' : 'text-gray-400'} />
                            <span className={`text-[10px] font-bold ${isChecked ? 'text-amber-700' : 'text-gray-500'}`}>{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </EditorSection>

                  {/* 9. SEO & Accessibility */}
                  <EditorSection title="SEO & Accessibility" icon={FiTag} defaultOpen={false}>
                    <input type="text" value={form.config.altText} onChange={e => updateConfig('altText', e.target.value)} placeholder="Image Alt Text" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500" />
                    <input type="text" value={form.config.imageTitle} onChange={e => updateConfig('imageTitle', e.target.value)} placeholder="Image Title Attribute" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500" />
                    <input type="text" value={form.config.seoTitle} onChange={e => updateConfig('seoTitle', e.target.value)} placeholder="Meta Title" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500" />
                    <textarea value={form.config.seoDescription} onChange={e => updateConfig('seoDescription', e.target.value)} placeholder="Meta Description" rows={2} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 resize-none" />
                  </EditorSection>

                  {/* 10. Custom HTML (for CUSTOM_HTML type) */}
                  {(form.sectionType === 'CUSTOM_HTML' || form.sectionType === 'CUSTOM_SECTION') && (
                    <EditorSection title="Custom HTML Code" icon={FiLayout} defaultOpen={true}>
                      <textarea value={form.config.customHtml} onChange={e => updateConfig('customHtml', e.target.value)} rows={6} placeholder="<div class='custom-section'>...</div>" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 font-mono resize-y" />
                    </EditorSection>
                  )}

                  {/* 11. Visibility & Publishing */}
                  <EditorSection title="Visibility & Publishing" icon={FiEye}>
                    <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-xl bg-gray-50 hover:bg-gray-100 transition">
                      <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4" />
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">{form.isActive ? '● Published — Live on Homepage' : '○ Hidden — Not visible to customers'}</span>
                        <span className="text-[10px] text-gray-500">Toggle to publish or hide this section from the live customer homepage</span>
                      </div>
                    </label>
                  </EditorSection>

                  {/* Live Preview */}
                  <EditorSection title="Live Section Preview" icon={FiEye} defaultOpen={false}>
                    <div className="bg-slate-950 rounded-2xl p-4 flex justify-center">
                      <div className={`transition-all duration-300 rounded-xl overflow-hidden relative border border-white/10 ${
                        previewDevice === 'MOBILE' ? 'w-[280px] h-[280px]' : previewDevice === 'TABLET' ? 'w-[440px] h-[200px]' : 'w-full h-[200px]'
                      }`} style={{ backgroundColor: form.config.backgroundColor }}>
                        {form.config.imageUrl ? (
                          <>
                            <img src={form.config.imageUrl} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${form.config.overlayOpacity})` }} />
                            <div className={`absolute inset-0 flex flex-col justify-center p-6 ${form.config.alignment === 'CENTER' ? 'items-center text-center' : form.config.alignment === 'RIGHT' ? 'items-end text-right' : 'items-start text-left'}`}>
                              {form.title && <h3 className="text-sm font-bold drop-shadow-lg" style={{ color: form.config.textColor }}>{form.title}</h3>}
                              {form.config.subtitle && <p className="text-[11px] mt-0.5 drop-shadow opacity-80" style={{ color: form.config.textColor }}>{form.config.subtitle}</p>}
                              {form.config.buttonEnabled !== false && form.config.buttonText && (
                                <span className="mt-2 px-4 py-1.5 rounded-full text-[10px] font-extrabold shadow-md" style={{ backgroundColor: form.config.buttonColor, color: '#000' }}>
                                  {form.config.buttonText}
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ color: form.config.textColor }}>
                            <p className="text-sm font-bold">{form.title || 'Section Title'}</p>
                            {form.config.subtitle && <p className="text-[10px] opacity-60">{form.config.subtitle}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1 bg-gray-100 p-1 rounded-xl w-fit mx-auto">
                      {[{ k: 'DESKTOP', i: FiMonitor }, { k: 'TABLET', i: FiTablet }, { k: 'MOBILE', i: FiSmartphone }].map(d => {
                        const Ic = d.i;
                        return <button key={d.k} type="button" onClick={() => setPreviewDevice(d.k)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${previewDevice === d.k ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}><Ic size={12} /> {d.k}</button>;
                      })}
                    </div>
                  </EditorSection>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 z-10 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 shrink-0">
                  <button type="button" onClick={() => { setForm(f => ({ ...f, isActive: false })); }}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition cursor-pointer">
                    Save as Draft
                  </button>
                  <button type="button" onClick={() => setEditorOpen(false)} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50 transition cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black text-xs font-extrabold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer">
                    {saving ? 'Saving...' : form.isActive ? 'Publish Section' : 'Save Section'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*   IMAGE CROPPER MODAL                                   */}
      {/* ═══════════════════════════════════════════════════════ */}
      <GlobalImageEditor
        isOpen={cropperOpen}
        onClose={() => setCropperOpen(false)}
        onComplete={handleCropComplete}
        imageSrc={cropperSrc}
        aspectRatio={16/9}
        aspectPresets={[
          { label: '16:9', value: 16/9 },
          { label: '3:1', value: 3 },
          { label: '4:3', value: 4/3 },
          { label: '1:1', value: 1 },
          { label: 'Free', value: null },
        ]}
        title="Edit Section Image"
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

              {(() => {
                const cfg = parseConfig(deleteTarget);
                return cfg.imageUrl ? <img src={cfg.imageUrl} alt="" className="w-full h-24 object-cover rounded-2xl mb-3 border border-gray-200" /> : null;
              })()}

              <p className="text-xs text-gray-700 mb-5 bg-red-50 border border-red-100 rounded-xl p-3">
                Are you sure you want to permanently delete <strong>&quot;{deleteTarget.title}&quot;</strong> from the homepage?
              </p>

              <div className="flex gap-2">
                <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1 py-2.5 rounded-xl border text-gray-600 text-xs font-semibold hover:bg-gray-100 transition cursor-pointer">Cancel</button>
                <button onClick={handleDeleteConfirm} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition shadow-md cursor-pointer">
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </>
      )}
    </motion.div>
  );
};

export default AdminHomepage;
