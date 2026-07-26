import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  FiShield, FiUserPlus, FiLock, FiCheck, FiX, FiRefreshCw,
  FiTrash2, FiKey, FiSlash, FiToggleLeft, FiToggleRight, FiUsers
} from 'react-icons/fi';
import api from '../../config/api';
import { formatDate } from '../../utils/formatDate';

const ADMIN_ROLES = [
  { id: 'SUPER_ADMIN', name: 'Super Admin', desc: 'Full unrestricted access to all modules and security settings' },
  { id: 'PRODUCT_MANAGER', name: 'Product Manager', desc: 'Can create, edit, & delete products, categories, & subcategories' },
  { id: 'ORDER_MANAGER', name: 'Order Manager', desc: 'Can process orders, update shipping status, & manage returns' },
  { id: 'CUSTOMER_MANAGER', name: 'Customer Manager', desc: 'Can view 360 customer profile, edit details, & block/unblock' },
  { id: 'INVENTORY_MANAGER', name: 'Inventory Manager', desc: 'Can update stock levels, prices, & warehouse alerts' },
  { id: 'MARKETING_MANAGER', name: 'Marketing Manager', desc: 'Can manage coupons, banners, special deals, & promo emails' },
  { id: 'SUPPORT_MANAGER', name: 'Support Manager', desc: 'Can manage customer support tickets & WhatsApp inquiries' },
];

const AdminTeam = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    adminRole: 'PRODUCT_MANAGER',
    permissions: {
      canManageProducts: true,
      canManageOrders: true,
      canManageCustomers: false,
      canManageCoupons: true,
      canManageCMS: false,
      canManageAdmins: false,
      canManageSettings: false
    }
  });

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/customers?role=ADMIN');
      setAdmins(res.data.data?.customers || []);
    } catch {
      toast.error('Failed to load admin team list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.post('/admin/auth/create-admin', form);
      toast.success(`Admin account "${form.fullName}" created successfully!`);
      setModalOpen(false);
      setForm({
        fullName: '', email: '', password: '', adminRole: 'PRODUCT_MANAGER',
        permissions: {
          canManageProducts: true, canManageOrders: true, canManageCustomers: false,
          canManageCoupons: true, canManageCMS: false, canManageAdmins: false, canManageSettings: false
        }
      });
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Create admin failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Admin Team & Permission Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Super Admin control center for managing admin roles & permission switches</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <FiUserPlus size={16} /> Create New Admin Account
        </button>
      </div>

      {/* Admin Roles Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ADMIN_ROLES.slice(0, 3).map(role => (
          <div key={role.id} className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 uppercase">
              {role.name}
            </span>
            <p className="text-xs text-gray-600 font-medium pt-1">{role.desc}</p>
          </div>
        ))}
      </div>

      {/* Admins Table */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 font-semibold bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <FiRefreshCw className="animate-spin w-8 h-8 mx-auto text-amber-500 mb-3" />
          Loading admin team directory...
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-extrabold">
              <tr>
                <th className="p-4">Administrator</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Account Status</th>
                <th className="p-4">2FA Security</th>
                <th className="p-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {admins.map(a => (
                <tr key={a.id} className="hover:bg-amber-50/30 transition">
                  <td className="p-4 flex items-center gap-3">
                    <img
                      src={a.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.fullName)}&size=80&background=D4AF37&color=fff`}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover border border-amber-300 shrink-0"
                    />
                    <div>
                      <p className="font-bold text-gray-900">{a.fullName}</p>
                      <p className="text-gray-500 text-[11px]">{a.email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-black shadow-sm uppercase">
                      {a.adminRole || a.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      a.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      ✓ Email OTP 2FA Enabled
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{formatDate(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Admin Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <FiUserPlus className="text-amber-500" /> Create New Admin Account
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  placeholder="e.g. Alex Morgan"
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Admin Email Address *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="alex@styleverse.com"
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Assigned Admin Role *</label>
                <select
                  value={form.adminRole}
                  onChange={e => setForm({ ...form, adminRole: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-white font-bold"
                >
                  {ADMIN_ROLES.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border text-gray-600 font-semibold hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-md cursor-pointer"
                >
                  {actionLoading ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeam;
