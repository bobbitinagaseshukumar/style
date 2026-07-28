import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUsers, FiSearch, FiRefreshCw, FiEye, FiEdit2,
  FiLock, FiUnlock, FiAlertTriangle, FiCheck, FiX, FiPhone,
  FiShoppingBag, FiDollarSign, FiCalendar, FiShield,
  FiMessageSquare, FiLogOut, FiKey, FiChevronLeft, FiChevronRight,
  FiGrid, FiList, FiUserCheck,
  FiUserX, FiAlertCircle, FiMoreVertical
} from 'react-icons/fi';
import api from '../../config/api';
import { toast } from 'react-toastify';
import CustomerProfile from './CustomerProfile';

/* ═══ STATUS BADGE ═══ */
const STATUS_MAP = {
  ACTIVE:    { label: 'Active',    cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  BLOCKED:   { label: 'Blocked',   cls: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
  SUSPENDED: { label: 'Suspended', cls: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500' },
  INACTIVE:  { label: 'Inactive',  cls: 'bg-gray-200 text-gray-600',     dot: 'bg-gray-400' },
};
const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.INACTIVE;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

const VerifyBadge = ({ v }) => v
  ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><FiCheck className="w-3 h-3" />Verified</span>
  : <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"><FiAlertCircle className="w-3 h-3" />Unverified</span>;

/* ═══ MODAL ═══ */
const Modal = ({ open, onClose, title, children, wide }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm" style={{ padding: 16 }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: wide ? 640 : 480, maxHeight: '90vh', width: '100%', overflowY: 'auto', borderRadius: 16, background: '#fff', boxShadow: '0 25px 50px rgba(0,0,0,.25)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f1f1f1' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{title}</h3>
          <button onClick={onClose} style={{ padding: 6, borderRadius: 8, border: 'none', background: '#f5f5f5', cursor: 'pointer', display: 'flex' }}>
            <FiX style={{ width: 18, height: 18, color: '#666' }} />
          </button>
        </div>
        <div style={{ padding: '20px 24px' }}>{children}</div>
      </motion.div>
    </div>
  );
};

/* ═══ FORMAT HELPERS ═══ */
const fmt = n => (n || 0).toLocaleString('en-IN');
const fmtCur = n => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtTime = d => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never';

/* ═══ AVATAR ═══ */
const AVATAR_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f59e0b','#14b8a6','#06b6d4','#10b981'];
const Avatar = ({ c, sz = 36 }) => {
  const initials = (c.fullName || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const bg = AVATAR_COLORS[(c.fullName || '').length % AVATAR_COLORS.length];
  if (c.avatar) return <img src={c.avatar} alt="" style={{ width: sz, height: sz, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,.1)' }} />;
  return <div style={{ width: sz, height: sz, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: sz * 0.35, border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,.1)' }}>{initials}</div>;
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewMode, setViewMode] = useState('table');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [presetFilter, setPresetFilter] = useState('');

  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  // Modals
  const [editCustomer, setEditCustomer] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [passwordCustomer, setPasswordCustomer] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [blockTarget, setBlockTarget] = useState(null);
  const [blockForm, setBlockForm] = useState({ reason: 'Policy Violation', notes: '' });
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendForm, setSuspendForm] = useState({ durationDays: 7, reason: 'Temporary Suspension' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteOpts, setDeleteOpts] = useState({ deleteAll: true });
  const [messageTarget, setMessageTarget] = useState(null);
  const [msgForm, setMsgForm] = useState({ title: '', message: '', type: 'ADMIN' });
  const [permTarget, setPermTarget] = useState(null);
  const [permForm, setPermForm] = useState({});
  const [notesTarget, setNotesTarget] = useState(null);
  const [notesText, setNotesText] = useState('');
  const [resetTarget, setResetTarget] = useState(null);
  const [resetChannel, setResetChannel] = useState('EMAIL');
  const [confirmDlg, setConfirmDlg] = useState(null);

  /* ── Fetch ── */
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (presetFilter) params.filter = presetFilter;
      const res = await api.get('/admin/customers', { params });
      const dataObj = res.data?.data || res.data;
      const customerList = Array.isArray(dataObj) ? dataObj : (dataObj?.customers || []);
      setCustomers(customerList);
      setSummary(dataObj?.summary || {});
      setPagination(dataObj?.pagination || { total: customerList.length, page: 1, limit: 20, pages: 1 });
    } catch (err) {
      const rawMsg = err?.response?.data?.message || err?.message || 'Failed to load customers';
      const msg = typeof rawMsg === 'string' && rawMsg.length > 100 ? `${rawMsg.slice(0, 100)}...` : rawMsg;
      toast.error(`Failed to load customers: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, presetFilter]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  useEffect(() => { setPage(1); }, [search, statusFilter, presetFilter]);

  /* ── Actions ── */
  const doEdit = async e => {
    e.preventDefault();
    try { setActionLoading(true); await api.put(`/admin/customers/${editCustomer.id}`, editForm); toast.success('Customer updated!'); setEditCustomer(null); fetchCustomers(); }
    catch (err) { toast.error(err.response?.data?.message || 'Update failed'); } finally { setActionLoading(false); }
  };
  const doPwd = async e => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('Passwords do not match');
    try { setActionLoading(true); await api.post(`/admin/customers/${passwordCustomer.id}/change-password`, passwordForm); toast.success('Password changed! Customer logged out.'); setPasswordCustomer(null); setPasswordForm({ newPassword: '', confirmPassword: '' }); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setActionLoading(false); }
  };
  const doResetPwd = async () => {
    try { setActionLoading(true); const r = await api.post(`/admin/customers/${resetTarget.id}/reset-password`, { channel: resetChannel }); toast.success(`Password reset! Temp: ${r.data.data?.tempPassword}`); setResetTarget(null); }
    catch (err) { toast.error(err.response?.data?.message || 'Reset failed'); } finally { setActionLoading(false); }
  };
  const doBlock = async () => {
    try { setActionLoading(true); await api.post(`/admin/customers/${blockTarget.id}/block`, blockForm); toast.success(`"${blockTarget.fullName}" blocked.`); setBlockTarget(null); setBlockForm({ reason: 'Policy Violation', notes: '' }); fetchCustomers(); }
    catch (err) { toast.error(err.response?.data?.message || 'Block failed'); } finally { setActionLoading(false); }
  };
  const doUnblock = c => {
    setConfirmDlg({ msg: `Unblock "${c.fullName}"? They will regain full access.`, label: 'Unblock', danger: false,
      fn: async () => { await api.post(`/admin/customers/${c.id}/unblock`); toast.success(`"${c.fullName}" unblocked.`); setConfirmDlg(null); fetchCustomers(); } });
  };
  const doSuspend = async () => {
    try { setActionLoading(true); await api.post(`/admin/customers/${suspendTarget.id}/suspend`, suspendForm); toast.success(`Suspended ${suspendForm.durationDays} days.`); setSuspendTarget(null); fetchCustomers(); }
    catch (err) { toast.error('Suspend failed'); } finally { setActionLoading(false); }
  };
  const doForceLogout = c => {
    setConfirmDlg({ msg: `Force logout "${c.fullName}" from all devices?`, label: 'Force Logout', danger: false,
      fn: async () => { await api.post(`/admin/customers/${c.id}/force-logout`); toast.success('Logged out from all devices.'); setConfirmDlg(null); } });
  };
  const doDelete = async () => {
    try { setActionLoading(true); await api.delete(`/admin/customers/${deleteTarget.id}`, { data: deleteOpts }); toast.success(`"${deleteTarget.fullName}" deleted.`); setDeleteTarget(null); fetchCustomers(); }
    catch (err) { toast.error('Delete failed'); } finally { setActionLoading(false); }
  };
  const doMsg = async e => {
    e.preventDefault();
    try { setActionLoading(true); await api.post(`/admin/customers/${messageTarget.id}/send-message`, msgForm); toast.success('Message sent!'); setMessageTarget(null); setMsgForm({ title: '', message: '', type: 'ADMIN' }); }
    catch (err) { toast.error('Send failed'); } finally { setActionLoading(false); }
  };
  const doPerms = async () => {
    try { setActionLoading(true); await api.put(`/admin/customers/${permTarget.id}/permissions`, permForm); toast.success('Permissions updated!'); setPermTarget(null); fetchCustomers(); }
    catch (err) { toast.error('Failed'); } finally { setActionLoading(false); }
  };
  const doNotes = async () => {
    try { setActionLoading(true); await api.put(`/admin/customers/${notesTarget.id}/admin-notes`, { adminNotes: notesText }); toast.success('Notes saved!'); setNotesTarget(null); fetchCustomers(); }
    catch (err) { toast.error('Failed'); } finally { setActionLoading(false); }
  };
  const doAssignIds = async () => {
    try { const r = await api.post('/admin/customers/assign-customer-ids'); toast.success(r.data.message); fetchCustomers(); } catch { toast.error('Failed'); }
  };

  const openEdit = c => { setEditCustomer(c); setEditForm({ firstName: c.firstName||'', lastName: c.lastName||'', fullName: c.fullName||'', username: c.username||'', email: c.email||'', phone: c.phone||'', alternatePhone: c.alternatePhone||'', whatsappNumber: c.whatsappNumber||'', gender: c.gender||'', dob: c.dob ? c.dob.split('T')[0] : '' }); };
  const openPerms = c => { setPermTarget(c); setPermForm({ canLogin: c.canLogin, canCheckout: c.canCheckout??true, canPlaceOrders: c.canPlaceOrders, canCancelOrders: c.canCancelOrders, canReturnProducts: c.canReturnProducts, canAddReviews: c.canAddReviews, canAddWishlist: c.canAddWishlist, canUseCoupons: c.canUseCoupons, canUseWallet: c.canUseWallet??true, canUseReferral: c.canUseReferral??true }); };
  const openNotes = c => { setNotesTarget(c); setNotesText(c.adminNotes || ''); };

  /* ── Profile view ── */
  if (selectedCustomerId) return <CustomerProfile customerId={selectedCustomerId} onBack={() => setSelectedCustomerId(null)} onAction={fetchCustomers} />;

  /* ═══ STYLES ═══ */
  const S = {
    page: { minHeight: '100%' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
    title: { fontSize: 22, fontWeight: 800, color: '#111', display: 'flex', alignItems: 'center', gap: 10 },
    subtitle: { fontSize: 13, color: '#888', marginTop: 2 },
    iconBtn: { padding: 10, borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 20 },
    filterBox: { background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 16, marginBottom: 18, boxShadow: '0 1px 3px rgba(0,0,0,.04)' },
    searchRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
    searchWrap: { flex: 1, minWidth: 200, position: 'relative' },
    searchInput: { width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 10, paddingBottom: 10, fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#fafafa' },
    searchIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa', width: 16, height: 16 },
    select: { border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 13, minWidth: 150, outline: 'none', background: '#fafafa', cursor: 'pointer' },
    pills: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    tableWrap: { background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.04)' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    th: { textAlign: 'left', padding: '14px 16px', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', background: '#fafafa', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' },
    td: { padding: '14px 16px', borderBottom: '1px solid #f7f7f7', verticalAlign: 'middle' },
    pagination: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderTop: '1px solid #f0f0f0', fontSize: 13, color: '#666' },
    btn: (bg, color) => ({ padding: '10px 20px', borderRadius: 10, border: 'none', background: bg, color, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'opacity .15s' }),
    btnOutline: { padding: '10px 20px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#555', fontSize: 13, fontWeight: 500, cursor: 'pointer' },
    input: { width: '100%', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 13, outline: 'none', background: '#fafafa' },
    label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.03em' },
    alert: (bg, border, color) => ({ padding: '12px 16px', borderRadius: 10, background: bg, border: `1px solid ${border}`, fontSize: 12, color, marginBottom: 16 }),
  };

  const STATS = [
    { label: 'Total Registered', val: fmt(summary.totalCustomers), bg: '#EEF2FF', color: '#4F46E5', icon: FiUsers },
    { label: 'Active Customers', val: fmt(summary.activeCustomers), bg: '#ECFDF5', color: '#059669', icon: FiUserCheck },
    { label: 'Blocked Accounts', val: fmt(summary.blockedCustomers), bg: '#FEF2F2', color: '#DC2626', icon: FiUserX },
    { label: 'Suspended', val: fmt(summary.suspendedCustomers), bg: '#FFFBEB', color: '#D97706', icon: FiAlertCircle },
    { label: 'Unverified', val: fmt(summary.unverifiedCustomers), bg: '#F9FAFB', color: '#6B7280', icon: FiShield },
    { label: 'Total Revenue', val: fmtCur(summary.totalCustomerRevenue), bg: '#F5F3FF', color: '#7C3AED', icon: FiDollarSign },
  ];

  const PRESET_PILLS = [
    { key: '', label: 'All Customers' },
    { key: 'NEW_CUSTOMERS', label: '🆕 New This Week' },
    { key: 'PENDING_VERIFICATION', label: '⚠️ Pending Verification' },
    { key: 'WITH_ORDERS', label: '🛍️ With Orders' },
    { key: 'WITHOUT_ORDERS', label: '👤 Without Orders' },
    { key: 'BLOCKED', label: '🚫 Blocked' },
  ];

  return (
    <div style={S.page}>
      {/* ─── Header ─── */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}><FiUsers style={{ color: '#4F46E5' }} /> Customer Management</h1>
          <p style={S.subtitle}>Enterprise admin control — manage every customer account</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.iconBtn} onClick={doAssignIds} title="Assign Customer IDs"><FiKey style={{ width: 16, height: 16, color: '#666' }} /></button>
          <button style={S.iconBtn} onClick={fetchCustomers} title="Refresh"><FiRefreshCw style={{ width: 16, height: 16, color: '#666' }} /></button>
          <button style={S.iconBtn} onClick={() => setViewMode(v => v === 'table' ? 'grid' : 'table')} title="Toggle View">
            {viewMode === 'table' ? <FiGrid style={{ width: 16, height: 16, color: '#666' }} /> : <FiList style={{ width: 16, height: 16, color: '#666' }} />}
          </button>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div style={S.statsGrid}>
        {STATS.map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(0,0,0,.04)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{s.label}</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</p>
              </div>
              <s.icon style={{ width: 20, height: 20, color: s.color, opacity: 0.5 }} />
            </div>
          </div>
        ))}
      </div>

      {/* ─── Filters ─── */}
      <div style={S.filterBox}>
        <div style={S.searchRow}>
          <div style={S.searchWrap}>
            <FiSearch style={S.searchIcon} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, phone, Customer ID…" style={S.searchInput} />
            {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex' }}><FiX style={{ width: 14, height: 14 }} /></button>}
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={S.select}>
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="BLOCKED">Blocked</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <div style={S.pills}>
          {PRESET_PILLS.map(p => (
            <button key={p.key} onClick={() => setPresetFilter(p.key)}
              style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20, border: presetFilter === p.key ? '1px solid #4F46E5' : '1px solid #e5e7eb', background: presetFilter === p.key ? '#4F46E5' : '#fff', color: presetFilter === p.key ? '#fff' : '#555', cursor: 'pointer', transition: 'all .15s' }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Table / Grid ─── */}
      <div style={S.tableWrap}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: '#bbb', gap: 10 }}>
            <FiRefreshCw className="animate-spin" style={{ width: 20, height: 20 }} /> Loading customers…
          </div>
        ) : customers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <FiUsers style={{ width: 48, height: 48, margin: '0 auto', color: '#ddd', marginBottom: 16 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#666', marginBottom: 4 }}>No customers found</h3>
            <p style={{ fontSize: 13, color: '#aaa' }}>Try clearing filters or searching differently.</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="table-responsive" style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ ...S.table, minWidth: '800px' }}>
              <thead>
                <tr>
                  {['Customer', 'Customer ID', 'Contact', 'Orders / Spent', 'Registered', 'Last Login', 'Status', 'Verified', ''].map(h => (
                    <th key={h} style={{ ...S.th, ...(h === '' ? { textAlign: 'right' } : {}) }}>{h || 'Actions'}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <Row key={c.id} c={c}
                    onView={() => setSelectedCustomerId(c.id)}
                    onEdit={() => openEdit(c)}
                    onPwd={() => setPasswordCustomer(c)}
                    onResetPwd={() => setResetTarget(c)}
                    onBlock={() => setBlockTarget(c)}
                    onUnblock={() => doUnblock(c)}
                    onSuspend={() => setSuspendTarget(c)}
                    onForceLogout={() => doForceLogout(c)}
                    onDelete={() => setDeleteTarget(c)}
                    onMsg={() => setMessageTarget(c)}
                    onPerms={() => openPerms(c)}
                    onNotes={() => openNotes(c)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, padding: 16 }}>
            {customers.map(c => <Card key={c.id} c={c} onView={() => setSelectedCustomerId(c.id)} onEdit={() => openEdit(c)} onBlock={() => setBlockTarget(c)} onUnblock={() => doUnblock(c)} />)}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={S.pagination}>
            <span>Showing {((page-1)*20)+1}–{Math.min(page*20, pagination.total)} of {pagination.total}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} style={{ ...S.iconBtn, opacity: page===1?.4:1 }}><FiChevronLeft style={{ width: 16, height: 16 }} /></button>
              <span style={{ fontWeight: 600 }}>Page {page} of {pagination.pages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p+1))} disabled={page===pagination.pages} style={{ ...S.iconBtn, opacity: page===pagination.pages?.4:1 }}><FiChevronRight style={{ width: 16, height: 16 }} /></button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════ MODALS ═══════════ */}

      {/* Edit */}
      <Modal open={!!editCustomer} onClose={() => setEditCustomer(null)} title={`Edit: ${editCustomer?.fullName}`} wide>
        <form onSubmit={doEdit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            {[['firstName','First Name'],['lastName','Last Name'],['username','Username'],['phone','Phone'],['alternatePhone','Alt Phone'],['whatsappNumber','WhatsApp']].map(([k,l]) => (
              <div key={k}><label style={S.label}>{l}</label><input value={editForm[k]||''} onChange={e => setEditForm(f => ({...f,[k]:e.target.value}))} style={S.input} /></div>
            ))}
          </div>
          <div style={{ marginBottom: 14 }}><label style={S.label}>Email</label><input type="email" value={editForm.email||''} onChange={e => setEditForm(f => ({...f,email:e.target.value}))} style={S.input} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            <div><label style={S.label}>Gender</label><select value={editForm.gender||''} onChange={e => setEditForm(f => ({...f,gender:e.target.value}))} style={S.input}><option value="">Select</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></div>
            <div><label style={S.label}>Date of Birth</label><input type="date" value={editForm.dob||''} onChange={e => setEditForm(f => ({...f,dob:e.target.value}))} style={S.input} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setEditCustomer(null)} style={S.btnOutline}>Cancel</button>
            <button type="submit" disabled={actionLoading} style={S.btn('#4F46E5','#fff')}>{actionLoading ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>

      {/* Change Password */}
      <Modal open={!!passwordCustomer} onClose={() => setPasswordCustomer(null)} title={`Change Password: ${passwordCustomer?.fullName}`}>
        <div style={S.alert('#FEF3C7','#FDE68A','#92400E')}><FiAlertTriangle style={{ display: 'inline', width: 14, height: 14, marginRight: 6 }} />Customer will be logged out from all devices immediately.</div>
        <form onSubmit={doPwd}>
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPwd ? 'text' : 'password'} value={passwordForm.newPassword} onChange={e => setPasswordForm(f => ({...f,newPassword:e.target.value}))} placeholder="Min 8 chars, upper+lower+number+special" style={S.input} required />
              <button type="button" onClick={() => setShowPwd(s=>!s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#888' }}>{showPwd?'Hide':'Show'}</button>
            </div>
          </div>
          <div style={{ marginBottom: 20 }}><label style={S.label}>Confirm Password</label><input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(f => ({...f,confirmPassword:e.target.value}))} style={S.input} required /></div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setPasswordCustomer(null)} style={S.btnOutline}>Cancel</button>
            <button type="submit" disabled={actionLoading} style={S.btn('#4F46E5','#fff')}>{actionLoading ? 'Changing…' : 'Change Password'}</button>
          </div>
        </form>
      </Modal>

      {/* Reset Password */}
      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title={`Reset Password: ${resetTarget?.fullName}`}>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>A temporary password will be generated and sent via the selected channel.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {['EMAIL','SMS','WHATSAPP'].map(ch => (
            <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, border: resetChannel===ch ? '2px solid #4F46E5' : '1px solid #e5e7eb', background: resetChannel===ch ? '#EEF2FF' : '#fff', cursor: 'pointer' }}>
              <input type="radio" name="ch" checked={resetChannel===ch} onChange={() => setResetChannel(ch)} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{ch === 'EMAIL' ? '📧 Email' : ch === 'SMS' ? '📱 SMS' : '💬 WhatsApp'}</span>
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => setResetTarget(null)} style={S.btnOutline}>Cancel</button>
          <button onClick={doResetPwd} disabled={actionLoading} style={S.btn('#4F46E5','#fff')}>{actionLoading ? 'Resetting…' : 'Generate & Send'}</button>
        </div>
      </Modal>

      {/* Block */}
      <Modal open={!!blockTarget} onClose={() => setBlockTarget(null)} title={`Block: ${blockTarget?.fullName}`}>
        <div style={S.alert('#FEF2F2','#FECACA','#991B1B')}><FiAlertTriangle style={{ display: 'inline', width: 14, height: 14, marginRight: 6 }} />Customer will be immediately logged out. They cannot login, checkout, or access any features until unblocked.</div>
        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>Reason *</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['Fake Orders','Fraud','Spam','Abuse','Policy Violation','Duplicate Account','Other'].map(r => (
              <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, border: blockForm.reason===r ? '2px solid #DC2626' : '1px solid #e5e7eb', background: blockForm.reason===r ? '#FEF2F2' : '#fff', cursor: 'pointer', fontSize: 13 }}>
                <input type="radio" name="br" checked={blockForm.reason===r} onChange={() => setBlockForm(f => ({...f,reason:r}))} /> {r}
              </label>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}><label style={S.label}>Additional Notes</label><textarea value={blockForm.notes} onChange={e => setBlockForm(f => ({...f,notes:e.target.value}))} rows={3} placeholder="Internal notes (admin only)…" style={{ ...S.input, resize: 'none' }} /></div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => setBlockTarget(null)} style={S.btnOutline}>Cancel</button>
          <button onClick={doBlock} disabled={actionLoading} style={S.btn('#DC2626','#fff')}>{actionLoading ? 'Blocking…' : '🚫 Block Account'}</button>
        </div>
      </Modal>

      {/* Suspend */}
      <Modal open={!!suspendTarget} onClose={() => setSuspendTarget(null)} title={`Suspend: ${suspendTarget?.fullName}`}>
        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>Duration (days)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[1,3,7,14,30,60,90].map(d => (
              <button key={d} type="button" onClick={() => setSuspendForm(f => ({...f,durationDays:d}))}
                style={{ padding: '10px 0', fontSize: 13, fontWeight: 700, borderRadius: 8, border: suspendForm.durationDays===d ? '2px solid #D97706' : '1px solid #e5e7eb', background: suspendForm.durationDays===d ? '#D97706' : '#fff', color: suspendForm.durationDays===d ? '#fff' : '#555', cursor: 'pointer' }}>
                {d}d
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}><label style={S.label}>Reason</label><input value={suspendForm.reason} onChange={e => setSuspendForm(f => ({...f,reason:e.target.value}))} style={S.input} /></div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => setSuspendTarget(null)} style={S.btnOutline}>Cancel</button>
          <button onClick={doSuspend} disabled={actionLoading} style={S.btn('#D97706','#fff')}>{actionLoading ? 'Suspending…' : `Suspend ${suspendForm.durationDays} Days`}</button>
        </div>
      </Modal>

      {/* Delete */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={`Delete: ${deleteTarget?.fullName}`}>
        <div style={S.alert('#FEF2F2','#FECACA','#991B1B')}>⚠️ <strong>This action CANNOT be undone.</strong> The customer will permanently lose access.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {[['deleteAll','🗑️ Delete Everything (recommended)'],['deleteWishlist','💝 Wishlist'],['deleteAddresses','📍 Saved Addresses'],['deleteReviews','⭐ Reviews'],['deleteMessages','🔔 Notifications & Messages']].map(([k,l]) => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: deleteOpts[k] ? '2px solid #DC2626' : '1px solid #e5e7eb', background: deleteOpts[k] ? '#FEF2F2' : '#fff', cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={!!deleteOpts[k]} onChange={e => { const n = {...deleteOpts,[k]:e.target.checked}; if(k==='deleteAll'&&e.target.checked) Object.keys(n).forEach(x=>{n[x]=x==='deleteAll'}); setDeleteOpts(n); }} /> {l}
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => setDeleteTarget(null)} style={S.btnOutline}>Cancel</button>
          <button onClick={doDelete} disabled={actionLoading} style={S.btn('#DC2626','#fff')}>{actionLoading ? 'Deleting…' : '🗑️ Permanently Delete'}</button>
        </div>
      </Modal>

      {/* Send Message */}
      <Modal open={!!messageTarget} onClose={() => setMessageTarget(null)} title={`Message: ${messageTarget?.fullName}`}>
        <form onSubmit={doMsg}>
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Type</label>
            <select value={msgForm.type} onChange={e => setMsgForm(f => ({...f,type:e.target.value}))} style={S.input}>
              <option value="ADMIN">Admin Message</option><option value="SECURITY">Security Alert</option><option value="ACCOUNT">Account Update</option><option value="PROMO">Promotional</option>
            </select>
          </div>
          <div style={{ marginBottom: 14 }}><label style={S.label}>Title *</label><input value={msgForm.title} onChange={e => setMsgForm(f => ({...f,title:e.target.value}))} style={S.input} required /></div>
          <div style={{ marginBottom: 20 }}><label style={S.label}>Message *</label><textarea value={msgForm.message} onChange={e => setMsgForm(f => ({...f,message:e.target.value}))} rows={4} style={{ ...S.input, resize: 'none' }} required /></div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setMessageTarget(null)} style={S.btnOutline}>Cancel</button>
            <button type="submit" disabled={actionLoading} style={S.btn('#4F46E5','#fff')}>{actionLoading ? 'Sending…' : '📨 Send Message'}</button>
          </div>
        </form>
      </Modal>

      {/* Permissions */}
      <Modal open={!!permTarget} onClose={() => setPermTarget(null)} title={`Permissions: ${permTarget?.fullName}`} wide>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[['canLogin','🔐 Login'],['canCheckout','🛒 Checkout'],['canPlaceOrders','📦 Orders'],['canCancelOrders','❌ Cancel Orders'],['canReturnProducts','↩️ Returns'],['canAddReviews','⭐ Reviews'],['canAddWishlist','💝 Wishlist'],['canUseCoupons','🎟️ Coupons'],['canUseWallet','💳 Wallet'],['canUseReferral','👥 Referral']].map(([k,l]) => (
            <div key={k} onClick={() => setPermForm(f => ({...f,[k]:!f[k]}))}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 10, border: permForm[k] ? '2px solid #059669' : '2px solid #FCA5A5', background: permForm[k] ? '#ECFDF5' : '#FEF2F2', cursor: 'pointer', transition: 'all .15s' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{l}</span>
              <div style={{ width: 40, height: 22, borderRadius: 11, background: permForm[k] ? '#059669' : '#D1D5DB', position: 'relative', transition: 'background .2s' }}>
                <div style={{ position: 'absolute', top: 3, left: permForm[k] ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => setPermTarget(null)} style={S.btnOutline}>Cancel</button>
          <button onClick={doPerms} disabled={actionLoading} style={S.btn('#4F46E5','#fff')}>{actionLoading ? 'Saving…' : 'Save Permissions'}</button>
        </div>
      </Modal>

      {/* Admin Notes */}
      <Modal open={!!notesTarget} onClose={() => setNotesTarget(null)} title={`Private Notes: ${notesTarget?.fullName}`}>
        <div style={S.alert('#FEF3C7','#FDE68A','#92400E')}>🔒 These notes are ONLY visible to admin staff. The customer will NEVER see them.</div>
        <textarea value={notesText} onChange={e => setNotesText(e.target.value)} rows={6} placeholder="VIP Customer, Fraud Alert, Call Before Delivery…" style={{ ...S.input, resize: 'none', marginBottom: 20 }} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => setNotesTarget(null)} style={S.btnOutline}>Cancel</button>
          <button onClick={doNotes} disabled={actionLoading} style={S.btn('#4F46E5','#fff')}>{actionLoading ? 'Saving…' : '💾 Save Notes'}</button>
        </div>
      </Modal>

      {/* Confirm Dialog */}
      {confirmDlg && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 380, width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,.25)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
              <div style={{ padding: 10, borderRadius: '50%', background: confirmDlg.danger !== false ? '#FEF2F2' : '#FEF3C7', flexShrink: 0 }}>
                <FiAlertTriangle style={{ width: 18, height: 18, color: confirmDlg.danger !== false ? '#DC2626' : '#D97706' }} />
              </div>
              <p style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>{confirmDlg.msg}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDlg(null)} style={{ ...S.btnOutline, flex: 1 }}>Cancel</button>
              <button onClick={async () => { try { await confirmDlg.fn(); } catch { toast.error('Action failed'); setConfirmDlg(null); } }}
                style={{ ...S.btn(confirmDlg.danger !== false ? '#DC2626' : '#4F46E5', '#fff'), flex: 1 }}>{confirmDlg.label}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ TABLE ROW ═══ */
function Row({ c, onView, onEdit, onPwd, onResetPwd, onBlock, onUnblock, onSuspend, onForceLogout, onDelete, onMsg, onPerms, onNotes }) {
  const [menu, setMenu] = useState(false);
  const td = { padding: '14px 16px', borderBottom: '1px solid #f7f7f7', verticalAlign: 'middle' };
  return (
    <tr style={{ transition: 'background .1s' }} onMouseEnter={e => e.currentTarget.style.background='#FAFAFE'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
      <td style={td}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar c={c} />
          <div>
            <p style={{ fontWeight: 700, color: '#111', fontSize: 13 }}>{c.fullName}</p>
            <p style={{ fontSize: 11, color: '#999' }}>{c.email}</p>
          </div>
        </div>
      </td>
      <td style={td}>
        <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#4F46E5', background: '#EEF2FF', padding: '3px 8px', borderRadius: 6 }}>{c.customerId || '—'}</span>
      </td>
      <td style={td}>
        <p style={{ fontSize: 12, color: '#555' }}>{c.phone || '—'}</p>
        {c.whatsappNumber && <p style={{ fontSize: 11, color: '#059669' }}>{c.whatsappNumber}</p>}
      </td>
      <td style={td}>
        <p style={{ fontWeight: 700, color: '#111', fontSize: 13 }}>{c.stats?.totalOrders || 0} orders</p>
        <p style={{ fontSize: 12, color: '#4F46E5', fontWeight: 600 }}>{fmtCur(c.stats?.totalSpent)}</p>
      </td>
      <td style={{ ...td, fontSize: 12, color: '#888' }}>{fmtDate(c.createdAt)}</td>
      <td style={{ ...td, fontSize: 12, color: '#888' }}>{fmtTime(c.lastLoginAt)}</td>
      <td style={td}><StatusBadge status={c.status} /></td>
      <td style={td}><VerifyBadge v={c.isVerified} /></td>
      <td style={{ ...td, textAlign: 'right' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
          <IconBtn icon={FiEye} color="#4F46E5" bg="#EEF2FF" onClick={onView} tip="View" />
          <IconBtn icon={FiEdit2} color="#2563EB" bg="#EFF6FF" onClick={onEdit} tip="Edit" />
          {c.status === 'BLOCKED' || c.status === 'SUSPENDED'
            ? <IconBtn icon={FiUnlock} color="#059669" bg="#ECFDF5" onClick={onUnblock} tip="Unblock" />
            : <IconBtn icon={FiLock} color="#DC2626" bg="#FEF2F2" onClick={onBlock} tip="Block" />
          }
          <div style={{ position: 'relative' }}>
            <IconBtn icon={FiMoreVertical} color="#666" bg="#F3F4F6" onClick={() => setMenu(m=>!m)} tip="More" />
            {menu && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setMenu(false)} />
                <div style={{ position: 'absolute', right: 0, top: 34, zIndex: 20, background: '#fff', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,.15)', border: '1px solid #eee', minWidth: 200, overflow: 'hidden' }}>
                  {[
                    { label: '🔑 Change Password', fn: onPwd },
                    { label: '🔄 Reset Password', fn: onResetPwd },
                    { label: '⏸️ Suspend Account', fn: onSuspend },
                    { label: '🚪 Force Logout', fn: onForceLogout },
                    { label: '📨 Send Message', fn: onMsg },
                    { label: '🔧 Permissions', fn: onPerms },
                    { label: '📝 Private Notes', fn: onNotes },
                    { label: '🗑️ Delete Account', fn: onDelete, danger: true },
                  ].map(x => (
                    <button key={x.label} onClick={() => { setMenu(false); x.fn(); }}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, color: x.danger ? '#DC2626' : '#333', fontWeight: x.danger ? 700 : 500, transition: 'background .1s' }}
                      onMouseEnter={e => e.target.style.background='#f7f7f7'} onMouseLeave={e => e.target.style.background='transparent'}>
                      {x.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

/* ═══ ICON BUTTON ═══ */
function IconBtn({ icon: Icon, color, bg, onClick, tip }) {
  return (
    <button onClick={onClick} title={tip}
      style={{ padding: 6, borderRadius: 8, border: 'none', background: bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity .15s' }}
      onMouseEnter={e => e.currentTarget.style.opacity='.8'} onMouseLeave={e => e.currentTarget.style.opacity='1'}>
      <Icon style={{ width: 15, height: 15, color }} />
    </button>
  );
}

/* ═══ GRID CARD ═══ */
function Card({ c, onView, onEdit, onBlock, onUnblock }) {
  const cardBtn = (label, color, bg, fn) => (
    <button onClick={fn} style={{ flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 700, borderRadius: 8, border: `1px solid ${color}22`, background: bg, color, cursor: 'pointer' }}>{label}</button>
  );
  return (
    <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,.04)', transition: 'box-shadow .15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.08)'} onMouseLeave={e => e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,.04)'}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <Avatar c={c} sz={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.fullName}</p>
          <p style={{ fontSize: 11, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</p>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#4F46E5', background: '#EEF2FF', padding: '2px 6px', borderRadius: 4, marginTop: 4, display: 'inline-block' }}>{c.customerId || '—'}</span>
        </div>
        <StatusBadge status={c.status} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: '#666', marginBottom: 14 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiShoppingBag style={{ width: 12, height: 12 }} />{c.stats?.totalOrders || 0} orders</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiDollarSign style={{ width: 12, height: 12 }} />{fmtCur(c.stats?.totalSpent)}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiCalendar style={{ width: 12, height: 12 }} />{fmtDate(c.createdAt)}</span>
        <VerifyBadge v={c.isVerified} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {cardBtn('View', '#4F46E5', '#EEF2FF', onView)}
        {cardBtn('Edit', '#555', '#F3F4F6', onEdit)}
        {c.status === 'BLOCKED' ? cardBtn('Unblock', '#059669', '#ECFDF5', onUnblock) : cardBtn('Block', '#DC2626', '#FEF2F2', onBlock)}
      </div>
    </div>
  );
}
