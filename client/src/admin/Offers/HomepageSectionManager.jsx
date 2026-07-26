import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiEdit2, FiTrash2, FiCopy, FiEye, FiEyeOff,
  FiSearch, FiFilter, FiCalendar, FiSmartphone, FiMonitor, FiGrid,
  FiList, FiUpload, FiArrowUp, FiArrowDown, FiLayers, FiImage,
  FiX, FiCheck, FiPackage, FiAlertTriangle, FiChevronDown, FiChevronUp,
  FiMove, FiRefreshCw, FiZap, FiStar, FiTag, FiSliders
} from 'react-icons/fi';
import api from '../../config/api';
import BannerCropperModal from '../Banner/BannerCropperModal';
import { toast } from 'react-toastify';

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const LAYOUT_TYPES = [
  { id: 'GRID', name: 'Product Grid', icon: FiGrid, desc: 'Classic multi-column grid' },
  { id: 'SLIDER', name: 'Product Slider', icon: FiList, desc: 'Horizontal sliding showcase' },
  { id: 'CAROUSEL', name: 'Premium Carousel', icon: FiLayers, desc: 'Autoplay interactive carousel' },
  { id: 'TWO_COLUMN', name: 'Two Column', icon: FiGrid, desc: 'Side-by-side featured showcase' },
  { id: 'FEATURED', name: 'Large Featured', icon: FiImage, desc: 'Hero collection banner with products' },
];

const STATUS_CONFIG = {
  PUBLISHED: { label: 'Published', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  HIDDEN:    { label: 'Hidden',    color: 'bg-gray-100 text-gray-600 border-gray-200' },
  DRAFT:     { label: 'Draft',     color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  ARCHIVED:  { label: 'Archived',  color: 'bg-red-100 text-red-700 border-red-200' },
};

const EMPTY_FORM = {
  title: '', slug: '', subtitle: '', description: '',
  bannerUrl: '', sectionIcon: '', layoutType: 'GRID',
  productIds: [], maxProducts: 12, status: 'PUBLISHED',
  isActive: true, productsPerRow: 4, bgColor: '#FFFFFF',
  textColor: '#111827', buttonText: 'Explore Collection',
  buttonLink: '', startDate: '', endDate: '',
  devices: ['DESKTOP', 'TABLET', 'MOBILE'], sortOrder: 0,
};

/* ─────────────────────────────────────────────
   CONFIRM DIALOG
───────────────────────────────────────────── */
const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white rounded-2xl shadow-2xl p-7 max-w-sm w-full mx-4"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-red-100 rounded-full shrink-0">
          <FiAlertTriangle className="text-red-500 w-5 h-5" />
        </div>
        <p className="text-gray-700 text-sm leading-relaxed pt-1">{message}</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium transition">
          Cancel
        </button>
        <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 text-sm font-semibold transition">
          Yes, Delete
        </button>
      </div>
    </motion.div>
  </div>
);

/* ─────────────────────────────────────────────
   SECTION CARD
───────────────────────────────────────────── */
const SectionCard = ({ sec, index, total, onEdit, onDuplicate, onDelete, onToggle, onMoveUp, onMoveDown, onExpandProducts, expanded }) => {
  const st = STATUS_CONFIG[sec.status] || STATUS_CONFIG.HIDDEN;
  const productCount = sec.products?.length || 0;

  return (
    <motion.div layout className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Drag handle / order */}
          <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
            <button onClick={onMoveUp} disabled={index === 0}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition text-gray-400">
              <FiArrowUp className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-bold text-gray-400 w-5 text-center">{index + 1}</span>
            <button onClick={onMoveDown} disabled={index === total - 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition text-gray-400">
              <FiArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {sec.sectionIcon && <span className="text-lg">{sec.sectionIcon}</span>}
              <h3 className="text-base font-semibold text-gray-900 truncate">{sec.title}</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
              {sec.isActive && sec.status === 'PUBLISHED' && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">Live</span>
              )}
            </div>
            {sec.subtitle && <p className="text-sm text-gray-500 truncate mb-2">{sec.subtitle}</p>}

            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><FiPackage className="w-3.5 h-3.5" />{productCount} product{productCount !== 1 ? 's' : ''}</span>
              <span className="flex items-center gap-1"><FiGrid className="w-3.5 h-3.5" />{sec.layoutType}</span>
              <span>{sec.productsPerRow || 4} per row</span>
              {sec.maxProducts && <span>Max: {sec.maxProducts}</span>}
            </div>
          </div>

          {/* Color preview */}
          <div className="shrink-0 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: sec.bgColor || '#fff' }} title="BG color" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={onExpandProducts}
              className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-500 hover:text-indigo-700 transition"
              title="View / manage products">
              {expanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
            </button>
            <button onClick={onToggle}
              className={`p-2 rounded-lg transition ${sec.status === 'PUBLISHED' ? 'hover:bg-yellow-50 text-yellow-600' : 'hover:bg-emerald-50 text-emerald-600'}`}
              title={sec.status === 'PUBLISHED' ? 'Hide section' : 'Publish section'}>
              {sec.status === 'PUBLISHED' ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
            </button>
            <button onClick={onEdit} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition" title="Edit section">
              <FiEdit2 className="w-4 h-4" />
            </button>
            <button onClick={onDuplicate} className="p-2 rounded-lg hover:bg-purple-50 text-purple-500 transition" title="Duplicate section">
              <FiCopy className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition" title="Delete section">
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded product quick-view */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 px-5 py-4">
              <InlineSectionProducts sectionId={sec.id} initialProducts={sec.products || []} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────
   INLINE PRODUCT QUICK-MANAGER
   (within the expanded card — add/remove single products)
───────────────────────────────────────────── */
const InlineSectionProducts = ({ sectionId, initialProducts }) => {
  const [products, setProducts] = useState(initialProducts);
  const [addMode, setAddMode] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const searchProducts = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get(`/products?search=${encodeURIComponent(q)}&limit=10`);
      const prods = res.data?.data?.products || res.data?.data || [];
      // Exclude already-selected products
      const existingIds = new Set(products.map(p => p.id));
      setSearchResults(prods.filter(p => !existingIds.has(p.id)));
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }, [products]);

  useEffect(() => {
    const t = setTimeout(() => searchProducts(query), 400);
    return () => clearTimeout(t);
  }, [query, searchProducts]);

  const addProduct = async (product) => {
    try {
      await api.post(`/cms/homepage/sections/${sectionId}/products/${product.id}`);
      setProducts(prev => [...prev, product]);
      setQuery('');
      setSearchResults([]);
      toast.success(`"${product.name}" added to section`);
    } catch {
      toast.error('Failed to add product');
    }
  };

  const removeProduct = async (productId) => {
    try {
      await api.delete(`/cms/homepage/sections/${sectionId}/products/${productId}`);
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Product removed from section (still in database)');
    } catch {
      toast.error('Failed to remove product');
    }
  };

  const moveProduct = async (index, dir) => {
    const next = [...products];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setProducts(next);
    try {
      await api.put(`/cms/homepage/sections/${sectionId}/products/reorder`, {
        productIds: next.map(p => p.id)
      });
    } catch { toast.error('Failed to save order'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700">{products.length} Product{products.length !== 1 ? 's' : ''} in this section</span>
        <button
          onClick={() => setAddMode(a => !a)}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
        >
          <FiPlus className="w-3.5 h-3.5" />
          {addMode ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {/* Quick search add */}
      <AnimatePresence>
        {addMode && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search product name or SKU…"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                autoFocus
              />
              {searching && <FiRefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {searchResults.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 cursor-pointer transition group" onClick={() => addProduct(p)}>
                    {p.images?.[0]?.url && <img src={p.images[0].url} alt="" className="w-9 h-9 rounded-lg object-cover" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">₹{p.discountPrice || p.price}</p>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition">Add</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product list */}
      {products.length === 0 ? (
        <div className="text-center py-6 text-sm text-gray-400">
          <FiPackage className="w-8 h-8 mx-auto mb-2 opacity-40" />
          No products assigned. Click "Add Product" to get started.
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {products.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl group">
              {/* Reorder */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button onClick={() => moveProduct(i, -1)} disabled={i === 0}
                  className="p-0.5 rounded hover:bg-white disabled:opacity-30 transition text-gray-400">
                  <FiArrowUp className="w-3 h-3" />
                </button>
                <button onClick={() => moveProduct(i, 1)} disabled={i === products.length - 1}
                  className="p-0.5 rounded hover:bg-white disabled:opacity-30 transition text-gray-400">
                  <FiArrowDown className="w-3 h-3" />
                </button>
              </div>
              <span className="text-xs font-bold text-gray-300 w-4 shrink-0">{i + 1}</span>
              {p.images?.[0]?.url && <img src={p.images[0].url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                <p className="text-xs text-gray-400">₹{p.discountPrice || p.price} · {p.category?.name || 'No category'}</p>
              </div>
              <button
                onClick={() => removeProduct(p.id)}
                className="p-1.5 rounded-lg bg-white border border-red-100 text-red-400 hover:text-red-600 hover:border-red-300 opacity-0 group-hover:opacity-100 transition shrink-0"
                title="Remove from section (keeps product in database)"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const HomepageSectionManager = () => {
  const [sections, setSections] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('INFO');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null });

  // Section expand state
  const [expandedSectionId, setExpandedSectionId] = useState(null);

  // Image Cropper
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState(null);

  // Product picker state inside modal
  const [prodSearch, setProdSearch] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodSubcategory, setProdSubcategory] = useState('');

  /* ── Data Fetching ── */
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [secRes, prodRes, catRes] = await Promise.allSettled([
        api.get('/cms/homepage/admin/all'),
        api.get('/products?limit=500&status=PUBLISHED'),
        api.get('/categories'),
      ]);
      if (secRes.status === 'fulfilled' && secRes.value.data?.success) {
        setSections(secRes.value.data.data || []);
      }
      if (prodRes.status === 'fulfilled') {
        const d = prodRes.value.data?.data;
        setAllProducts(Array.isArray(d) ? d : d?.products || []);
      }
      if (catRes.status === 'fulfilled' && catRes.value.data?.data) {
        setCategories(catRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load homepage sections:', err);
      toast.error('Failed to load sections');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  // Load subcategories when category filter changes
  useEffect(() => {
    if (!prodCategory) { setSubcategories([]); setProdSubcategory(''); return; }
    api.get(`/subcategories?category=${prodCategory}`).then(r => {
      setSubcategories(r.data?.data || []);
    }).catch(() => setSubcategories([]));
  }, [prodCategory]);

  /* ── Modal Helpers ── */
  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ ...EMPTY_FORM, sortOrder: sections.length });
    setActiveTab('INFO');
    setProdSearch(''); setProdCategory(''); setProdSubcategory('');
    setIsModalOpen(true);
  };

  const openEditModal = (sec) => {
    setEditingId(sec.id);
    let pIds = [];
    try { pIds = typeof sec.productIds === 'string' ? JSON.parse(sec.productIds) : sec.productIds || []; } catch { pIds = []; }
    let devs = ['DESKTOP', 'TABLET', 'MOBILE'];
    try { devs = typeof sec.devices === 'string' ? JSON.parse(sec.devices) : sec.devices || devs; } catch {}

    setFormData({
      title: sec.title || '',
      slug: sec.slug || '',
      subtitle: sec.subtitle || '',
      description: sec.description || '',
      bannerUrl: sec.bannerUrl || '',
      sectionIcon: sec.sectionIcon || '',
      layoutType: sec.layoutType || 'GRID',
      productIds: pIds,
      maxProducts: sec.maxProducts || 12,
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
    setProdSearch(''); setProdCategory(''); setProdSubcategory('');
    setIsModalOpen(true);
  };

  /* ── Form Helpers ── */
  const setField = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const toggleProductSelection = (productId) => {
    setFormData(prev => {
      const exists = prev.productIds.includes(productId);
      return { ...prev, productIds: exists ? prev.productIds.filter(id => id !== productId) : [...prev.productIds, productId] };
    });
  };

  const moveProductOrder = (index, dir) => {
    setFormData(prev => {
      const next = [...prev.productIds];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, productIds: next };
    });
  };

  const removeSelectedProduct = (productId) => {
    setFormData(prev => ({ ...prev, productIds: prev.productIds.filter(id => id !== productId) }));
  };

  /* ── Banner Cropper ── */
  const handleBannerSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => { setRawImageSrc(reader.result); setCropperOpen(true); };
      reader.readAsDataURL(file);
    }
  };
  const handleCroppedImageSave = (croppedDataUrl) => {
    setField('bannerUrl', croppedDataUrl);
    setCropperOpen(false);
  };

  /* ── CRUD Operations ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) { toast.error('Section title is required'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/cms/homepage/sections/${editingId}`, formData);
        toast.success('Section updated successfully!');
      } else {
        await api.post('/cms/homepage/sections', formData);
        toast.success('New section created!');
      }
      setIsModalOpen(false);
      fetchInitialData();
    } catch (err) {
      console.error('Failed to save homepage section:', err);
      toast.error(err?.response?.data?.message || 'Failed to save section');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (sec) => {
    const nextStatus = sec.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED';
    try {
      await api.put(`/cms/homepage/sections/${sec.id}`, { status: nextStatus, isActive: nextStatus === 'PUBLISHED' });
      setSections(prev => prev.map(s => s.id === sec.id ? { ...s, status: nextStatus, isActive: nextStatus === 'PUBLISHED' } : s));
      toast.success(`Section ${nextStatus === 'PUBLISHED' ? 'published' : 'hidden'}`);
    } catch { toast.error('Failed to toggle status'); }
  };

  const handleDuplicate = async (sec) => {
    try {
      await api.post(`/cms/homepage/sections/${sec.id}/duplicate`);
      toast.success('Section duplicated');
      fetchInitialData();
    } catch { toast.error('Failed to duplicate section'); }
  };

  const handleDelete = (sec) => {
    setConfirmDialog({
      open: true,
      message: `Are you sure you want to delete "${sec.title}"? All products in this section will be unlinked, but NOT deleted from your database.`,
      onConfirm: async () => {
        try {
          await api.delete(`/cms/homepage/sections/${sec.id}`);
          toast.success('Section deleted. All products remain safe in the database.');
          setConfirmDialog({ open: false });
          fetchInitialData();
        } catch { toast.error('Failed to delete section'); setConfirmDialog({ open: false }); }
      }
    });
  };

  /* ── Reorder sections ── */
  const moveSectionOrder = async (index, dir) => {
    const next = [...sections];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    const withOrder = next.map((s, i) => ({ ...s, sortOrder: i }));
    setSections(withOrder);
    try {
      await api.put('/cms/homepage/sections/reorder', {
        items: withOrder.map(s => ({ id: s.id, sortOrder: s.sortOrder }))
      });
      toast.success('Section order saved');
    } catch { toast.error('Failed to save order'); fetchInitialData(); }
  };

  /* ── Product picker filter ── */
  const filteredProducts = allProducts.filter(p => {
    const q = prodSearch.toLowerCase();
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
    const matchCat = !prodCategory || p.categoryId === prodCategory || p.category?.id === prodCategory;
    const matchSub = !prodSubcategory || p.subcategoryId === prodSubcategory;
    return matchSearch && matchCat && matchSub;
  });

  /* ── Resolved selected products for the order strip ── */
  const selectedProducts = formData.productIds
    .map(id => allProducts.find(p => p.id === id))
    .filter(Boolean);

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiLayers className="text-indigo-500" /> Homepage Sections
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create, edit, reorder and publish homepage product sections. All changes reflect instantly on the website.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchInitialData} className="p-2.5 rounded-xl border border-gray-200 hover:bg-white text-gray-500 hover:text-gray-700 transition" title="Refresh">
            <FiRefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openCreateModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition">
            <FiPlus className="w-4 h-4" /> Add New Section
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Sections', value: sections.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Published', value: sections.filter(s => s.status === 'PUBLISHED').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Hidden', value: sections.filter(s => s.status === 'HIDDEN').length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Total Products', value: sections.reduce((acc, s) => acc + (s.products?.length || 0), 0), color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4`}>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Section List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
          <FiRefreshCw className="animate-spin w-5 h-5" /> Loading sections…
        </div>
      ) : sections.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <FiLayers className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Homepage Sections Yet</h3>
          <p className="text-gray-400 text-sm mb-6">Create your first section to start curating homepage products.</p>
          <button onClick={openCreateModal} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition">
            <FiPlus className="inline-block mr-2" />Create First Section
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((sec, index) => (
            <SectionCard
              key={sec.id}
              sec={sec}
              index={index}
              total={sections.length}
              onEdit={() => openEditModal(sec)}
              onDuplicate={() => handleDuplicate(sec)}
              onDelete={() => handleDelete(sec)}
              onToggle={() => handleToggleStatus(sec)}
              onMoveUp={() => moveSectionOrder(index, -1)}
              onMoveDown={() => moveSectionOrder(index, 1)}
              onExpandProducts={() => setExpandedSectionId(expandedSectionId === sec.id ? null : sec.id)}
              expanded={expandedSectionId === sec.id}
            />
          ))}
        </div>
      )}

      {/* ─── CREATE / EDIT MODAL ─── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-12 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingId ? 'Edit Homepage Section' : 'Create New Section'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">Configure the section and select which products appear.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-0.5 px-7 pt-4 border-b border-gray-100">
                {['INFO', 'LAYOUT', 'BANNER', 'PRODUCTS', 'SCHEDULE'].map(tab => (
                  <button key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition ${activeTab === tab
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tab === 'INFO' ? 'Basic Info' : tab === 'LAYOUT' ? 'Layout & Style' : tab === 'BANNER' ? 'Banner' : tab === 'PRODUCTS' ? `Products (${formData.productIds.length})` : 'Schedule'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="px-7 py-6 max-h-[60vh] overflow-y-auto">

                  {/* ── TAB: INFO ── */}
                  {activeTab === 'INFO' && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Section Title *</label>
                          <input value={formData.title} onChange={e => setField('title', e.target.value)}
                            placeholder="e.g. Kids Wear, Festive Collection…"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Section Icon (Emoji)</label>
                          <input value={formData.sectionIcon} onChange={e => setField('sectionIcon', e.target.value)}
                            placeholder="🎁 🛍️ 👗 👶 🏮"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subtitle (Optional)</label>
                        <input value={formData.subtitle} onChange={e => setField('subtitle', e.target.value)}
                          placeholder="Short description shown below the title"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                          <select value={formData.status} onChange={e => { setField('status', e.target.value); setField('isActive', e.target.value === 'PUBLISHED'); }}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                            <option value="PUBLISHED">Published (Visible)</option>
                            <option value="HIDDEN">Hidden</option>
                            <option value="DRAFT">Draft</option>
                            <option value="ARCHIVED">Archived</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Max Products to Show</label>
                          <input type="number" min={1} max={50} value={formData.maxProducts}
                            onChange={e => setField('maxProducts', parseInt(e.target.value))}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Display Order</label>
                          <input type="number" min={0} value={formData.sortOrder}
                            onChange={e => setField('sortOrder', parseInt(e.target.value))}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Button Text</label>
                          <input value={formData.buttonText} onChange={e => setField('buttonText', e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Button Link (URL)</label>
                          <input value={formData.buttonLink} onChange={e => setField('buttonLink', e.target.value)}
                            placeholder="/categories/kids-wear"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── TAB: LAYOUT ── */}
                  {activeTab === 'LAYOUT' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Layout Type</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {LAYOUT_TYPES.map(lt => (
                            <button type="button" key={lt.id} onClick={() => setField('layoutType', lt.id)}
                              className={`p-4 rounded-xl border-2 text-left transition ${formData.layoutType === lt.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                              <lt.icon className={`w-5 h-5 mb-2 ${formData.layoutType === lt.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                              <p className={`text-sm font-semibold ${formData.layoutType === lt.id ? 'text-indigo-700' : 'text-gray-700'}`}>{lt.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{lt.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Products Per Row</label>
                          <select value={formData.productsPerRow} onChange={e => setField('productsPerRow', parseInt(e.target.value))}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                            {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} per row</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Background Color</label>
                          <div className="flex gap-2">
                            <input type="color" value={formData.bgColor} onChange={e => setField('bgColor', e.target.value)}
                              className="h-10 w-12 border border-gray-200 rounded-xl cursor-pointer" />
                            <input type="text" value={formData.bgColor} onChange={e => setField('bgColor', e.target.value)}
                              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Text Color</label>
                          <div className="flex gap-2">
                            <input type="color" value={formData.textColor} onChange={e => setField('textColor', e.target.value)}
                              className="h-10 w-12 border border-gray-200 rounded-xl cursor-pointer" />
                            <input type="text" value={formData.textColor} onChange={e => setField('textColor', e.target.value)}
                              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl p-5 text-center" style={{ backgroundColor: formData.bgColor, color: formData.textColor, border: '1px solid #e5e7eb' }}>
                        <p className="text-sm font-semibold">Preview</p>
                        <p className="text-xs opacity-70 mt-0.5">{formData.title || 'Section Title'}</p>
                      </div>
                    </div>
                  )}

                  {/* ── TAB: BANNER ── */}
                  {activeTab === 'BANNER' && (
                    <div className="space-y-5">
                      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-indigo-300 transition cursor-pointer relative"
                        onClick={() => document.getElementById('banner-input').click()}>
                        <input type="file" id="banner-input" accept="image/*" onChange={handleBannerSelect} className="hidden" />
                        {formData.bannerUrl ? (
                          <div>
                            <img src={formData.bannerUrl} alt="Banner" className="w-full h-36 object-cover rounded-xl mb-3" />
                            <span className="text-sm text-indigo-600 font-medium">Click to change banner</span>
                          </div>
                        ) : (
                          <div>
                            <FiUpload className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                            <p className="text-sm font-medium text-gray-600">Upload Section Banner</p>
                            <p className="text-xs text-gray-400 mt-1">Recommended: 1200×300px. Will be shown above products in this section.</p>
                          </div>
                        )}
                      </div>
                      {formData.bannerUrl && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Or paste image URL</label>
                          <input value={formData.bannerUrl} onChange={e => setField('bannerUrl', e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── TAB: PRODUCTS ── */}
                  {activeTab === 'PRODUCTS' && (
                    <div>
                      {/* Selected products order strip */}
                      {selectedProducts.length > 0 && (
                        <div className="mb-5">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-gray-700">Selected Products — Display Order</h4>
                            <span className="text-xs text-gray-400">{selectedProducts.length} selected</span>
                          </div>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {selectedProducts.map((p, i) => (
                              <div key={p.id} className="flex items-center gap-3 p-2.5 bg-indigo-50 rounded-xl">
                                <div className="flex flex-col gap-0.5 shrink-0">
                                  <button type="button" onClick={() => moveProductOrder(i, -1)} disabled={i === 0}
                                    className="p-0.5 rounded hover:bg-indigo-100 disabled:opacity-30 transition">
                                    <FiArrowUp className="w-3 h-3 text-indigo-500" />
                                  </button>
                                  <button type="button" onClick={() => moveProductOrder(i, 1)} disabled={i === selectedProducts.length - 1}
                                    className="p-0.5 rounded hover:bg-indigo-100 disabled:opacity-30 transition">
                                    <FiArrowDown className="w-3 h-3 text-indigo-500" />
                                  </button>
                                </div>
                                <span className="text-xs font-bold text-indigo-300 w-4 shrink-0">{i + 1}</span>
                                {p.images?.[0]?.url && <img src={p.images[0].url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                                </div>
                                <button type="button" onClick={() => removeSelectedProduct(p.id)}
                                  className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition shrink-0">
                                  <FiX className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Filters */}
                      <div className="flex gap-3 mb-4 flex-wrap">
                        <div className="relative flex-1 min-w-[180px]">
                          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input type="text" value={prodSearch} onChange={e => setProdSearch(e.target.value)}
                            placeholder="Search by name or SKU…"
                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                        </div>
                        <select value={prodCategory} onChange={e => { setProdCategory(e.target.value); setProdSubcategory(''); }}
                          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 min-w-[140px]">
                          <option value="">All Categories</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {subcategories.length > 0 && (
                          <select value={prodSubcategory} onChange={e => setProdSubcategory(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 min-w-[140px]">
                            <option value="">All Subcategories</option>
                            {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        )}
                        {(prodSearch || prodCategory || prodSubcategory) && (
                          <button type="button" onClick={() => { setProdSearch(''); setProdCategory(''); setProdSubcategory(''); }}
                            className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition">
                            <FiX className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Product Grid */}
                      <div className="text-xs text-gray-400 mb-2">{filteredProducts.length} products · Click to select/deselect</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
                        {filteredProducts.map(p => {
                          const isSelected = formData.productIds.includes(p.id);
                          return (
                            <button type="button" key={p.id} onClick={() => toggleProductSelection(p.id)}
                              className={`relative rounded-xl border-2 overflow-hidden text-left transition group ${isSelected ? 'border-indigo-500 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center z-10">
                                  <FiCheck className="text-white w-3 h-3" />
                                </div>
                              )}
                              <div className="aspect-square bg-gray-100 overflow-hidden">
                                {p.images?.[0]?.url
                                  ? <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                  : <div className="w-full h-full flex items-center justify-center"><FiPackage className="text-gray-300 w-8 h-8" /></div>
                                }
                              </div>
                              <div className="p-2">
                                <p className="text-xs font-medium text-gray-800 truncate leading-tight">{p.name}</p>
                                <p className="text-xs text-indigo-600 font-semibold mt-0.5">₹{p.discountPrice || p.price}</p>
                              </div>
                            </button>
                          );
                        })}
                        {filteredProducts.length === 0 && (
                          <div className="col-span-4 text-center py-10 text-gray-400 text-sm">
                            <FiSearch className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            No products found matching your filters.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── TAB: SCHEDULE ── */}
                  {activeTab === 'SCHEDULE' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                            <FiCalendar className="w-4 h-4" /> Publish From (Optional)
                          </label>
                          <input type="datetime-local" value={formData.startDate} onChange={e => setField('startDate', e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                            <FiCalendar className="w-4 h-4" /> Unpublish At (Optional)
                          </label>
                          <input type="datetime-local" value={formData.endDate} onChange={e => setField('endDate', e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Show On Devices</label>
                        <div className="flex gap-4 flex-wrap">
                          {['DESKTOP', 'TABLET', 'MOBILE'].map(d => (
                            <label key={d} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition ${formData.devices.includes(d) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                              <input type="checkbox" checked={formData.devices.includes(d)}
                                onChange={() => {
                                  const next = formData.devices.includes(d)
                                    ? formData.devices.filter(x => x !== d)
                                    : [...formData.devices, d];
                                  setField('devices', next);
                                }}
                                className="w-4 h-4 text-indigo-600 rounded" />
                              <span className="text-sm font-medium text-gray-700">{d.charAt(0) + d.slice(1).toLowerCase()}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between px-7 py-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                  <div className="text-sm text-gray-400">
                    {formData.productIds.length} product{formData.productIds.length !== 1 ? 's' : ''} selected
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 text-sm font-medium transition">
                      Cancel
                    </button>
                    {activeTab !== 'PRODUCTS' && activeTab !== 'SCHEDULE' && (
                      <button type="button"
                        onClick={() => setActiveTab(activeTab === 'INFO' ? 'LAYOUT' : activeTab === 'LAYOUT' ? 'BANNER' : 'PRODUCTS')}
                        className="px-5 py-2.5 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-sm font-medium transition">
                        Next →
                      </button>
                    )}
                    <button type="submit" disabled={saving}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold transition flex items-center gap-2">
                      {saving ? <><FiRefreshCw className="animate-spin w-4 h-4" /> Saving…</> : <><FiCheck className="w-4 h-4" /> {editingId ? 'Update Section' : 'Create Section'}</>}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmDialog.open && (
          <ConfirmDialog
            message={confirmDialog.message}
            onConfirm={confirmDialog.onConfirm}
            onCancel={() => setConfirmDialog({ open: false })}
          />
        )}
      </AnimatePresence>

      {/* Banner Cropper */}
      {cropperOpen && rawImageSrc && (
        <BannerCropperModal
          imageSrc={rawImageSrc}
          onSave={handleCroppedImageSave}
          onClose={() => setCropperOpen(false)}
          aspectRatio={4 / 1}
        />
      )}
    </div>
  );
};

export default HomepageSectionManager;
