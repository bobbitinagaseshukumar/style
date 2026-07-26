import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/common/Button';
import api from '../../config/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import {
  FiPlus, FiTrash2, FiTag, FiEdit, FiSearch, FiX, FiCopy, FiCheck,
  FiFilter, FiEye, FiEyeOff, FiCalendar, FiPercent, FiDollarSign,
  FiUsers, FiShoppingBag, FiTrendingUp, FiRefreshCw, FiHome,
  FiAlertTriangle, FiArchive, FiSlash, FiZap, FiGift, FiClock,
  FiChevronDown, FiChevronUp, FiBarChart2, FiStar
} from 'react-icons/fi';
import { toast } from 'react-toastify';

/* ─── Helpers ──────────────────────────────────────────────── */
const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
};

const getStatusColor = (status) => {
  const map = {
    PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    DRAFT: 'bg-gray-100 text-gray-600 border-gray-200',
    HIDDEN: 'bg-purple-50 text-purple-700 border-purple-200',
    SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
    EXPIRED: 'bg-rose-50 text-rose-600 border-rose-200',
    DISABLED: 'bg-orange-50 text-orange-700 border-orange-200',
    ARCHIVED: 'bg-slate-50 text-slate-600 border-slate-200',
  };
  return map[status] || map.DRAFT;
};

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

/* ─── Default Drawer Form State ────────────────────────────── */
const defaultForm = {
  name: '',
  code: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountPercent: '',
  discountAmount: '',
  minOrderAmount: '0',
  maxDiscount: '',
  startDate: new Date().toISOString().split('T')[0],
  expiresAt: '',
  status: 'PUBLISHED',
  isActive: true,
  totalUsageLimit: '',
  perCustomerLimit: '1',
  customerEligibility: 'ALL',
  showOnHomepage: false,
  showOnOffers: true,
  showOnCheckout: true,
  showAsPopup: false,
  showOnBanner: false,
  colorTheme: '#D4AF37',
  priority: '0',
  termsConditions: '',
};

/* ═══════════════════════════════════════════════════════════ */
/*   ADMIN COUPONS PAGE                                        */
/* ═══════════════════════════════════════════════════════════ */
const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Drawer & Modal
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [saving, setSaving] = useState(false);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteMode, setDeleteMode] = useState('DELETE');
  const [deleting, setDeleting] = useState(false);

  // Expanded analytics card
  const [expandedId, setExpandedId] = useState(null);

  /* ─── DATA FETCH ────────────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [couponsRes, statsRes] = await Promise.all([
        api.get('/coupons/admin/all'),
        api.get('/coupons/admin/stats'),
      ]);
      setCoupons(couponsRes.data?.data || []);
      setStats(statsRes.data?.data || null);
    } catch (err) {
      console.log('Coupon fetch error:', err.message);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ─── DRAWER CONTROLS ──────────────────────────────────── */
  const openCreate = () => {
    setEditingCoupon(null);
    setForm({ ...defaultForm, code: generateCode() });
    setDrawerOpen(true);
  };

  const openEdit = (coupon) => {
    setEditingCoupon(coupon);
    setForm({
      name: coupon.name || '',
      code: coupon.code || '',
      description: coupon.description || '',
      discountType: coupon.discountType || 'PERCENTAGE',
      discountPercent: coupon.discountPercent?.toString() || '',
      discountAmount: coupon.discountAmount?.toString() || '',
      minOrderAmount: coupon.minOrderAmount?.toString() || '0',
      maxDiscount: coupon.maxDiscount?.toString() || '',
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '',
      status: coupon.status || 'PUBLISHED',
      isActive: coupon.isActive !== false,
      totalUsageLimit: coupon.totalUsageLimit?.toString() || '',
      perCustomerLimit: coupon.perCustomerLimit?.toString() || '1',
      customerEligibility: coupon.customerEligibility || 'ALL',
      showOnHomepage: coupon.showOnHomepage || false,
      showOnOffers: coupon.showOnOffers !== false,
      showOnCheckout: coupon.showOnCheckout !== false,
      showAsPopup: coupon.showAsPopup || false,
      showOnBanner: coupon.showOnBanner || false,
      colorTheme: coupon.colorTheme || '#D4AF37',
      priority: coupon.priority?.toString() || '0',
      termsConditions: coupon.termsConditions || '',
    });
    setDrawerOpen(true);
  };

  /* ─── SAVE COUPON ───────────────────────────────────────── */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) { toast.error('Coupon code is required'); return; }
    if (!form.expiresAt) { toast.error('Expiry date is required'); return; }
    if (form.discountType === 'PERCENTAGE' && !form.discountPercent) { toast.error('Discount percentage is required'); return; }
    if (form.discountType === 'FIXED' && !form.discountAmount) { toast.error('Discount amount is required'); return; }

    try {
      setSaving(true);
      const payload = {
        ...form,
        discountPercent: form.discountPercent ? parseFloat(form.discountPercent) : null,
        discountAmount: form.discountAmount ? parseFloat(form.discountAmount) : null,
        minOrderAmount: parseFloat(form.minOrderAmount || 0),
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
        totalUsageLimit: form.totalUsageLimit ? parseInt(form.totalUsageLimit) : null,
        perCustomerLimit: parseInt(form.perCustomerLimit || 1),
        priority: parseInt(form.priority || 0),
      };

      if (editingCoupon) {
        await api.put(`/coupons/admin/${editingCoupon.id}`, payload);
        toast.success(`Coupon "${form.code}" updated!`);
      } else {
        await api.post('/coupons/admin', payload);
        toast.success(`Coupon "${form.code}" created!`);
      }
      setDrawerOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  /* ─── DELETE COUPON ─────────────────────────────────────── */
  const handleDeleteSubmit = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/coupons/admin/${deleteTarget.id}?mode=${deleteMode}`);
      toast.success(`Coupon action "${deleteMode}" completed`);
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process coupon action');
    } finally {
      setDeleting(false);
    }
  };

  /* ─── COPY CODE ─────────────────────────────────────────── */
  const [copiedId, setCopiedId] = useState(null);
  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success(`Coupon "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* ─── FILTER & SEARCH ──────────────────────────────────── */
  const filtered = useMemo(() => {
    return coupons.filter(c => {
      const matchSearch = !search ||
        c.code?.toLowerCase().includes(search.toLowerCase()) ||
        c.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const matchType = typeFilter === 'ALL' || c.discountType === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [coupons, search, statusFilter, typeFilter]);

  /* ═══════════════════════════════════════════════════════════ */
  /*   RENDER                                                     */
  /* ═══════════════════════════════════════════════════════════ */
  return (
    <motion.div initial="initial" animate="animate" className="space-y-6">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupon & Discount Engine</h1>
          <p className="text-sm text-gray-500">Enterprise-level coupon management with real-time analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAll}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition cursor-pointer"
            title="Refresh"
          >
            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <Button icon={FiPlus} onClick={openCreate}>Create Coupon</Button>
        </div>
      </div>

      {/* ── Stats Dashboard Cards ──────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total Coupons', count: stats.totalCoupons, icon: FiTag, color: 'text-blue-600 bg-blue-50' },
            { label: 'Active', count: stats.activeCoupons, icon: FiZap, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Scheduled', count: stats.scheduledCoupons, icon: FiClock, color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Expired', count: stats.expiredCoupons, icon: FiCalendar, color: 'text-rose-600 bg-rose-50' },
            { label: 'Times Used', count: stats.totalCouponsUsed, icon: FiUsers, color: 'text-amber-600 bg-amber-50' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <motion.div key={item.label} variants={fadeInUp} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color}`}>
                    <Icon size={16} />
                  </div>
                </div>
                <p className="text-2xl font-black text-charcoal-900">{item.count}</p>
                <p className="text-[11px] font-semibold text-gray-500 mt-0.5">{item.label}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-gradient-to-r from-amber-50 to-amber-100/60 p-4 rounded-2xl border border-amber-200/50">
            <p className="text-xs font-bold text-amber-800">Total Discount Given</p>
            <p className="text-xl font-black text-amber-900 mt-1">{formatCurrency(stats.totalDiscountGiven || 0)}</p>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100/60 p-4 rounded-2xl border border-blue-200/50">
            <p className="text-xs font-bold text-blue-800">Today&apos;s Coupon Usage</p>
            <p className="text-xl font-black text-blue-900 mt-1">{stats.todayUsage || 0} uses</p>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100/60 p-4 rounded-2xl border border-purple-200/50">
            <p className="text-xs font-bold text-purple-800">Monthly Coupon Usage</p>
            <p className="text-xl font-black text-purple-900 mt-1">{stats.monthlyUsage || 0} uses</p>
          </div>
        </div>
      )}

      {/* ── Search & Filters ───────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by code or name..."
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><FiX size={14} /></button>}
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="ALL">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="HIDDEN">Hidden</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="EXPIRED">Expired</option>
          <option value="DISABLED">Disabled</option>
          <option value="ARCHIVED">Archived</option>
        </select>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="ALL">All Types</option>
          <option value="PERCENTAGE">Percentage (%)</option>
          <option value="FIXED">Fixed Amount (₹)</option>
        </select>

        <span className="text-xs font-bold text-gray-400 ml-auto">{filtered.length} coupons</span>
      </div>

      {/* ── Coupon Cards Grid ──────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-3xl overflow-hidden animate-pulse">
              <div className="h-24 bg-gray-100" />
              <div className="p-4 space-y-2"><div className="h-4 bg-gray-100 rounded w-3/4" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center">
          <FiGift size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="font-bold text-gray-700">No Coupons Created Yet</p>
          <p className="text-xs text-gray-400 mt-1">Click &quot;Create Coupon&quot; to build your first promotional discount code.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(coupon => {
            const isExpanded = expandedId === coupon.id;
            const isExpired = new Date(coupon.expiresAt) <= new Date();
            const analytics = coupon.analytics || {};
            return (
              <motion.div
                key={coupon.id}
                layout
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
              >
                {/* Coupon Header Banner */}
                <div
                  className="relative px-5 pt-5 pb-4"
                  style={{ background: `linear-gradient(135deg, ${coupon.colorTheme || '#D4AF37'}22, ${coupon.colorTheme || '#D4AF37'}08)` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusColor(isExpired ? 'EXPIRED' : coupon.status)}`}>
                      {isExpired ? 'EXPIRED' : coupon.status}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(coupon)} className="p-1.5 rounded-lg bg-white/80 text-blue-600 hover:bg-white shadow-sm transition cursor-pointer" title="Edit"><FiEdit size={13} /></button>
                      <button onClick={() => setDeleteTarget(coupon)} className="p-1.5 rounded-lg bg-white/80 text-red-500 hover:bg-white shadow-sm transition cursor-pointer" title="Delete Options"><FiTrash2 size={13} /></button>
                    </div>
                  </div>

                  {/* CODE with Copy */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono font-black text-lg text-charcoal-900 tracking-wider">{coupon.code}</span>
                    <button
                      onClick={() => handleCopy(coupon.code, coupon.id)}
                      className="p-1 rounded-md bg-white/70 hover:bg-white text-gray-500 transition cursor-pointer"
                      title="Copy Code"
                    >
                      {copiedId === coupon.id ? <FiCheck size={12} className="text-emerald-600" /> : <FiCopy size={12} />}
                    </button>
                  </div>

                  {/* Discount Display */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black" style={{ color: coupon.colorTheme || '#D4AF37' }}>
                      {coupon.discountType === 'PERCENTAGE'
                        ? `${coupon.discountPercent || 0}%`
                        : formatCurrency(coupon.discountAmount || 0)
                      }
                    </span>
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      {coupon.discountType === 'PERCENTAGE' ? 'OFF' : 'Flat Discount'}
                    </span>
                  </div>

                  {coupon.name && <p className="text-xs font-semibold text-gray-700 mt-1">{coupon.name}</p>}
                </div>

                {/* Body */}
                <div className="px-5 py-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Min. Order</span>
                      <span className="font-bold text-charcoal-900">{formatCurrency(coupon.minOrderAmount || 0)}</span>
                    </div>
                    {coupon.maxDiscount && (
                      <div className="flex justify-between">
                        <span>Max Discount</span>
                        <span className="font-bold text-charcoal-900">{formatCurrency(coupon.maxDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Valid</span>
                      <span className="font-semibold text-gray-700">
                        {coupon.startDate ? formatDate(coupon.startDate) : 'Now'} → {formatDate(coupon.expiresAt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Usage</span>
                      <span className="font-bold text-charcoal-900">
                        {coupon.currentUsageCount || 0}{coupon.totalUsageLimit ? ` / ${coupon.totalUsageLimit}` : ' (Unlimited)'}
                      </span>
                    </div>
                  </div>

                  {/* Visibility Badges */}
                  <div className="flex flex-wrap gap-1">
                    {coupon.showOnHomepage && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">🏠 Home</span>}
                    {coupon.showOnCheckout && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">🛒 Checkout</span>}
                    {coupon.showOnOffers && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">🎁 Offers</span>}
                    {coupon.showAsPopup && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-pink-50 text-pink-700 border border-pink-200">💬 Popup</span>}
                  </div>

                  {/* Analytics Expandable */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : coupon.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 hover:bg-gray-100 transition cursor-pointer font-semibold"
                  >
                    <span className="flex items-center gap-1.5"><FiBarChart2 size={12} className="text-amber-500" /> Analytics</span>
                    {isExpanded ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-xs">
                          <div className="flex justify-between"><span className="text-gray-500">Times Used</span><span className="font-bold">{analytics.timesUsed || 0}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Revenue Generated</span><span className="font-bold">{formatCurrency(analytics.totalRevenueGenerated || 0)}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Total Discount Given</span><span className="font-bold text-rose-600">{formatCurrency(analytics.totalDiscountGiven || 0)}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Remaining Uses</span><span className="font-bold">{analytics.remainingUses !== null ? analytics.remainingUses : '∞'}</span></div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/*   CREATE/EDIT DRAWER                                    */}
      {/* ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl overflow-y-auto"
            >
              <form onSubmit={handleSave} className="flex flex-col h-full">
                {/* Drawer Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-charcoal-900">{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h2>
                    <p className="text-xs text-gray-500">Define discount, eligibility, visibility & schedule</p>
                  </div>
                  <button type="button" onClick={() => setDrawerOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition">
                    <FiX size={20} />
                  </button>
                </div>

                {/* Drawer Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                  {/* Section 1: Code & Name */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Coupon Identity</h3>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Coupon Name</label>
                      <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Summer Sale Discount" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Coupon Code *</label>
                      <div className="flex gap-2">
                        <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. SUMMER20" required className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono uppercase outline-none focus:border-amber-500 transition" />
                        <button type="button" onClick={() => setForm({ ...form, code: generateCode() })} className="px-3 py-2 rounded-xl bg-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-200 transition cursor-pointer whitespace-nowrap" title="Auto-generate code">
                          <FiRefreshCw size={14} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Short Description</label>
                      <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Get 20% off on all ethnic wear this summer" rows={2} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition resize-none" />
                    </div>
                  </div>

                  {/* Section 2: Discount */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Discount Configuration</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Discount Type</label>
                        <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs bg-white outline-none focus:border-amber-500">
                          <option value="PERCENTAGE">Percentage (%)</option>
                          <option value="FIXED">Fixed Amount (₹)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">
                          {form.discountType === 'PERCENTAGE' ? 'Discount (%)' : 'Discount (₹)'}
                        </label>
                        {form.discountType === 'PERCENTAGE' ? (
                          <input type="number" value={form.discountPercent} onChange={e => setForm({ ...form, discountPercent: e.target.value })} placeholder="e.g. 15" min="0" max="100" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                        ) : (
                          <input type="number" value={form.discountAmount} onChange={e => setForm({ ...form, discountAmount: e.target.value })} placeholder="e.g. 500" min="0" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Min. Order Amount (₹)</label>
                        <input type="number" value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: e.target.value })} placeholder="0" min="0" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Max Discount Cap (₹)</label>
                        <input type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} placeholder="No limit" min="0" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Schedule */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Schedule & Validity</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Start Date</label>
                        <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Expiry Date *</label>
                        <input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} required className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Status & Eligibility */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Publishing & Eligibility</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Status</label>
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs bg-white outline-none focus:border-amber-500">
                          <option value="DRAFT">Draft</option>
                          <option value="PUBLISHED">Published</option>
                          <option value="HIDDEN">Hidden</option>
                          <option value="SCHEDULED">Scheduled</option>
                          <option value="DISABLED">Disabled</option>
                          <option value="ARCHIVED">Archived</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Customer Eligibility</label>
                        <select value={form.customerEligibility} onChange={e => setForm({ ...form, customerEligibility: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs bg-white outline-none focus:border-amber-500">
                          <option value="ALL">All Customers</option>
                          <option value="NEW_CUSTOMERS">New Customers Only</option>
                          <option value="EXISTING">Existing Customers</option>
                          <option value="VIP">VIP Customers</option>
                          <option value="PREMIUM">Premium Members</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Usage Limits */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Usage Limits</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Total Usage Limit</label>
                        <input type="number" value={form.totalUsageLimit} onChange={e => setForm({ ...form, totalUsageLimit: e.target.value })} placeholder="Unlimited" min="0" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Per Customer Limit</label>
                        <input type="number" value={form.perCustomerLimit} onChange={e => setForm({ ...form, perCustomerLimit: e.target.value })} placeholder="1" min="1" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                      </div>
                    </div>
                  </div>

                  {/* Section 6: Visibility */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Website Visibility</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'showOnHomepage', label: '🏠 Show on Home Page', desc: 'Display on homepage banner' },
                        { key: 'showOnOffers', label: '🎁 Show on Offers Page', desc: 'Available in offers section' },
                        { key: 'showOnCheckout', label: '🛒 Show During Checkout', desc: 'Suggest at checkout' },
                        { key: 'showAsPopup', label: '💬 Show as Popup', desc: 'Pop up to visitors' },
                        { key: 'showOnBanner', label: '🏷️ Show in Banner', desc: 'Website header banner' },
                      ].map(item => (
                        <label key={item.key} className="flex items-start gap-2 p-2.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition">
                          <input
                            type="checkbox"
                            checked={form[item.key]}
                            onChange={e => setForm({ ...form, [item.key]: e.target.checked })}
                            className="mt-0.5 text-amber-500 rounded focus:ring-amber-400"
                          />
                          <div>
                            <span className="text-xs font-semibold text-gray-700 block">{item.label}</span>
                            <span className="text-[10px] text-gray-400">{item.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Section 7: Appearance */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Appearance & Priority</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Color Theme</label>
                        <input type="color" value={form.colorTheme} onChange={e => setForm({ ...form, colorTheme: e.target.value })} className="w-full h-10 rounded-xl cursor-pointer border border-gray-200" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Priority (0 = lowest)</label>
                        <input type="number" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} placeholder="0" min="0" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition" />
                      </div>
                    </div>
                  </div>

                  {/* Section 8: Terms */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Terms & Conditions</h3>
                    <textarea value={form.termsConditions} onChange={e => setForm({ ...form, termsConditions: e.target.value })} placeholder="e.g. Valid on orders above ₹2,999. Not applicable on festive special items." rows={3} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-500 transition resize-none" />
                  </div>

                  {/* Live Preview */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Preview</h3>
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                      <div className="border-2 border-dashed rounded-2xl p-5 text-center" style={{ borderColor: form.colorTheme || '#D4AF37' }}>
                        <span className="font-mono font-black text-xl tracking-wider text-charcoal-900">{form.code || 'CODE'}</span>
                        <div className="text-3xl font-black mt-1" style={{ color: form.colorTheme || '#D4AF37' }}>
                          {form.discountType === 'PERCENTAGE'
                            ? `${form.discountPercent || '0'}% OFF`
                            : `₹${form.discountAmount || '0'} OFF`
                          }
                        </div>
                        {form.name && <p className="text-xs font-semibold text-gray-600 mt-1">{form.name}</p>}
                        <p className="text-[10px] text-gray-400 mt-2">Min. order: ₹{form.minOrderAmount || '0'} • Expires: {form.expiresAt || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="sticky bottom-0 z-10 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
                  <button type="button" onClick={() => setDrawerOpen(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black text-xs font-extrabold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer">
                    {saving ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Publish Coupon'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*   DELETE OPTIONS MODAL                                  */}
      {/* ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                  <FiAlertTriangle className="text-red-600 w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Coupon Action</h3>
                  <p className="text-xs text-gray-500">Choose what to do with &quot;{deleteTarget.code}&quot;</p>
                </div>
              </div>

              <div className="space-y-2 mb-5 text-xs">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="deleteMode" checked={deleteMode === 'HIDE'} onChange={() => setDeleteMode('HIDE')} />
                  <div><p className="font-bold text-gray-900">Hide Coupon</p><p className="text-[10px] text-gray-500">Invisible to customers, recoverable</p></div>
                </label>
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="deleteMode" checked={deleteMode === 'DISABLE'} onChange={() => setDeleteMode('DISABLE')} />
                  <div><p className="font-bold text-gray-900">Disable Coupon</p><p className="text-[10px] text-gray-500">Cannot be used by anyone</p></div>
                </label>
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="deleteMode" checked={deleteMode === 'ARCHIVE'} onChange={() => setDeleteMode('ARCHIVE')} />
                  <div><p className="font-bold text-gray-900">Archive Coupon</p><p className="text-[10px] text-gray-500">Move to archive for record keeping</p></div>
                </label>
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-red-200 bg-red-50/50 cursor-pointer">
                  <input type="radio" name="deleteMode" checked={deleteMode === 'DELETE'} onChange={() => setDeleteMode('DELETE')} />
                  <div><p className="font-bold text-red-900">Delete Permanently</p><p className="text-[10px] text-red-600">Permanently remove from database</p></div>
                </label>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1 py-2.5 rounded-xl border text-gray-600 text-xs font-semibold hover:bg-gray-100 transition">Cancel</button>
                <button onClick={handleDeleteSubmit} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition shadow-md cursor-pointer">
                  {deleting ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminCoupons;
