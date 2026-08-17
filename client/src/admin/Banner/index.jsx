import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/common/Button';
import api from '../../config/api';
import { formatDate } from '../../utils/formatDate';
import GlobalImageEditor from '../../components/common/GlobalImageEditor';
import {
  FiPlus, FiTrash2, FiEdit, FiSearch, FiX, FiCopy, FiCheck,
  FiFilter, FiEye, FiEyeOff, FiImage, FiRefreshCw, FiUploadCloud,
  FiAlertTriangle, FiMonitor, FiTablet, FiSmartphone, FiExternalLink,
  FiChevronDown, FiChevronUp, FiBarChart2, FiMousePointer,
  FiCalendar, FiLayers, FiLayout, FiZap, FiStar, FiCrop, FiShield
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { notifyContentUpdated } from '../../utils/cacheUtils';

/* ─── Configs & Helpers ──────────────────────────────────── */
const fadeInUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } };

const POSITIONS = [
  { value: 'HOMEPAGE_HERO', label: 'Homepage Hero Slider' },
  { value: 'HOMEPAGE_MIDDLE', label: 'Homepage Middle' },
  { value: 'HOMEPAGE_BOTTOM', label: 'Homepage Bottom' },
  { value: 'CATEGORY_PAGE', label: 'Category Page' },
  { value: 'PRODUCT_PAGE', label: 'Product Page' },
  { value: 'OFFER_PAGE', label: 'Offer Page' },
  { value: 'FESTIVAL', label: 'Festival Banner' },
  { value: 'POPUP', label: 'Popup Banner' },
  { value: 'FLASH_SALE', label: 'Flash Sale Banner' },
  { value: 'COLLECTION', label: 'Collection Banner' },
];

const TYPES = [
  { value: 'STATIC', label: 'Static Banner' },
  { value: 'SLIDER', label: 'Slider Banner' },
  { value: 'VIDEO', label: 'Video Banner' },
  { value: 'COUNTDOWN', label: 'Countdown Banner' },
  { value: 'OFFER', label: 'Offer Banner' },
  { value: 'COLLECTION', label: 'Collection Banner' },
  { value: 'BRAND', label: 'Brand Banner' },
  { value: 'ANNOUNCEMENT', label: 'Announcement Banner' },
];

const STATUSES = [
  { value: 'PUBLISHED', label: 'Published', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'DRAFT', label: 'Draft', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  { value: 'SCHEDULED', label: 'Scheduled', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'HIDDEN', label: 'Hidden', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'EXPIRED', label: 'Expired', color: 'bg-rose-50 text-rose-600 border-rose-200' },
];

const getStatusStyle = (status) => STATUSES.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-600 border-gray-200';

const defaultForm = {
  title: '', subtitle: '', description: '', imageUrl: '', buttonText: 'Shop Collection', buttonLink: '',
  ctaEnabled: true, openInNewTab: false,
  textColor: '#FFFFFF', buttonColor: '#D4AF37', overlayOpacity: '0.3', textAlignment: 'CENTER',
  bannerType: 'STATIC', position: 'HOMEPAGE_HERO', priority: '0', sortOrder: '0',
  status: 'PUBLISHED', isActive: true, altText: '', seoTitle: '', seoDescription: '',
  startDate: '', endDate: '', devices: ['DESKTOP', 'TABLET', 'MOBILE'],
};

/* ═══════════════════════════════════════════════════════════ */
/*   ADMIN BANNER MANAGEMENT PAGE                              */
/* ═══════════════════════════════════════════════════════════ */
const AdminBanner = () => {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [posFilter, setPosFilter] = useState('ALL');

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('DESKTOP'); // DESKTOP | TABLET | MOBILE

  // Cropper Modal state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Selected state for bulk actions
  const [selected, setSelected] = useState(new Set());

  /* ─── DATA FETCH ────────────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [banRes, statRes, catRes] = await Promise.all([
        api.get('/cms/banners'),
        api.get('/cms/banners/stats').catch(() => ({ data: { data: null } })),
        api.get('/categories').catch(() => ({ data: { data: [] } })),
      ]);
      setBanners(banRes.data?.data || []);
      setStats(statRes.data?.data || null);
      const fetchedCats = catRes.data?.data || catRes.data || [];
      setCategories(Array.isArray(fetchedCats) ? fetchedCats : []);
    } catch { setBanners([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ─── FILE SELECT / DRAG / PASTE → OPEN CROPPER ─────────── */
  const handleFileSelect = (file) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid File Type! Please upload JPG, PNG, WEBP, or AVIF.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File Too Large! Maximum allowed size is 20MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropperSrc(reader.result);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        handleFileSelect(item.getAsFile());
        break;
      }
    }
  };

  const handleCropComplete = (url) => {
    setForm(prev => ({ ...prev, imageUrl: url }));
    setImagePreview(url);
    toast.success('Image Cropped & Uploaded Successfully! 🎉');
  };

  /* ─── DRAWER CONTROLS ──────────────────────────────────── */
  const openCreate = () => {
    setEditingBanner(null);
    setForm({ ...defaultForm });
    setImagePreview('');
    setDrawerOpen(true);
  };

  const openEdit = (banner) => {
    setEditingBanner(banner);
    let devicesArr = ['DESKTOP', 'TABLET', 'MOBILE'];
    try { devicesArr = JSON.parse(banner.devices || '[]'); } catch {}
    setForm({
      title: banner.title || '', subtitle: banner.subtitle || '', description: banner.description || '',
      imageUrl: banner.imageUrl || '', 
      buttonText: banner.buttonText || 'Shop Collection', 
      buttonLink: (banner.buttonLink && banner.buttonLink !== '#') ? banner.buttonLink : '',
      ctaEnabled: banner.buttonText !== null && banner.buttonText !== '', openInNewTab: false,
      textColor: banner.textColor || '#FFFFFF', buttonColor: banner.buttonColor || '#D4AF37',
      overlayOpacity: banner.overlayOpacity?.toString() || '0.3', textAlignment: banner.textAlignment || 'CENTER',
      bannerType: banner.bannerType || 'STATIC', position: banner.position || 'HOMEPAGE_HERO',
      priority: banner.priority?.toString() || '0', sortOrder: banner.sortOrder?.toString() || '0',
      status: banner.status || 'PUBLISHED', isActive: banner.isActive !== false,
      altText: banner.altText || '', seoTitle: banner.seoTitle || '', seoDescription: banner.seoDescription || '',
      startDate: banner.startDate ? new Date(banner.startDate).toISOString().split('T')[0] : '',
      endDate: banner.endDate ? new Date(banner.endDate).toISOString().split('T')[0] : '',
      devices: devicesArr,
    });
    setImagePreview(banner.imageUrl || '');
    setDrawerOpen(true);
  };

  /* ─── SAVE ──────────────────────────────────────────────── */
  const handleSave = async (e) => {
    e.preventDefault();

    // Validation
    if (!form.imageUrl && !imagePreview) {
      toast.error('Missing Image! Please upload and crop a banner image.');
      return;
    }
    if (!form.title.trim()) {
      toast.error('Required Fields Missing! Banner Title is required.');
      return;
    }

    // Check Duplicate Banner Name
    const isDuplicate = banners.some(
      b => b.title?.toLowerCase() === form.title.trim().toLowerCase() && b.id !== editingBanner?.id
    );
    if (isDuplicate) {
      toast.error('Duplicate Banner Name! A banner with this title already exists.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        buttonText: form.buttonText ? form.buttonText.trim() : 'Shop Collection',
        buttonLink: (form.buttonLink && form.buttonLink.trim() !== '#') ? form.buttonLink.trim() : null,
        overlayOpacity: parseFloat(form.overlayOpacity || 0.3),
        priority: parseInt(form.priority || 0),
        sortOrder: parseInt(form.sortOrder || 0),
        devices: JSON.stringify(form.devices),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };

      if (editingBanner) {
        await api.put(`/cms/banners/${editingBanner.id}`, payload);
        toast.success('Banner Updated Successfully! ✨');
      } else {
        await api.post('/cms/banners', payload);
        toast.success('Banner Published Successfully! 🚀');
      }
      setDrawerOpen(false);
      notifyContentUpdated();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save banner');
    } finally { setSaving(false); }
  };

  /* ─── DUPLICATE ─────────────────────────────────────────── */
  const handleDuplicate = async (banner) => {
    try {
      await api.post(`/cms/banners/${banner.id}/duplicate`);
      toast.success(`Banner "${banner.title || 'Copy'}" Duplicated Successfully!`);
      notifyContentUpdated();
      fetchAll();
    } catch { toast.error('Failed to duplicate banner'); }
  };

  /* ─── TOGGLE PUBLISH ────────────────────────────────────── */
  const handleTogglePublish = async (banner) => {
    const newStatus = banner.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    const newActive = newStatus === 'PUBLISHED';
    try {
      await api.put(`/cms/banners/${banner.id}`, { status: newStatus, isActive: newActive });
      toast.success(newActive ? 'Banner Published Successfully!' : 'Banner Saved as Draft!');
      notifyContentUpdated();
      fetchAll();
    } catch { toast.error('Failed to update banner status'); }
  };

  /* ─── DELETE ────────────────────────────────────────────── */
  const handleDeleteSubmit = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/cms/banners/${deleteTarget.id}`);
      toast.success('Banner Deleted Successfully! 🗑️');
      setDeleteTarget(null);
      notifyContentUpdated();
      fetchAll();
    } catch { toast.error('Failed to delete banner'); }
    finally { setDeleting(false); }
  };

  /* ─── BULK ACTIONS ──────────────────────────────────────── */
  const handleBulkAction = async (action) => {
    if (selected.size === 0) { toast.info('Select banners first'); return; }
    const ids = [...selected];
    try {
      if (action === 'PUBLISH') {
        await Promise.all(ids.map(id => api.put(`/cms/banners/${id}`, { status: 'PUBLISHED', isActive: true })));
        toast.success(`${ids.length} Banners Published Successfully!`);
      } else if (action === 'UNPUBLISH') {
        await Promise.all(ids.map(id => api.put(`/cms/banners/${id}`, { status: 'DRAFT', isActive: false })));
        toast.success(`${ids.length} Banners Unpublished!`);
      } else if (action === 'DELETE') {
        await Promise.all(ids.map(id => api.delete(`/cms/banners/${id}`)));
        toast.success(`${ids.length} Banners Deleted Successfully!`);
      }
      setSelected(new Set());
      notifyContentUpdated();
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

  /* ─── FILTER & SEARCH ──────────────────────────────────── */
  const filtered = useMemo(() => banners.filter(b => {
    const matchSearch = !search || b.title?.toLowerCase().includes(search.toLowerCase()) || b.position?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchPos = posFilter === 'ALL' || b.position === posFilter;
    return matchSearch && matchStatus && matchPos;
  }), [banners, search, statusFilter, posFilter]);

  /* ═══════════════════════════════════════════════════════════ */
  return (
    <motion.div initial="initial" animate="animate" className="space-y-6">

      {/* ── HEADER ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Banner Manager</h1>
          <p className="text-sm text-gray-500">Manage promotional banners displayed across the website.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition cursor-pointer" title="Refresh">
            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <Button icon={FiPlus} onClick={openCreate}>+ Create Banner</Button>
        </div>
      </div>

      {/* ── STATS DASHBOARD ──────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Banners', count: stats.total, color: 'text-blue-600 bg-blue-50' },
            { label: 'Published', count: stats.published, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Drafts', count: stats.draft, color: 'text-gray-600 bg-gray-100' },
            { label: 'Scheduled', count: stats.scheduled, color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Total Views', count: stats.totalViews, color: 'text-amber-600 bg-amber-50' },
            { label: 'Total Clicks', count: stats.totalClicks, color: 'text-purple-600 bg-purple-50' },
          ].map(item => (
            <motion.div key={item.label} variants={fadeInUp} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-2xl font-black text-charcoal-900">{item.count}</p>
              <p className="text-[11px] font-semibold text-gray-500 mt-0.5">{item.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── SEARCH, FILTER & BULK ACTIONS ────────────────── */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by banner name..." className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><FiX size={14} /></button>}
        </div>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
          <option value="ALL">All Statuses</option>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <select value={posFilter} onChange={e => setPosFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
          <option value="ALL">All Display Positions</option>
          {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>

        {selected.size > 0 && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">{selected.size} selected</span>
            <button onClick={() => handleBulkAction('PUBLISH')} className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer">Publish</button>
            <button onClick={() => handleBulkAction('UNPUBLISH')} className="px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-[10px] font-bold border border-gray-200 hover:bg-gray-200 transition cursor-pointer">Unpublish</button>
            <button onClick={() => handleBulkAction('DELETE')} className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 text-[10px] font-bold border border-red-200 hover:bg-red-100 transition cursor-pointer">Delete</button>
          </div>
        )}

        <span className="text-xs font-bold text-gray-400 ml-auto">{filtered.length} banners</span>
      </div>

      {/* ── BANNER CARDS LIST ────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-3xl overflow-hidden animate-pulse">
              <div className="h-44 bg-gray-100" />
              <div className="p-4 space-y-2"><div className="h-4 bg-gray-100 rounded w-3/4" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        /* EMPTY STATE */
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-sm">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-100">
            <FiImage size={40} />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-1">No banners have been created yet.</h3>
          <p className="text-xs text-gray-400 mb-6 max-w-sm mx-auto">Create high-converting hero sliders, category banners, or festival promotional banners to boost customer engagement.</p>
          <Button icon={FiPlus} onClick={openCreate}>Create First Banner</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(banner => {
            const isSelected = selected.has(banner.id);
            const ctr = banner.views > 0 ? ((banner.clicks / banner.views) * 100).toFixed(1) : '0.0';
            return (
              <motion.div key={banner.id} layout variants={fadeInUp} initial="initial" animate="animate"
                className={`bg-white border rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 ${isSelected ? 'border-amber-400 ring-2 ring-amber-200' : 'border-gray-200'}`}>

                {/* Banner Preview */}
                <div className="relative h-48 bg-slate-900 overflow-hidden group">
                  <img src={banner.imageUrl} alt={banner.altText || banner.title || ''} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                  {/* Checkbox & Quick Actions */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                    <label className="flex items-center gap-2 cursor-pointer bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20">
                      <input type="checkbox" checked={isSelected} onClick={(e) => e.stopPropagation()} onChange={(e) => { e.stopPropagation(); toggleSelect(banner.id); }} className="rounded text-amber-500 focus:ring-amber-400 w-3.5 h-3.5 cursor-pointer" />
                      <span className="text-[10px] font-bold text-white uppercase">Select</span>
                    </label>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(banner)} className="p-1.5 rounded-lg bg-white/90 text-blue-600 hover:bg-white shadow-sm transition cursor-pointer" title="Edit"><FiEdit size={13} /></button>
                      <button onClick={() => handleDuplicate(banner)} className="p-1.5 rounded-lg bg-white/90 text-indigo-600 hover:bg-white shadow-sm transition cursor-pointer" title="Duplicate"><FiCopy size={13} /></button>
                      <button onClick={() => handleTogglePublish(banner)} className="p-1.5 rounded-lg bg-white/90 text-amber-600 hover:bg-white shadow-sm transition cursor-pointer" title={banner.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}>
                        {banner.status === 'PUBLISHED' ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                      </button>
                      <button onClick={() => setDeleteTarget(banner)} className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 shadow-sm transition cursor-pointer" title="Delete"><FiTrash2 size={13} /></button>
                    </div>
                  </div>

                  {/* Title & Status */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div className="text-white min-w-0 pr-2">
                      <h3 className="font-bold text-base truncate drop-shadow-md">{banner.title || 'Untitled Banner'}</h3>
                      {banner.subtitle && <p className="text-[11px] text-white/70 truncate">{banner.subtitle}</p>}
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${getStatusStyle(banner.status)}`}>
                      {banner.status}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                      📍 {POSITIONS.find(p => p.value === banner.position)?.label || banner.position}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                      🎨 {TYPES.find(t => t.value === banner.bannerType)?.label || banner.bannerType}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                      ⚡ Priority: {banner.priority}
                    </span>
                  </div>

                  {/* Analytics Bar */}
                  <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 p-2 rounded-2xl border border-gray-100">
                    <div>
                      <p className="text-sm font-black text-charcoal-900">{banner.views || 0}</p>
                      <p className="text-[10px] text-gray-500">Views</p>
                    </div>
                    <div>
                      <p className="text-sm font-black text-charcoal-900">{banner.clicks || 0}</p>
                      <p className="text-[10px] text-gray-500">Clicks</p>
                    </div>
                    <div>
                      <p className="text-sm font-black text-charcoal-900">{ctr}%</p>
                      <p className="text-[10px] text-gray-500">CTR</p>
                    </div>
                  </div>

                  {/* Meta timestamps */}
                  <div className="text-[10px] text-gray-400 flex items-center justify-between border-t pt-2">
                    <span>Created: {formatDate(banner.createdAt)}</span>
                    <span>Updated: {formatDate(banner.updatedAt)}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/*   CREATE / EDIT DRAWER WITH RESPONSIVE PREVIEW          */}
      {/* ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl overflow-y-auto" onPaste={handlePaste}>

              <form onSubmit={handleSave} className="flex flex-col h-full">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-charcoal-900">{editingBanner ? 'Edit Banner' : '+ Create Banner'}</h2>
                    <p className="text-xs text-gray-500">Upload image, crop, configure CTA & schedule visibility</p>
                  </div>
                  <button type="button" onClick={() => setDrawerOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition"><FiX size={20} /></button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                  {/* Image Upload Zone */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">1. Banner Image & Cropper *</h3>
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-2xl overflow-hidden transition-all ${
                        dragOver ? 'border-amber-400 bg-amber-50/50 scale-[1.01]' : 'border-gray-300 bg-gray-50 hover:border-amber-400'
                      } ${imagePreview || form.imageUrl ? 'h-52' : 'h-40'}`}
                    >
                      {(imagePreview || form.imageUrl) ? (
                        <div className="relative h-full">
                          <img src={imagePreview || form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => { setCropperSrc(imagePreview || form.imageUrl); setCropperOpen(true); }}
                              className="px-3.5 py-2 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-500 shadow-md transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <FiCrop size={14} /> Open Cropper Studio
                            </button>
                            <label className="px-3.5 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-gray-100 shadow-md transition cursor-pointer">
                              Change Image
                              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e => handleFileSelect(e.target.files?.[0])} className="hidden" />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                          <FiUploadCloud size={36} className="text-amber-500 mb-2" />
                          <p className="text-xs font-bold text-gray-800">Drag & Drop, Paste, or Click to Upload Image</p>
                          <p className="text-[10px] text-gray-400 mt-1">Supports JPG, PNG, WEBP, AVIF (Max 20MB)</p>
                          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e => handleFileSelect(e.target.files?.[0])} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Banner Details */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">2. Banner Content & Text</h3>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Banner Title *</label>
                      <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Royal Bridal Saree Collection 2026" required className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Subtitle</label>
                      <input type="text" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} placeholder="e.g. Handcrafted Pure Kanchipuram Silk with Gold Zari" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Description</label>
                      <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Additional text description overlay..." rows={2} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition resize-none" />
                    </div>
                  </div>

                  {/* CTA Button & Category Link Selector */}
                  <div className="space-y-3 p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <FiExternalLink className="text-amber-500" /> 3. CTA Button & Shop Category Redirect
                      </h3>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={form.ctaEnabled} onChange={e => setForm({ ...form, ctaEnabled: e.target.checked })} className="rounded text-amber-500 focus:ring-amber-400" />
                        <span className="text-xs font-semibold text-gray-700">Enable CTA Button</span>
                      </label>
                    </div>

                    {form.ctaEnabled && (
                      <div className="space-y-3 pt-1">
                        {/* Category Dropdown Selector */}
                        <div>
                          <label className="text-xs font-bold text-gray-700 block mb-1">
                            📁 Select Target Category / Collection Page *
                          </label>
                          <select
                            value={
                              categories.find(c => form.buttonLink === `/categories/${c.slug}` || form.buttonLink === `/products?category=${c.slug}`)?.slug ||
                              (form.buttonLink === '/products' ? 'ALL_PRODUCTS' : form.buttonLink === '/offers' ? 'OFFERS' : form.buttonLink === '/categories' ? 'ALL_CATEGORIES' : 'CUSTOM')
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'ALL_PRODUCTS') {
                                setForm(prev => ({ ...prev, buttonLink: '/products', buttonText: prev.buttonText || 'Shop All Products' }));
                              } else if (val === 'ALL_CATEGORIES') {
                                setForm(prev => ({ ...prev, buttonLink: '/categories', buttonText: prev.buttonText || 'Browse All Collections' }));
                              } else if (val === 'OFFERS') {
                                setForm(prev => ({ ...prev, buttonLink: '/offers', buttonText: prev.buttonText || 'View Special Offers' }));
                              } else if (val === 'CUSTOM') {
                                // keep custom input
                              } else {
                                const selectedCat = categories.find(c => c.slug === val);
                                if (selectedCat) {
                                  setForm(prev => ({
                                    ...prev,
                                    buttonLink: `/categories/${selectedCat.slug}`,
                                    buttonText: prev.buttonText || `Shop ${selectedCat.name}`
                                  }));
                                }
                              }
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs bg-white outline-none focus:border-amber-500 font-medium text-gray-800 shadow-sm"
                          >
                            <option value="">-- Choose Category or Page for Customer Redirect --</option>
                            {categories.length > 0 && (
                              <optgroup label="✨ Store Categories (Redirects to Category Page)">
                                {categories.map(cat => (
                                  <option key={cat.id} value={cat.slug}>
                                    📁 Category: {cat.name} ({cat.subcategories?.length || 0} subcategories)
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            <optgroup label="🛍️ Store Main Pages">
                              <option value="ALL_CATEGORIES">📁 All Collections Page (/categories)</option>
                              <option value="ALL_PRODUCTS">🛒 Full Products Catalog (/products)</option>
                              <option value="OFFERS">🏷️ Special Deals & Offers (/offers)</option>
                              <option value="CUSTOM">🔗 Custom URL Path</option>
                            </optgroup>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-gray-600 block mb-1">Button Text *</label>
                            <input
                              type="text"
                              value={form.buttonText}
                              onChange={e => setForm({ ...form, buttonText: e.target.value })}
                              placeholder="e.g. Shop Collection, Explore Sarees"
                              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-600 block mb-1">Target Redirect Link *</label>
                            <input
                              type="text"
                              value={form.buttonLink}
                              onChange={e => setForm({ ...form, buttonLink: e.target.value })}
                              placeholder="e.g. /categories/sarees"
                              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 font-mono bg-white"
                            />
                          </div>
                        </div>

                        {/* Live Redirect Indicator */}
                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-900 flex items-center justify-between flex-wrap gap-1">
                          <span className="font-semibold truncate">
                            🎯 Redirect Link: <code className="font-mono text-amber-800 font-bold">{form.buttonLink || '/categories'}</code>
                          </span>
                          <span className="shrink-0 font-bold bg-amber-200/80 px-2 py-0.5 rounded-md text-[10px]">
                            {form.buttonText || 'Shop Collection'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Position & Type */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">4. Display Position & Type</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Display Position</label>
                        <select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs bg-white outline-none focus:border-amber-500">
                          {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Banner Type</label>
                        <select value={form.bannerType} onChange={e => setForm({ ...form, bannerType: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs bg-white outline-none focus:border-amber-500">
                          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Display Priority</label>
                        <input type="number" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} placeholder="0" min="0" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Text Alignment</label>
                        <select value={form.textAlignment} onChange={e => setForm({ ...form, textAlignment: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs bg-white outline-none focus:border-amber-500">
                          <option value="LEFT">Left</option>
                          <option value="CENTER">Center</option>
                          <option value="RIGHT">Right</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Dark Overlay</label>
                        <input type="range" min="0" max="1" step="0.05" value={form.overlayOpacity} onChange={e => setForm({ ...form, overlayOpacity: e.target.value })} className="w-full mt-1.5 accent-amber-500 cursor-pointer" />
                        <span className="text-[10px] text-gray-400">{Math.round(form.overlayOpacity * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">5. Colors & Aesthetics</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Text Color</label>
                        <input type="color" value={form.textColor} onChange={e => setForm({ ...form, textColor: e.target.value })} className="w-full h-10 rounded-xl cursor-pointer border border-gray-200" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Button Color</label>
                        <input type="color" value={form.buttonColor} onChange={e => setForm({ ...form, buttonColor: e.target.value })} className="w-full h-10 rounded-xl cursor-pointer border border-gray-200" />
                      </div>
                    </div>
                  </div>

                  {/* Schedule & Visibility */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">6. Schedule & Active Duration</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Visibility Status</label>
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs bg-white outline-none focus:border-amber-500">
                          <option value="PUBLISHED">Publish Immediately</option>
                          <option value="DRAFT">Save as Draft</option>
                          <option value="SCHEDULED">Scheduled Publish</option>
                          <option value="HIDDEN">Hide Banner</option>
                        </select>
                      </div>
                      <div className="flex items-end pb-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded text-amber-500 focus:ring-amber-400" />
                          <span className="text-xs font-semibold text-gray-700">Banner Active</span>
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Start Date</label>
                        <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">End Date</label>
                        <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                      </div>
                    </div>
                  </div>

                  {/* Device Targeting */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">7. Device Targeting</h3>
                    <div className="flex gap-3">
                      {[
                        { key: 'DESKTOP', label: 'Desktop / Laptop', icon: FiMonitor },
                        { key: 'TABLET', label: 'Tablet', icon: FiTablet },
                        { key: 'MOBILE', label: 'Mobile', icon: FiSmartphone },
                      ].map(item => {
                        const Icon = item.icon;
                        const isChecked = form.devices.includes(item.key);
                        return (
                          <label key={item.key} className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition ${isChecked ? 'border-amber-400 bg-amber-50/50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                            <input type="checkbox" checked={isChecked} onChange={() => {
                              setForm(prev => ({
                                ...prev,
                                devices: isChecked ? prev.devices.filter(d => d !== item.key) : [...prev.devices, item.key]
                              }));
                            }} className="hidden" />
                            <Icon size={18} className={isChecked ? 'text-amber-600' : 'text-gray-400'} />
                            <span className={`text-[10px] font-bold ${isChecked ? 'text-amber-700' : 'text-gray-500'}`}>{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* SEO */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">8. SEO & Accessibility</h3>
                    <input type="text" value={form.altText} onChange={e => setForm({ ...form, altText: e.target.value })} placeholder="Image Alt Text (e.g. Kanchipuram Silk Saree Banner)" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                    <input type="text" value={form.seoTitle} onChange={e => setForm({ ...form, seoTitle: e.target.value })} placeholder="SEO Image Title" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                    <textarea value={form.seoDescription} onChange={e => setForm({ ...form, seoDescription: e.target.value })} placeholder="Meta Description" rows={2} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition resize-none" />
                  </div>

                  {/* Responsive Live Preview Switcher */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Real-Time Responsive Preview</h3>
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

                    <div className="bg-slate-900 rounded-2xl p-4 flex justify-center">
                      <div
                        className={`transition-all duration-300 rounded-2xl overflow-hidden relative border border-white/10 ${
                          previewDevice === 'MOBILE' ? 'w-[280px] h-[340px]' : previewDevice === 'TABLET' ? 'w-[440px] h-[220px]' : 'w-full h-[220px]'
                        }`}
                      >
                        {(imagePreview || form.imageUrl) ? (
                          <>
                            <img src={imagePreview || form.imageUrl} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${form.overlayOpacity})` }} />
                            <div className={`absolute inset-0 flex flex-col justify-center p-6 ${form.textAlignment === 'CENTER' ? 'items-center text-center' : form.textAlignment === 'RIGHT' ? 'items-end text-right' : 'items-start text-left'}`}>
                              {form.title && <h3 className="text-base font-bold drop-shadow-lg" style={{ color: form.textColor }}>{form.title}</h3>}
                              {form.subtitle && <p className="text-[11px] mt-0.5 drop-shadow opacity-90" style={{ color: form.textColor }}>{form.subtitle}</p>}
                              {form.ctaEnabled && form.buttonText && (
                                <span className="mt-3 px-4 py-1.5 rounded-full text-[11px] font-extrabold shadow-md cursor-pointer" style={{ backgroundColor: form.buttonColor, color: '#000' }}>
                                  {form.buttonText}
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                            <p className="text-xs text-slate-400">Upload an image to see live responsive preview</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="sticky bottom-0 z-10 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
                  <button type="button" onClick={() => { setForm(prev => ({ ...prev, status: 'DRAFT' })); }} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition cursor-pointer">
                    Save Draft
                  </button>
                  <button type="button" onClick={() => setDrawerOpen(false)} className="px-4 py-3 rounded-xl border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50 transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black text-xs font-extrabold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer">
                    {saving ? 'Publishing...' : editingBanner ? 'Update Banner' : 'Publish Banner'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*   IMAGE CROOPER MODAL                                   */}
      {/* ═══════════════════════════════════════════════════════ */}
      <GlobalImageEditor
        isOpen={cropperOpen}
        onClose={() => setCropperOpen(false)}
        onComplete={handleCropComplete}
        imageSrc={cropperSrc}
        uploadOnApply={true}
        aspectRatio={16/9}
        aspectPresets={[
          { label: '16:9', value: 16/9 },
          { label: '3:1', value: 3 },
          { label: '4:3', value: 4/3 },
          { label: '1:1', value: 1 },
          { label: 'Free', value: null },
        ]}
        title="Edit Banner Image"
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
                  <h3 className="font-bold text-gray-900 text-base">Delete Banner</h3>
                  <p className="text-xs text-gray-500">This action cannot be undone</p>
                </div>
              </div>

              {deleteTarget.imageUrl && (
                <img src={deleteTarget.imageUrl} alt="" className="w-full h-28 object-cover rounded-2xl mb-3 border border-gray-200" />
              )}

              <p className="text-xs text-gray-700 mb-5 bg-red-50 border border-red-100 rounded-xl p-3">
                Are you sure you want to permanently delete this banner?
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

export default AdminBanner;
