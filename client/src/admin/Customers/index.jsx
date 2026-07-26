import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUsers, FiSearch, FiFilter, FiRefreshCw, FiEye, FiEdit2, FiTrash2,
  FiLock, FiUnlock, FiAlertTriangle, FiCheck, FiX, FiMail, FiPhone,
  FiShoppingBag, FiDollarSign, FiCalendar, FiShield, FiSliders,
  FiMessageSquare, FiSend, FiLogOut, FiKey, FiChevronLeft, FiChevronRight,
  FiGrid, FiList, FiCopy, FiClock, FiActivity, FiZap, FiUserCheck,
  FiUserX, FiAlertCircle, FiMoreVertical, FiDownload, FiStar
} from 'react-icons/fi';
import api from '../../config/api';
import { toast } from 'react-toastify';
import CustomerProfile from './CustomerProfile';

/* ─── STATUS CONFIG ─────────────────────────────────────── */
const STATUS_STYLES = {
  ACTIVE:    { label: 'Active',    bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  BLOCKED:   { label: 'Blocked',   bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500' },
  SUSPENDED: { label: 'Suspended', bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500' },
  INACTIVE:  { label: 'Inactive',  bg: 'bg-gray-100',    text: 'text-gray-600',    dot: 'bg-gray-400' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.INACTIVE;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

const VerifyBadge = ({ isVerified }) => isVerified
  ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"><FiCheck className="w-3 h-3" />Verified</span>
  : <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"><FiAlertCircle className="w-3 h-3" />Unverified</span>;

/* ─── MODAL WRAPPER ─────────────────────────────────────── */
const Modal = ({ open, onClose, title, children, wide = false }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition"><FiX className="w-5 h-5" /></button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

/* ─── CONFIRM DIALOG ─────────────────────────────────────── */
const ConfirmDialog = ({ open, message, warning, onConfirm, onCancel, confirmLabel = 'Confirm', danger = true }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-7"
        >
          <div className="flex items-start gap-4 mb-5">
            <div className={`p-3 rounded-full shrink-0 ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
              <FiAlertTriangle className={`w-5 h-5 ${danger ? 'text-red-500' : 'text-amber-500'}`} />
            </div>
            <div>
              <p className="text-gray-800 text-sm leading-relaxed">{message}</p>
              {warning && <p className="text-red-600 text-xs mt-2 font-semibold">{warning}</p>}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium transition">Cancel</button>
            <button onClick={onConfirm} className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'}`}>{confirmLabel}</button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

/* ─── STAT CARD ─────────────────────────────────────────── */
const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`p-2.5 rounded-xl ${color.replace('text-', 'bg-').replace('-600', '-100').replace('-700', '-100')}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  </div>
);

/* ─── AVATAR ─────────────────────────────────────────────── */
const Avatar = ({ customer, size = 9 }) => {
  const initials = (customer.fullName || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-pink-500', 'bg-rose-500', 'bg-amber-500', 'bg-teal-500', 'bg-cyan-500', 'bg-emerald-500'];
  const color = colors[(customer.fullName || '').length % colors.length];
  return customer.avatar
    ? <img src={customer.avatar} alt={customer.fullName} className={`w-${size} h-${size} rounded-full object-cover border-2 border-white shadow-sm`} />
    : <div className={`w-${size} h-${size} rounded-full ${color} flex items-center justify-center text-white font-bold text-xs shadow-sm border-2 border-white`}>{initials}</div>;
};

/* ─── FORMAT HELPERS ─────────────────────────────────────── */
const fmt = (n) => (n || 0).toLocaleString('en-IN');
const fmtCur = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never';

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
const AdminCustomers = () => {
  /* ── State ── */
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  /* ── Filters ── */
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [presetFilter, setPresetFilter] = useState('');

  /* ── Profile View ── */
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  /* ── Modals ── */
  const [editCustomer, setEditCustomer] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [passwordCustomer, setPasswordCustomer] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [blockTarget, setBlockTarget] = useState(null);
  const [blockForm, setBlockForm] = useState({ reason: 'Policy Violation', notes: '' });
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendForm, setSuspendForm] = useState({ durationDays: 7, reason: 'Temporary Suspension' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteOptions, setDeleteOptions] = useState({ deleteAll: true, deleteWishlist: false, deleteAddresses: false, deleteReviews: false, deleteMessages: false });
  const [messageTarget, setMessageTarget] = useState(null);
  const [messageForm, setMessageForm] = useState({ title: '', message: '', type: 'ADMIN' });
  const [permTarget, setPermTarget] = useState(null);
  const [permForm, setPermForm] = useState({});
  const [notesTarget, setNotesTarget] = useState(null);
  const [notesText, setNotesText] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  const [resetTarget, setResetTarget] = useState(null);
  const [resetChannel, setResetChannel] = useState('EMAIL');

  /* ── Fetch ── */
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        filter: presetFilter || undefined,
      };
      const res = await api.get('/admin/customers', { params });
      setCustomers(res.data.data?.customers || []);
      setSummary(res.data.data?.summary || {});
      setPagination(res.data.data?.pagination || { total: 0, page: 1, limit: 20, pages: 1 });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Unknown error';
      toast.error(`Failed to load customers: ${msg}`);
      console.error('[Customers] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, presetFilter]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, statusFilter, presetFilter]);

  /* ── Edit Customer ── */
  const openEdit = (c) => {
    setEditCustomer(c);
    setEditForm({
      firstName: c.firstName || '', lastName: c.lastName || '', fullName: c.fullName || '',
      username: c.username || '', email: c.email || '', phone: c.phone || '',
      alternatePhone: c.alternatePhone || '', whatsappNumber: c.whatsappNumber || '',
      gender: c.gender || '', dob: c.dob ? c.dob.split('T')[0] : '', avatar: c.avatar || ''
    });
  };
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.put(`/admin/customers/${editCustomer.id}`, editForm);
      toast.success('Customer updated successfully!');
      setEditCustomer(null);
      fetchCustomers();
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setActionLoading(false); }
  };

  /* ── Change Password ── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('Passwords do not match');
    try {
      setActionLoading(true);
      await api.post(`/admin/customers/${passwordCustomer.id}/change-password`, passwordForm);
      toast.success('Password changed! Customer logged out from all devices.');
      setPasswordCustomer(null);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    finally { setActionLoading(false); }
  };

  /* ── Reset Password ── */
  const handleResetPassword = async () => {
    try {
      setActionLoading(true);
      const res = await api.post(`/admin/customers/${resetTarget.id}/reset-password`, { channel: resetChannel });
      toast.success(`Password reset! Temp: ${res.data.data?.tempPassword}`);
      setResetTarget(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Reset failed'); }
    finally { setActionLoading(false); }
  };

  /* ── Block ── */
  const handleBlock = async () => {
    try {
      setActionLoading(true);
      await api.post(`/admin/customers/${blockTarget.id}/block`, blockForm);
      toast.success(`"${blockTarget.fullName}" blocked & logged out from all devices.`);
      setBlockTarget(null);
      setBlockForm({ reason: 'Policy Violation', notes: '' });
      fetchCustomers();
    } catch (err) { toast.error(err.response?.data?.message || 'Block failed'); }
    finally { setActionLoading(false); }
  };

  /* ── Unblock ── */
  const handleUnblock = (c) => {
    setConfirmDialog({
      open: true, danger: false,
      message: `Unblock "${c.fullName}"? They will regain full access to login, checkout, wishlist, and all features.`,
      confirmLabel: 'Yes, Unblock',
      onConfirm: async () => {
        try {
          await api.post(`/admin/customers/${c.id}/unblock`);
          toast.success(`"${c.fullName}" unblocked. Full access restored.`);
          setConfirmDialog({ open: false });
          fetchCustomers();
        } catch (err) { toast.error(err.response?.data?.message || 'Unblock failed'); setConfirmDialog({ open: false }); }
      },
      onCancel: () => setConfirmDialog({ open: false })
    });
  };

  /* ── Suspend ── */
  const handleSuspend = async () => {
    try {
      setActionLoading(true);
      await api.post(`/admin/customers/${suspendTarget.id}/suspend`, suspendForm);
      toast.success(`"${suspendTarget.fullName}" suspended for ${suspendForm.durationDays} days.`);
      setSuspendTarget(null);
      fetchCustomers();
    } catch (err) { toast.error(err.response?.data?.message || 'Suspend failed'); }
    finally { setActionLoading(false); }
  };

  /* ── Force Logout ── */
  const handleForceLogout = (c) => {
    setConfirmDialog({
      open: true, danger: false,
      message: `Force logout "${c.fullName}" from all devices? They will need to login again.`,
      confirmLabel: 'Force Logout',
      onConfirm: async () => {
        try {
          await api.post(`/admin/customers/${c.id}/force-logout`);
          toast.success(`"${c.fullName}" logged out from all devices.`);
          setConfirmDialog({ open: false });
        } catch (err) { toast.error('Force logout failed'); setConfirmDialog({ open: false }); }
      },
      onCancel: () => setConfirmDialog({ open: false })
    });
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await api.delete(`/admin/customers/${deleteTarget.id}`, { data: deleteOptions });
      toast.success(`"${deleteTarget.fullName}" permanently deleted.`);
      setDeleteTarget(null);
      fetchCustomers();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setActionLoading(false); }
  };

  /* ── Send Message ── */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.post(`/admin/customers/${messageTarget.id}/send-message`, messageForm);
      toast.success('Message delivered to customer dashboard!');
      setMessageTarget(null);
      setMessageForm({ title: '', message: '', type: 'ADMIN' });
    } catch (err) { toast.error('Failed to send message'); }
    finally { setActionLoading(false); }
  };

  /* ── Permissions ── */
  const openPermissions = (c) => {
    setPermTarget(c);
    setPermForm({
      canLogin: c.canLogin, canCheckout: c.canCheckout ?? true,
      canPlaceOrders: c.canPlaceOrders, canCancelOrders: c.canCancelOrders,
      canReturnProducts: c.canReturnProducts, canAddReviews: c.canAddReviews,
      canAddWishlist: c.canAddWishlist, canUseCoupons: c.canUseCoupons,
      canUseWallet: c.canUseWallet ?? true, canUseReferral: c.canUseReferral ?? true
    });
  };
  const handleSavePermissions = async () => {
    try {
      setActionLoading(true);
      await api.put(`/admin/customers/${permTarget.id}/permissions`, permForm);
      toast.success('Permissions updated!');
      setPermTarget(null);
      fetchCustomers();
    } catch (err) { toast.error('Failed to update permissions'); }
    finally { setActionLoading(false); }
  };

  /* ── Admin Notes ── */
  const openNotes = (c) => { setNotesTarget(c); setNotesText(c.adminNotes || ''); };
  const handleSaveNotes = async () => {
    try {
      setActionLoading(true);
      await api.put(`/admin/customers/${notesTarget.id}/admin-notes`, { adminNotes: notesText });
      toast.success('Private notes saved!');
      setNotesTarget(null);
      fetchCustomers();
    } catch (err) { toast.error('Failed to save notes'); }
    finally { setActionLoading(false); }
  };

  /* ── Assign Customer IDs ── */
  const handleAssignIds = async () => {
    try {
      const res = await api.post('/admin/customers/assign-customer-ids');
      toast.success(res.data.message);
      fetchCustomers();
    } catch (err) { toast.error('Failed to assign IDs'); }
  };

  /* ─── If a customer profile is open ─── */
  if (selectedCustomerId) {
    return (
      <CustomerProfile
        customerId={selectedCustomerId}
        onBack={() => setSelectedCustomerId(null)}
        onAction={fetchCustomers}
      />
    );
  }

  /* ─── RENDER ─── */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiUsers className="text-indigo-500" /> Customer Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Complete admin control — Shopify & Amazon Seller Hub level</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleAssignIds}
            title="Assign CUS IDs to existing customers without one"
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-white text-gray-500 hover:text-indigo-600 transition">
            <FiKey className="w-4 h-4" />
          </button>
          <button onClick={fetchCustomers} className="p-2.5 rounded-xl border border-gray-200 hover:bg-white text-gray-500 transition">
            <FiRefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode(v => v === 'table' ? 'grid' : 'table')}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-white text-gray-500 transition">
            {viewMode === 'table' ? <FiGrid className="w-4 h-4" /> : <FiList className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard label="Total Registered" value={fmt(summary.totalCustomers)} icon={FiUsers} color="text-indigo-600" />
        <StatCard label="Active Customers" value={fmt(summary.activeCustomers)} icon={FiUserCheck} color="text-emerald-600" />
        <StatCard label="Blocked Accounts" value={fmt(summary.blockedCustomers)} icon={FiUserX} color="text-red-600" />
        <StatCard label="Suspended" value={fmt(summary.suspendedCustomers)} icon={FiAlertCircle} color="text-amber-600" />
        <StatCard label="Unverified" value={fmt(summary.unverifiedCustomers)} icon={FiShield} color="text-gray-500" />
        <StatCard label="Total Revenue" value={fmtCur(summary.totalCustomerRevenue)} icon={FiDollarSign} color="text-indigo-600" />
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, Customer ID…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 min-w-[160px]">
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="BLOCKED">Blocked</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {/* Preset filter pills */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            { key: '', label: 'All Customers' },
            { key: 'NEW_CUSTOMERS', label: '🆕 New This Week' },
            { key: 'PENDING_VERIFICATION', label: '⚠️ Pending Verification' },
            { key: 'WITH_ORDERS', label: '🛍️ With Orders' },
            { key: 'WITHOUT_ORDERS', label: '👤 Without Orders' },
            { key: 'BLOCKED', label: '🚫 Blocked' },
          ].map(f => (
            <button key={f.key} onClick={() => setPresetFilter(f.key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${presetFilter === f.key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400 gap-3">
            <FiRefreshCw className="animate-spin w-5 h-5" /> Loading customers…
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-24">
            <FiUsers className="w-12 h-12 mx-auto text-gray-200 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">No customers found</h3>
            <p className="text-sm text-gray-400">Try clearing filters or searching with a different keyword.</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer ID</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders / Spent</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Registered</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Verified</th>
                  <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map(c => (
                  <CustomerRow
                    key={c.id}
                    customer={c}
                    onView={() => setSelectedCustomerId(c.id)}
                    onEdit={() => openEdit(c)}
                    onChangePassword={() => setPasswordCustomer(c)}
                    onResetPassword={() => setResetTarget(c)}
                    onBlock={() => setBlockTarget(c)}
                    onUnblock={() => handleUnblock(c)}
                    onSuspend={() => setSuspendTarget(c)}
                    onForceLogout={() => handleForceLogout(c)}
                    onDelete={() => setDeleteTarget(c)}
                    onSendMessage={() => setMessageTarget(c)}
                    onPermissions={() => openPermissions(c)}
                    onNotes={() => openNotes(c)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-5">
            {customers.map(c => (
              <CustomerCard
                key={c.id}
                customer={c}
                onView={() => setSelectedCustomerId(c.id)}
                onEdit={() => openEdit(c)}
                onBlock={() => setBlockTarget(c)}
                onUnblock={() => handleUnblock(c)}
                onDelete={() => setDeleteTarget(c)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total} customers
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-700 px-2">Page {page} of {pagination.pages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════ MODALS ═══════════════════════════════ */}

      {/* ── Edit Modal ── */}
      <Modal open={!!editCustomer} onClose={() => setEditCustomer(null)} title={`Edit: ${editCustomer?.fullName}`} wide>
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[['firstName', 'First Name'], ['lastName', 'Last Name'], ['username', 'Username'], ['phone', 'Phone'], ['alternatePhone', 'Alternate Phone'], ['whatsappNumber', 'WhatsApp Number']].map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                <input value={editForm[key] || ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
            <input type="email" value={editForm.email || ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Gender</label>
              <select value={editForm.gender || ''} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Date of Birth</label>
              <input type="date" value={editForm.dob || ''} onChange={e => setEditForm(f => ({ ...f, dob: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setEditCustomer(null)} className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={actionLoading} className="px-5 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60 font-semibold transition">
              {actionLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Change Password Modal ── */}
      <Modal open={!!passwordCustomer} onClose={() => setPasswordCustomer(null)} title={`Change Password: ${passwordCustomer?.fullName}`}>
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <FiAlertTriangle className="inline w-3.5 h-3.5 mr-1.5" />
          The customer will be immediately logged out from all devices and must log in using the new password.
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">New Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={passwordForm.newPassword}
                onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                placeholder="Min 8 chars, upper, lower, number, special"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 pr-10" required />
              <button type="button" onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm Password</label>
            <input type="password" value={passwordForm.confirmPassword}
              onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setPasswordCustomer(null)} className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={actionLoading} className="px-5 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60 font-semibold transition">
              {actionLoading ? 'Changing…' : 'Change Password'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Reset Password Modal ── */}
      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title={`Reset Password: ${resetTarget?.fullName}`}>
        <p className="text-sm text-gray-600 mb-4">A temporary password will be generated and sent via the selected channel. The customer must change it on next login.</p>
        <div className="space-y-3 mb-5">
          {['EMAIL', 'SMS', 'WHATSAPP'].map(ch => (
            <label key={ch} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${resetChannel === ch ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="channel" value={ch} checked={resetChannel === ch} onChange={() => setResetChannel(ch)} className="text-indigo-600" />
              <span className="text-sm font-medium">{ch === 'EMAIL' ? '📧 Send via Email' : ch === 'SMS' ? '📱 Send via SMS' : '💬 Send via WhatsApp'}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setResetTarget(null)} className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleResetPassword} disabled={actionLoading} className="px-5 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60 font-semibold transition">
            {actionLoading ? 'Resetting…' : 'Generate & Send'}
          </button>
        </div>
      </Modal>

      {/* ── Block Modal ── */}
      <Modal open={!!blockTarget} onClose={() => setBlockTarget(null)} title={`Block Account: ${blockTarget?.fullName}`}>
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <FiAlertTriangle className="inline w-3.5 h-3.5 mr-1.5" />
          The customer will be immediately logged out from all devices. They cannot login, checkout, place orders, access wishlist, or use any shopping features until unblocked.
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Reason for Blocking *</label>
            <div className="space-y-2">
              {['Fake Orders', 'Fraud', 'Spam', 'Abuse', 'Policy Violation', 'Duplicate Account', 'Other'].map(r => (
                <label key={r} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${blockForm.reason === r ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="blockReason" value={r} checked={blockForm.reason === r} onChange={() => setBlockForm(f => ({ ...f, reason: r }))} className="text-red-600" />
                  <span className="text-sm">{r}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Additional Notes (optional)</label>
            <textarea value={blockForm.notes} onChange={e => setBlockForm(f => ({ ...f, notes: e.target.value }))}
              rows={3} placeholder="Internal notes visible only to admins…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none" />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setBlockTarget(null)} className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition">Cancel</button>
            <button onClick={handleBlock} disabled={actionLoading} className="px-5 py-2.5 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-60 font-semibold transition">
              {actionLoading ? 'Blocking…' : '🚫 Block Account'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Suspend Modal ── */}
      <Modal open={!!suspendTarget} onClose={() => setSuspendTarget(null)} title={`Suspend Account: ${suspendTarget?.fullName}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Duration</label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 3, 7, 14, 30, 60, 90].map(d => (
                <button key={d} type="button" onClick={() => setSuspendForm(f => ({ ...f, durationDays: d }))}
                  className={`py-2 text-sm font-semibold rounded-xl border transition ${suspendForm.durationDays === d ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 hover:border-amber-300'}`}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Reason</label>
            <input value={suspendForm.reason} onChange={e => setSuspendForm(f => ({ ...f, reason: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setSuspendTarget(null)} className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition">Cancel</button>
            <button onClick={handleSuspend} disabled={actionLoading} className="px-5 py-2.5 text-sm bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-60 font-semibold transition">
              {actionLoading ? 'Suspending…' : `Suspend ${suspendForm.durationDays} Days`}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={`Delete Account: ${deleteTarget?.fullName}`}>
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
          ⚠️ This action CANNOT be undone. The customer will permanently lose access.
        </div>
        <div className="space-y-3 mb-5">
          <p className="text-sm font-semibold text-gray-700">Select what to delete:</p>
          {[
            ['deleteAll', '🗑️ Delete Everything (recommended)'],
            ['deleteWishlist', '💝 Delete Wishlist'],
            ['deleteAddresses', '📍 Delete Saved Addresses'],
            ['deleteReviews', '⭐ Delete Reviews'],
            ['deleteMessages', '🔔 Delete Notifications & Messages'],
          ].map(([key, label]) => (
            <label key={key} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${deleteOptions[key] ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="checkbox" checked={deleteOptions[key]}
                onChange={e => {
                  const newOpts = { ...deleteOptions, [key]: e.target.checked };
                  if (key === 'deleteAll' && e.target.checked) {
                    Object.keys(newOpts).forEach(k => { newOpts[k] = k !== 'deleteAll' ? false : true; });
                  }
                  setDeleteOptions(newOpts);
                }}
                className="text-red-600 w-4 h-4" />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteTarget(null)} className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleDelete} disabled={actionLoading} className="px-5 py-2.5 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-60 font-semibold transition">
            {actionLoading ? 'Deleting…' : '🗑️ Permanently Delete'}
          </button>
        </div>
      </Modal>

      {/* ── Send Message Modal ── */}
      <Modal open={!!messageTarget} onClose={() => setMessageTarget(null)} title={`Send Message to ${messageTarget?.fullName}`}>
        <form onSubmit={handleSendMessage} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Message Type</label>
            <select value={messageForm.type} onChange={e => setMessageForm(f => ({ ...f, type: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
              <option value="ADMIN">Admin Message</option>
              <option value="SECURITY">Security Alert</option>
              <option value="ACCOUNT">Account Update</option>
              <option value="PROMO">Promotional</option>
              <option value="ORDER">Order Update</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
            <input value={messageForm.title} onChange={e => setMessageForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Important account notice"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Message *</label>
            <textarea value={messageForm.message} onChange={e => setMessageForm(f => ({ ...f, message: e.target.value }))}
              rows={4} placeholder="Write your message to the customer…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" required />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setMessageTarget(null)} className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={actionLoading} className="px-5 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60 font-semibold transition">
              {actionLoading ? 'Sending…' : '📨 Send Message'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Permissions Modal ── */}
      <Modal open={!!permTarget} onClose={() => setPermTarget(null)} title={`Permissions: ${permTarget?.fullName}`} wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {[
            ['canLogin', '🔐 Can Login'],
            ['canCheckout', '🛒 Can Checkout'],
            ['canPlaceOrders', '📦 Can Place Orders'],
            ['canCancelOrders', '❌ Can Cancel Orders'],
            ['canReturnProducts', '↩️ Can Return Products'],
            ['canAddReviews', '⭐ Can Add Reviews'],
            ['canAddWishlist', '💝 Can Use Wishlist'],
            ['canUseCoupons', '🎟️ Can Use Coupons'],
            ['canUseWallet', '💳 Can Use Wallet'],
            ['canUseReferral', '👥 Can Use Referral Program'],
          ].map(([key, label]) => (
            <label key={key} className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition ${permForm[key] ? 'border-emerald-400 bg-emerald-50' : 'border-red-200 bg-red-50/50'}`}>
              <span className="text-sm font-medium text-gray-700">{label}</span>
              <div className={`relative inline-flex w-10 h-6 rounded-full transition-colors ${permForm[key] ? 'bg-emerald-500' : 'bg-gray-300'}`}
                onClick={() => setPermForm(f => ({ ...f, [key]: !f[key] }))}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${permForm[key] ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </label>
          ))}
        </div>
        <div className="flex gap-3 justify-end border-t border-gray-100 pt-4">
          <button onClick={() => setPermTarget(null)} className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSavePermissions} disabled={actionLoading} className="px-5 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60 font-semibold transition">
            {actionLoading ? 'Saving…' : 'Save Permissions'}
          </button>
        </div>
      </Modal>

      {/* ── Admin Notes Modal ── */}
      <Modal open={!!notesTarget} onClose={() => setNotesTarget(null)} title={`Private Notes: ${notesTarget?.fullName}`}>
        <div className="mb-3 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
          🔒 These notes are ONLY visible to admin staff. The customer will NEVER see them.
        </div>
        <textarea value={notesText} onChange={e => setNotesText(e.target.value)}
          rows={6} placeholder="VIP Customer, Frequent Returns, Fraud Alert, Call Before Delivery…"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none mb-4" />
        <div className="flex gap-3 justify-end">
          <button onClick={() => setNotesTarget(null)} className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSaveNotes} disabled={actionLoading} className="px-5 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60 font-semibold transition">
            {actionLoading ? 'Saving…' : '💾 Save Notes'}
          </button>
        </div>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        message={confirmDialog.message}
        warning={confirmDialog.warning}
        confirmLabel={confirmDialog.confirmLabel}
        danger={confirmDialog.danger !== false}
        onConfirm={confirmDialog.onConfirm}
        onCancel={confirmDialog.onCancel || (() => setConfirmDialog({ open: false }))}
      />
    </div>
  );
};

/* ─── CUSTOMER ROW ─────────────────────────────────────── */
const CustomerRow = ({ customer: c, onView, onEdit, onChangePassword, onResetPassword, onBlock, onUnblock, onSuspend, onForceLogout, onDelete, onSendMessage, onPermissions, onNotes }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <tr className="hover:bg-indigo-50/30 transition group">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar customer={c} />
          <div>
            <p className="font-semibold text-gray-900 text-sm">{c.fullName}</p>
            <p className="text-xs text-gray-400">{c.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
          {c.customerId || '—'}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <p className="text-xs text-gray-600">{c.phone || '—'}</p>
        {c.whatsappNumber && <p className="text-xs text-emerald-600">{c.whatsappNumber}</p>}
      </td>
      <td className="px-4 py-3.5">
        <div>
          <span className="text-sm font-semibold text-gray-900">{c.stats?.totalOrders || 0} orders</span>
          <p className="text-xs text-indigo-600 font-medium">{fmtCur(c.stats?.totalSpent)}</p>
        </div>
      </td>
      <td className="px-4 py-3.5 text-xs text-gray-500">{fmtDate(c.createdAt)}</td>
      <td className="px-4 py-3.5 text-xs text-gray-500">{fmtDateTime(c.lastLoginAt)}</td>
      <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
      <td className="px-4 py-3.5"><VerifyBadge isVerified={c.isVerified} /></td>
      <td className="px-4 py-3.5">
        <div className="flex items-center justify-end gap-1">
          {/* Primary actions */}
          <button onClick={onView} title="View Profile" className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-500 transition"><FiEye className="w-4 h-4" /></button>
          <button onClick={onEdit} title="Edit Details" className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-500 transition"><FiEdit2 className="w-4 h-4" /></button>
          {c.status === 'BLOCKED' || c.status === 'SUSPENDED'
            ? <button onClick={onUnblock} title="Unblock" className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-500 transition"><FiUnlock className="w-4 h-4" /></button>
            : <button onClick={onBlock} title="Block" className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition"><FiLock className="w-4 h-4" /></button>
          }
          {/* Overflow menu */}
          <div className="relative">
            <button onClick={() => setMenuOpen(m => !m)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
              <FiMoreVertical className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[200px]"
                  >
                    {[
                      { label: '🔑 Change Password', action: onChangePassword },
                      { label: '🔄 Reset Password', action: onResetPassword },
                      { label: '⏸️ Suspend Account', action: onSuspend },
                      { label: '🚪 Force Logout', action: onForceLogout },
                      { label: '📨 Send Message', action: onSendMessage },
                      { label: '🔧 Manage Permissions', action: onPermissions },
                      { label: '📝 Private Notes', action: onNotes },
                      { label: '🗑️ Delete Account', action: onDelete, danger: true },
                    ].map(({ label, action, danger }) => (
                      <button key={label} onClick={() => { setMenuOpen(false); action(); }}
                        className={`w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 transition ${danger ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                        {label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </td>
    </tr>
  );
};

/* ─── CUSTOMER CARD (Grid View) ─────────────────────────── */
const CustomerCard = ({ customer: c, onView, onEdit, onBlock, onUnblock, onDelete }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
    <div className="flex items-start gap-3 mb-4">
      <Avatar customer={c} size={12} />
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 text-sm truncate">{c.fullName}</h3>
        <p className="text-xs text-gray-500 truncate">{c.email}</p>
        <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mt-1 inline-block">{c.customerId || '—'}</span>
      </div>
      <StatusBadge status={c.status} />
    </div>
    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-4">
      <span className="flex items-center gap-1"><FiShoppingBag className="w-3 h-3" />{c.stats?.totalOrders || 0} orders</span>
      <span className="flex items-center gap-1"><FiDollarSign className="w-3 h-3" />{fmtCur(c.stats?.totalSpent)}</span>
      <span className="flex items-center gap-1"><FiCalendar className="w-3 h-3" />{fmtDate(c.createdAt)}</span>
      <VerifyBadge isVerified={c.isVerified} />
    </div>
    <div className="flex gap-2">
      <button onClick={onView} className="flex-1 py-2 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition">View</button>
      <button onClick={onEdit} className="flex-1 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition">Edit</button>
      {c.status === 'BLOCKED'
        ? <button onClick={onUnblock} className="flex-1 py-2 text-xs font-semibold text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-50 transition">Unblock</button>
        : <button onClick={onBlock} className="flex-1 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition">Block</button>
      }
    </div>
  </div>
);

export default AdminCustomers;
