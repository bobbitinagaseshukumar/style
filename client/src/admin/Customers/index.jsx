import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  FiUser, FiMail, FiPhone, FiSearch, FiFilter, FiRefreshCw, FiPlus,
  FiEdit, FiLock, FiUnlock, FiKey, FiSlash, FiTrash2, FiEye, FiCheck,
  FiX, FiGrid, FiList, FiAlertTriangle, FiCheckCircle, FiShield,
  FiShoppingBag, FiDollarSign, FiClock, FiLogOut, FiSend, FiXCircle
} from 'react-icons/fi';
import api from '../../config/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import CustomerProfile from './CustomerProfile';

const AdminCustomers = () => {
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  // Listing state
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'BLOCKED' | 'SUSPENDED' | 'INACTIVE'
  const [presetFilter, setPresetFilter] = useState(''); // '' | 'NEW_CUSTOMERS' | 'PENDING_VERIFICATION' | 'WITH_ORDERS' | 'WITHOUT_ORDERS'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [page, setPage] = useState(1);

  // Active Modals state
  const [editCustomer, setEditCustomer] = useState(null);
  const [passwordCustomer, setPasswordCustomer] = useState(null);
  const [resetCustomer, setResetCustomer] = useState(null);
  const [blockCustomerTarget, setBlockCustomerTarget] = useState(null);
  const [suspendCustomerTarget, setSuspendCustomerTarget] = useState(null);
  const [deleteCustomerTarget, setDeleteCustomerTarget] = useState(null);

  // Modal form states
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', fullName: '', username: '', email: '', phone: '',
    alternatePhone: '', whatsappNumber: '', gender: 'MALE', dob: '', avatar: ''
  });

  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [blockForm, setBlockForm] = useState({ reason: 'Policy Violation', notes: '' });
  const [suspendForm, setSuspendForm] = useState({ durationDays: '7', customDate: '', reason: 'Temporary Suspension' });
  const [deleteOptions, setDeleteOptions] = useState({
    deleteAccountOnly: false, deleteWishlist: true, deleteAddresses: true,
    deleteReviews: true, deleteMessages: true, deleteAll: true
  });
  const [resetChannel, setResetChannel] = useState('EMAIL');

  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Customers List
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
      toast.error('Failed to load customers list');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, presetFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Open Edit Modal
  const openEdit = (customer) => {
    setEditCustomer(customer);
    setEditForm({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      fullName: customer.fullName || '',
      username: customer.username || '',
      email: customer.email || '',
      phone: customer.phone || '',
      alternatePhone: customer.alternatePhone || '',
      whatsappNumber: customer.whatsappNumber || '',
      gender: customer.gender || 'MALE',
      dob: customer.dob ? customer.dob.split('T')[0] : '',
      avatar: customer.avatar || ''
    });
  };

  // Submit Edit Form
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.put(`/admin/customers/${editCustomer.id}`, editForm);
      toast.success(`Customer "${editForm.fullName}" updated successfully!`);
      setEditCustomer(null);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Password Change Form
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setActionLoading(true);
      await api.post(`/admin/customers/${passwordCustomer.id}/change-password`, passwordForm);
      toast.success('Password changed! Customer has been logged out from all devices.');
      setPasswordCustomer(null);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Password Reset Request
  const handleSendReset = async () => {
    try {
      setActionLoading(true);
      const res = await api.post(`/admin/customers/${resetCustomer.id}/reset-password`, { channel: resetChannel });
      toast.success(res.data.message || 'Password reset link sent!');
      setResetCustomer(null);
      fetchCustomers();
    } catch (err) {
      toast.error('Password reset failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Block Customer
  const handleConfirmBlock = async () => {
    try {
      setActionLoading(true);
      await api.post(`/admin/customers/${blockCustomerTarget.id}/block`, blockForm);
      toast.success(`Customer "${blockCustomerTarget.fullName}" blocked successfully!`);
      setBlockCustomerTarget(null);
      fetchCustomers();
    } catch (err) {
      toast.error('Block customer failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Unblock Customer
  const handleUnblock = async (customer) => {
    try {
      setActionLoading(true);
      await api.post(`/admin/customers/${customer.id}/unblock`);
      toast.success(`Customer "${customer.fullName}" unblocked!`);
      fetchCustomers();
    } catch (err) {
      toast.error('Unblock failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Suspend Customer
  const handleConfirmSuspend = async () => {
    try {
      setActionLoading(true);
      await api.post(`/admin/customers/${suspendCustomerTarget.id}/suspend`, suspendForm);
      toast.success(`Customer suspended successfully!`);
      setSuspendCustomerTarget(null);
      fetchCustomers();
    } catch (err) {
      toast.error('Suspend failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Toggle Status (Activate / Deactivate)
  const handleToggleStatus = async (customer) => {
    try {
      setActionLoading(true);
      const newStatus = customer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.put(`/admin/customers/${customer.id}/status`, { status: newStatus });
      toast.success(`Customer status set to ${newStatus}`);
      fetchCustomers();
    } catch {
      toast.error('Status update failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Delete Customer
  const handleConfirmDelete = async () => {
    try {
      setActionLoading(true);
      await api.delete(`/admin/customers/${deleteCustomerTarget.id}`, { data: deleteOptions });
      toast.success('Customer account deleted permanently.');
      setDeleteCustomerTarget(null);
      fetchCustomers();
    } catch (err) {
      toast.error('Delete failed');
    } finally {
      setActionLoading(false);
    }
  };

  // If viewing 360 customer profile
  if (selectedCustomerId) {
    return (
      <CustomerProfile
        customerId={selectedCustomerId}
        onBack={() => setSelectedCustomerId(null)}
        onRefreshList={fetchCustomers}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Top Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Customer Management Center</h1>
          <p className="text-xs text-gray-500 mt-0.5">Shopify & Amazon Seller Hub style customer account control & insights</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCustomers}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition cursor-pointer"
            title="Refresh List"
          >
            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Statistics Banner Cards ─────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Registered', count: summary.totalCustomers || 0, color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { label: 'Active Customers', count: summary.activeCustomers || 0, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Blocked Accounts', count: summary.blockedCustomers || 0, color: 'text-red-600 bg-red-50 border-red-100' },
          { label: 'Suspended Accounts', count: summary.suspendedCustomers || 0, color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { label: 'Unverified', count: summary.unverifiedCustomers || 0, color: 'text-purple-600 bg-purple-50 border-purple-100' },
          { label: 'Total Revenue', count: formatCurrency(summary.totalCustomerRevenue || 0), color: 'text-amber-600 bg-amber-50 border-amber-200 font-mono' },
        ].map(item => (
          <div key={item.label} className={`p-4 rounded-2xl border shadow-sm ${item.color}`}>
            <p className="text-xl font-black">{item.count}</p>
            <p className="text-[11px] font-bold opacity-80 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* ── Search & Filters Control Bar ───────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by Customer Name, Customer ID, Email, or Phone Number..."
              className="w-full pl-9 pr-4 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                <FiX size={14} />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full sm:w-44 p-2.5 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">All Account Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="BLOCKED">BLOCKED</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center gap-1 border border-gray-200 rounded-xl p-1 bg-gray-50 self-end sm:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${viewMode === 'table' ? 'bg-white shadow-sm font-bold text-black' : 'text-gray-400'}`}
              title="Table View"
            >
              <FiList size={16} />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${viewMode === 'cards' ? 'bg-white shadow-sm font-bold text-black' : 'text-gray-400'}`}
              title="Card Grid View"
            >
              <FiGrid size={16} />
            </button>
          </div>
        </div>

        {/* Preset Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: '', label: 'All Customers' },
            { id: 'NEW_CUSTOMERS', label: '🆕 New This Week' },
            { id: 'PENDING_VERIFICATION', label: '⚠️ Pending Verification' },
            { id: 'WITH_ORDERS', label: '📦 Customers With Orders' },
            { id: 'WITHOUT_ORDERS', label: '👤 Customers Without Orders' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => { setPresetFilter(p.id); setPage(1); }}
              className={`px-3 py-1.5 rounded-full font-bold cursor-pointer transition whitespace-nowrap ${
                presetFilter === p.id ? 'bg-amber-500 text-black shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Customers List Content ─────────────────────────── */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 font-semibold bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <FiRefreshCw className="animate-spin w-8 h-8 mx-auto text-amber-500 mb-3" />
          Loading customers directory...
        </div>
      ) : customers.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-gray-100 p-8">
          <FiUser size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="font-bold text-gray-700">No customers found</p>
          <p className="text-xs text-gray-400 mt-1">Try clearing filters or searching with a different keyword.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-extrabold">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Contact Information</th>
                <th className="p-4">Registration</th>
                <th className="p-4">Orders & Revenue</th>
                <th className="p-4">Status & Verification</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map(c => {
                const statusBadge =
                  c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                  c.status === 'BLOCKED' ? 'bg-red-100 text-red-800' :
                  c.status === 'SUSPENDED' ? 'bg-amber-100 text-amber-800' :
                  'bg-gray-100 text-gray-800';

                return (
                  <tr key={c.id} className="hover:bg-amber-50/30 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={c.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.fullName)}&size=80&background=D4AF37&color=fff`}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover border border-amber-300 shrink-0"
                        />
                        <div>
                          <button
                            onClick={() => setSelectedCustomerId(c.id)}
                            className="font-bold text-gray-900 hover:text-amber-600 text-sm transition text-left cursor-pointer"
                          >
                            {c.fullName}
                          </button>
                          <p className="text-[10px] text-gray-400 font-mono">ID: {c.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 space-y-0.5">
                      <p className="font-semibold text-gray-800">{c.email}</p>
                      <p className="text-gray-500 font-mono">{c.phone || 'No phone'}</p>
                    </td>

                    <td className="p-4 space-y-0.5">
                      <p className="text-gray-700 font-semibold">{formatDate(c.createdAt)}</p>
                      <p className="text-[10px] text-gray-400">Last login: {c.lastLoginAt ? formatDate(c.lastLoginAt) : 'Never'}</p>
                    </td>

                    <td className="p-4 space-y-0.5">
                      <p className="font-black text-gray-900">{formatCurrency(c.stats?.totalSpent || 0)}</p>
                      <p className="text-[11px] text-amber-600 font-bold">{c.stats?.totalOrders || 0} order(s)</p>
                    </td>

                    <td className="p-4 space-y-1">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${statusBadge}`}>
                        {c.status}
                      </span>
                      <div>
                        {c.isVerified ? (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            <FiCheck size={12} /> Verified
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600">Pending OTP</span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedCustomerId(c.id)}
                          className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                          title="View 360° Profile"
                        >
                          <FiEye size={15} />
                        </button>
                        <button
                          onClick={() => openEdit(c)}
                          className="p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition cursor-pointer"
                          title="Edit Customer Details"
                        >
                          <FiEdit size={15} />
                        </button>
                        <button
                          onClick={() => setPasswordCustomer(c)}
                          className="p-2 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition cursor-pointer"
                          title="Change Password"
                        >
                          <FiKey size={15} />
                        </button>
                        {c.status === 'BLOCKED' ? (
                          <button
                            onClick={() => handleUnblock(c)}
                            className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition cursor-pointer"
                            title="Unblock Account"
                          >
                            <FiUnlock size={15} />
                          </button>
                        ) : (
                          <button
                            onClick={() => setBlockCustomerTarget(c)}
                            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer"
                            title="Block Customer"
                          >
                            <FiSlash size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteCustomerTarget(c)}
                          className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-red-600 hover:text-white transition cursor-pointer"
                          title="Delete Customer Account"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map(c => (
            <div key={c.id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={c.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.fullName)}&size=100&background=D4AF37&color=fff`}
                  alt=""
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shrink-0"
                />
                <div>
                  <button onClick={() => setSelectedCustomerId(c.id)} className="font-bold text-gray-900 hover:text-amber-600 text-sm transition text-left cursor-pointer">
                    {c.fullName}
                  </button>
                  <p className="text-xs text-gray-500 truncate">{c.email}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {c.id.substring(0, 8)}...</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-2xl">
                <div>
                  <p className="text-gray-400 font-semibold text-[10px]">Total Orders</p>
                  <p className="font-bold text-gray-900">{c.stats?.totalOrders || 0}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-semibold text-[10px]">Total Spent</p>
                  <p className="font-black text-amber-600">{formatCurrency(c.stats?.totalSpent || 0)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button
                  onClick={() => setSelectedCustomerId(c.id)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  View Profile
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(c)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition" title="Edit">
                    <FiEdit size={14} />
                  </button>
                  <button onClick={() => setPasswordCustomer(c)} className="p-2 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition" title="Password">
                    <FiKey size={14} />
                  </button>
                  {c.status === 'BLOCKED' ? (
                    <button onClick={() => handleUnblock(c)} className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition" title="Unblock">
                      <FiUnlock size={14} />
                    </button>
                  ) : (
                    <button onClick={() => setBlockCustomerTarget(c)} className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition" title="Block">
                      <FiSlash size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────── */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-xs font-semibold text-gray-600">
          <span>Showing page {pagination.page} of {pagination.pages} ({pagination.total} total customers)</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(prev => Math.min(prev + 1, pagination.pages))}
              disabled={page === pagination.pages}
              className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/*   MODAL 1: EDIT CUSTOMER DETAILS                        */}
      {/* ═══════════════════════════════════════════════════════ */}
      {editCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <FiEdit className="text-amber-500" /> Edit Customer Profile
              </h3>
              <button onClick={() => setEditCustomer(null)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full p-2.5 border rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Alternate Phone</label>
                  <input
                    type="text"
                    value={editForm.alternatePhone}
                    onChange={e => setEditForm({ ...editForm, alternatePhone: e.target.value })}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-white"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editForm.dob}
                    onChange={e => setEditForm({ ...editForm, dob: e.target.value })}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Profile Photo URL</label>
                <input
                  type="text"
                  value={editForm.avatar}
                  onChange={e => setEditForm({ ...editForm, avatar: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditCustomer(null)}
                  className="flex-1 py-2.5 rounded-xl border text-gray-600 font-semibold hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-md cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/*   MODAL 2: CHANGE PASSWORD                              */}
      {/* ═══════════════════════════════════════════════════════ */}
      {passwordCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <FiKey className="text-amber-500" /> Change Customer Password
              </h3>
              <button onClick={() => setPasswordCustomer(null)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100">
                <FiX size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
              Changing password for <strong>&quot;{passwordCustomer.fullName}&quot;</strong> will automatically terminate all active sessions across all devices.
            </p>

            <form onSubmit={handleSavePassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                  placeholder="Re-enter new password"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-xl space-y-1 text-[11px] text-gray-500">
                <p className="font-bold text-gray-700 mb-1">Password Requirements:</p>
                <p className={passwordForm.newPassword.length >= 6 ? 'text-emerald-600 font-bold' : ''}>• Minimum 6 characters</p>
                <p className={/[A-Z]/.test(passwordForm.newPassword) ? 'text-emerald-600 font-bold' : ''}>• Includes Uppercase letter</p>
                <p className={/[a-z]/.test(passwordForm.newPassword) ? 'text-emerald-600 font-bold' : ''}>• Includes Lowercase letter</p>
                <p className={/[0-9]/.test(passwordForm.newPassword) ? 'text-emerald-600 font-bold' : ''}>• Includes Number</p>
                <p className={/[^A-Za-z0-9]/.test(passwordForm.newPassword) ? 'text-emerald-600 font-bold' : ''}>• Includes Special character (!@#$%^&*)</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordCustomer(null)}
                  className="flex-1 py-2.5 rounded-xl border text-gray-600 font-semibold hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md cursor-pointer"
                >
                  {actionLoading ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/*   MODAL 3: BLOCK CUSTOMER                               */}
      {/* ═══════════════════════════════════════════════════════ */}
      {blockCustomerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                <FiSlash className="text-red-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Block Customer Account</h3>
                <p className="text-xs text-gray-500">Specify reason & confirm block</p>
              </div>
            </div>

            <p className="text-xs text-gray-700 bg-red-50 p-3 rounded-xl border border-red-100">
              Blocking <strong>&quot;{blockCustomerTarget.fullName}&quot;</strong> will instantly terminate all active sessions, disable login, prevent checkout, and block cart & wishlist access.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Reason for Blocking *</label>
                <select
                  value={blockForm.reason}
                  onChange={e => setBlockForm({ ...blockForm, reason: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-white font-bold"
                >
                  <option value="Fake Orders">Fake Orders / Payment Fraud</option>
                  <option value="Fraud">Fraudulent Activity</option>
                  <option value="Abuse">Customer Service Abuse</option>
                  <option value="Policy Violation">Policy Violation</option>
                  <option value="Spam">Spam Reviews / Messages</option>
                  <option value="Other">Other Reason</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Optional Notes</label>
                <textarea
                  rows={3}
                  value={blockForm.notes}
                  onChange={e => setBlockForm({ ...blockForm, notes: e.target.value })}
                  placeholder="Add internal admin notes explaining this action..."
                  className="w-full p-2 border rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setBlockCustomerTarget(null)}
                className="flex-1 py-2.5 rounded-xl border text-gray-600 font-semibold hover:bg-gray-100 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBlock}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md text-xs cursor-pointer"
              >
                {actionLoading ? 'Blocking...' : 'Confirm Block'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/*   MODAL 4: DELETE CUSTOMER CASCADING OPTIONS            */}
      {/* ═══════════════════════════════════════════════════════ */}
      {deleteCustomerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                <FiTrash2 className="text-red-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Delete Customer Account</h3>
                <p className="text-xs text-gray-500">Select cascading deletion options</p>
              </div>
            </div>

            <p className="text-xs text-red-900 bg-red-50 p-3.5 rounded-2xl border border-red-200">
              ⚠️ Permanent action! Are you sure you want to delete customer <strong>&quot;{deleteCustomerTarget.fullName}&quot;</strong>?
            </p>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteOptions.deleteWishlist}
                  onChange={e => setDeleteOptions({ ...deleteOptions, deleteWishlist: e.target.checked })}
                  className="rounded text-amber-500"
                />
                <span className="font-bold text-gray-800">Delete Wishlist Items</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteOptions.deleteAddresses}
                  onChange={e => setDeleteOptions({ ...deleteOptions, deleteAddresses: e.target.checked })}
                  className="rounded text-amber-500"
                />
                <span className="font-bold text-gray-800">Delete Saved Addresses</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteOptions.deleteReviews}
                  onChange={e => setDeleteOptions({ ...deleteOptions, deleteReviews: e.target.checked })}
                  className="rounded text-amber-500"
                />
                <span className="font-bold text-gray-800">Delete Submitted Reviews & Ratings</span>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteCustomerTarget(null)}
                className="flex-1 py-2.5 rounded-xl border text-gray-600 font-semibold hover:bg-gray-100 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md text-xs cursor-pointer"
              >
                {actionLoading ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
