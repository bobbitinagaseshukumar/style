import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  FiUser, FiMail, FiPhone, FiCalendar, FiMapPin, FiShoppingBag,
  FiClock, FiShield, FiLock, FiUnlock, FiKey, FiLogOut, FiSlash,
  FiTrash2, FiEdit, FiCheck, FiX, FiRefreshCw, FiHeart, FiStar,
  FiMessageSquare, FiActivity, FiLayers, FiDollarSign, FiToggleLeft, FiToggleRight, FiChevronLeft
} from 'react-icons/fi';
import api from '../../config/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

const CustomerProfile = ({ customerId, onBack, onRefreshList }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'orders' | 'addresses' | 'wishlist' | 'logs'
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/customers/${customerId}`);
      setData(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) fetchProfile();
  }, [customerId]);

  const handleTogglePermission = async (key, currentValue) => {
    try {
      setActionLoading(true);
      const payload = { [key]: !currentValue };
      await api.put(`/admin/customers/${customerId}/permissions`, payload);
      toast.success(`Permission "${key}" updated successfully!`);
      fetchProfile();
      onRefreshList?.();
    } catch {
      toast.error('Failed to update permission');
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceLogout = async () => {
    if (!window.confirm('Force logout this customer from all active devices?')) return;
    try {
      setActionLoading(true);
      await api.post(`/admin/customers/${customerId}/force-logout`);
      toast.success('Customer forcibly logged out from all devices!');
      fetchProfile();
    } catch {
      toast.error('Force logout failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-400 font-semibold bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <FiRefreshCw className="animate-spin w-8 h-8 mx-auto text-amber-500 mb-3" />
        Loading customer profile...
      </div>
    );
  }

  if (!data) return null;

  const metrics = data.metrics || {};
  const statusColor =
    data.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
    data.status === 'BLOCKED' ? 'bg-red-100 text-red-800 border-red-200' :
    data.status === 'SUSPENDED' ? 'bg-amber-100 text-amber-800 border-amber-200' :
    'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <div className="space-y-6">
      {/* ── Back Header ────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-black bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm transition cursor-pointer"
        >
          <FiChevronLeft size={16} /> Back to Customers List
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchProfile}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition cursor-pointer"
            title="Refresh Profile"
          >
            <FiRefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ── Profile Main Card Header ───────────────────────── */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName)}&size=150&background=D4AF37&color=fff`}
                alt={data.fullName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
              />
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${data.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-gray-900">{data.fullName}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${statusColor}`}>
                  {data.status}
                </span>
                {data.isVerified ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1">
                    <FiCheck size={12} /> Verified Customer
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                    Unverified
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
                <span>ID: <strong className="text-gray-800 font-mono">{data.id.substring(0, 13)}...</strong></span>
                <span>• Username: <strong>@{data.username || data.email.split('@')[0]}</strong></span>
                <span>• Joined: <strong>{formatDate(data.createdAt)}</strong></span>
              </p>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleForceLogout}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition flex items-center gap-1.5 cursor-pointer"
            >
              <FiLogOut className="text-amber-600" /> Force Logout
            </button>
          </div>
        </div>

        {/* ── Key Statistics Row ─────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-6 pt-6 border-t border-gray-100">
          {[
            { label: 'Total Orders', value: metrics.totalOrders, color: 'text-blue-600 bg-blue-50 border-blue-100' },
            { label: 'Total Spent', value: formatCurrency(metrics.totalAmountSpent || 0), color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
            { label: 'Delivered', value: metrics.deliveredOrders, color: 'text-teal-600 bg-teal-50 border-teal-100' },
            { label: 'Pending', value: metrics.pendingOrders, color: 'text-amber-600 bg-amber-50 border-amber-100' },
            { label: 'Cancelled', value: metrics.cancelledOrders, color: 'text-red-600 bg-red-50 border-red-100' },
            { label: 'Returned', value: metrics.returnedOrders, color: 'text-purple-600 bg-purple-50 border-purple-100' },
            { label: 'Wishlist Items', value: metrics.wishlistCount, color: 'text-pink-600 bg-pink-50 border-pink-100' },
            { label: 'Saved Addresses', value: metrics.addressCount, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
          ].map(stat => (
            <div key={stat.label} className={`p-3 rounded-2xl border text-center ${stat.color}`}>
              <p className="text-lg font-black">{stat.value}</p>
              <p className="text-[10px] font-bold opacity-80 mt-0.5 truncate">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Profile Tabs Navigation ────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: '👤 Account Overview & Details', icon: FiUser },
          { id: 'orders', label: `📦 Order History (${metrics.totalOrders})`, icon: FiShoppingBag },
          { id: 'addresses', label: `📍 Saved Addresses (${metrics.addressCount})`, icon: FiMapPin },
          { id: 'wishlist', label: `❤️ Wishlist (${metrics.wishlistCount})`, icon: FiHeart },
          { id: 'logs', label: '📜 Activity & Audit Logs', icon: FiActivity },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border-b-2 ${
              activeTab === tab.id
                ? 'border-amber-500 text-amber-600 bg-amber-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Overview & Details ──────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Info Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
              <FiUser className="text-amber-500" /> Personal Contact Info
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 font-semibold">Full Name</span>
                <span className="font-bold text-gray-900">{data.fullName}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 font-semibold">Username</span>
                <span className="font-bold text-gray-900">@{data.username || 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 font-semibold">Email Address</span>
                <span className="font-bold text-gray-900">{data.email}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 font-semibold">Mobile Phone</span>
                <span className="font-bold text-gray-900">{data.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 font-semibold">Alternate Phone</span>
                <span className="font-bold text-gray-900">{data.alternatePhone || 'Not provided'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 font-semibold">Gender</span>
                <span className="font-bold text-gray-900">{data.gender || 'Not specified'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 font-semibold">Date of Birth</span>
                <span className="font-bold text-gray-900">{data.dob ? formatDate(data.dob) : 'Not specified'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 font-semibold">Last Login</span>
                <span className="font-bold text-gray-900">{data.lastLoginAt ? formatDate(data.lastLoginAt) : 'Never logged in'}</span>
              </div>
            </div>
          </div>

          {/* Account Status & Security Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
              <FiShield className="text-amber-500" /> Account Security & Status
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 font-semibold">Account Status</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border uppercase ${statusColor}`}>{data.status}</span>
              </div>
              {data.status === 'BLOCKED' && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-900 space-y-1">
                  <p className="font-bold text-xs">Reason: {data.blockReason || 'Policy Violation'}</p>
                  {data.blockNotes && <p className="text-[11px] opacity-80">{data.blockNotes}</p>}
                </div>
              )}
              {data.status === 'SUSPENDED' && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-900 space-y-1">
                  <p className="font-bold text-xs">Suspended Until: {data.suspendedUntil ? formatDate(data.suspendedUntil) : 'N/A'}</p>
                  {data.blockReason && <p className="text-[11px] opacity-80">Reason: {data.blockReason}</p>}
                </div>
              )}
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 font-semibold">Token Version</span>
                <span className="font-bold font-mono text-gray-900">v{data.tokenVersion || 0}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 font-semibold">Email Verified</span>
                <span className={`font-bold ${data.isVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {data.isVerified ? '✓ Yes' : '✗ Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Fine-Grained Permissions Control Matrix */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
              <FiLock className="text-amber-500" /> Customer Permission Switches
            </h3>
            <p className="text-xs text-gray-400">Toggle individual account permissions for this customer:</p>

            <div className="space-y-2.5 text-xs">
              {[
                { key: 'canLogin', label: 'Allow Account Login', desc: 'Customer can log in to website' },
                { key: 'canPlaceOrders', label: 'Allow Placing Orders', desc: 'Customer can checkout & buy' },
                { key: 'canCancelOrders', label: 'Allow Cancelling Orders', desc: 'Customer can cancel pending orders' },
                { key: 'canReturnProducts', label: 'Allow Product Returns', desc: 'Customer can request returns' },
                { key: 'canAddReviews', label: 'Allow Writing Reviews', desc: 'Customer can submit ratings' },
                { key: 'canAddWishlist', label: 'Allow Wishlist', desc: 'Customer can save items' },
                { key: 'canUseCoupons', label: 'Allow Coupon Usage', desc: 'Customer can redeem discounts' },
                { key: 'promoNotifications', label: 'Promotional Emails', desc: 'Receive marketing emails' },
              ].map(perm => {
                const isEnabled = data[perm.key] !== false;
                return (
                  <div key={perm.key} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition">
                    <div>
                      <p className="font-bold text-gray-900">{perm.label}</p>
                      <p className="text-[10px] text-gray-400">{perm.desc}</p>
                    </div>
                    <button
                      onClick={() => handleTogglePermission(perm.key, isEnabled)}
                      disabled={actionLoading}
                      className={`p-1.5 rounded-lg transition cursor-pointer text-base ${isEnabled ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400 bg-gray-100'}`}
                    >
                      {isEnabled ? <FiToggleRight size={22} /> : <FiToggleLeft size={22} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Order History ───────────────────────────── */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <FiShoppingBag className="text-amber-500" /> Complete Order History ({data.orders.length})
          </h3>

          {data.orders.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center">No orders placed by this customer yet.</p>
          ) : (
            <div className="space-y-3">
              {data.orders.map(order => (
                <div key={order.id} className="p-4 rounded-2xl border border-gray-100 hover:border-amber-200 transition bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold font-mono text-gray-900">#{order.orderNumber || order.id.substring(0, 8)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-gray-500">{formatDate(order.createdAt)} • {order.items?.length || 0} item(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm text-gray-900">{formatCurrency(order.totalAmount || 0)}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">{order.paymentMethod || 'COD'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Saved Addresses ─────────────────────────── */}
      {activeTab === 'addresses' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <FiMapPin className="text-amber-500" /> Saved Shipping & Billing Addresses ({data.addresses.length})
          </h3>

          {data.addresses.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center">No addresses saved by customer.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {data.addresses.map(addr => (
                <div key={addr.id} className={`p-4 rounded-2xl border ${addr.isDefault ? 'border-amber-400 bg-amber-50/20' : 'border-gray-100 bg-white'}`}>
                  {addr.isDefault && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black mb-2 inline-block">
                      Default Shipping Address
                    </span>
                  )}
                  <p className="font-bold text-gray-900 text-sm mb-1">{addr.name}</p>
                  <p className="text-gray-600">{addr.street}</p>
                  <p className="text-gray-600">{addr.city}, {addr.state} - {addr.pinCode}</p>
                  <p className="text-gray-600">{addr.country || 'India'}</p>
                  <p className="text-gray-500 mt-2 font-mono">📞 {addr.phone}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 4: Wishlist & Recently Viewed ──────────────── */}
      {activeTab === 'wishlist' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <FiHeart className="text-pink-500" /> Saved Wishlist Items ({data.wishlist?.items?.length || 0})
            </h3>
            {(!data.wishlist?.items || data.wishlist.items.length === 0) ? (
              <p className="text-xs text-gray-400 py-6 text-center">Wishlist is empty.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                {data.wishlist.items.map(item => (
                  <div key={item.id} className="p-3 rounded-2xl border border-gray-100 bg-gray-50/50 text-center">
                    <img
                      src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/150'}
                      alt=""
                      className="w-full h-28 object-cover rounded-xl mb-2"
                    />
                    <p className="font-bold text-gray-900 truncate">{item.product?.name}</p>
                    <p className="text-amber-600 font-black mt-0.5">{formatCurrency(item.product?.price || 0)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 5: Activity & Audit Logs ───────────────────── */}
      {activeTab === 'logs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Activity Log */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <FiActivity className="text-amber-500" /> Customer Activity Log ({data.activityLogs.length})
            </h3>
            {data.activityLogs.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No customer activity recorded.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1 text-xs">
                {data.activityLogs.map(log => (
                  <div key={log.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-900">{log.action}</span>
                      <span className="text-[10px] text-gray-400">{formatDate(log.createdAt)}</span>
                    </div>
                    {log.details && <p className="text-gray-600 text-[11px]">{log.details}</p>}
                    {log.ipAddress && <p className="text-gray-400 text-[10px] mt-0.5">IP: {log.ipAddress}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admin Audit Trail */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <FiShield className="text-amber-500" /> Admin Audit Log ({data.adminActionLogs.length})
            </h3>
            {data.adminActionLogs.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No admin actions performed on this account.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1 text-xs">
                {data.adminActionLogs.map(log => (
                  <div key={log.id} className="p-3 rounded-xl border border-amber-100 bg-amber-50/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-amber-900">{log.action}</span>
                      <span className="text-[10px] text-gray-500">{formatDate(log.createdAt)}</span>
                    </div>
                    <p className="text-gray-700 text-[11px]">By: <strong>{log.adminName}</strong></p>
                    {log.reason && <p className="text-gray-600 text-[11px]">Reason: {log.reason}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProfile;
