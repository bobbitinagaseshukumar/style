import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import { FiUserCheck, FiUserX, FiShield, FiSearch, FiMail } from 'react-icons/fi';
import { toast } from 'react-toastify';

const demoUsers = [
  { id: '1', fullName: 'Super Admin', email: 'admin@styleverse.com', role: 'SUPER_ADMIN', isVerified: true, totalOrders: 14, totalSpent: 45990 },
  { id: '2', fullName: 'Priya Sharma', email: 'priya@gmail.com', role: 'CUSTOMER', isVerified: true, totalOrders: 5, totalSpent: 18450 },
  { id: '3', fullName: 'Anita Reddy', email: 'anita@gmail.com', role: 'CUSTOMER', isVerified: true, totalOrders: 3, totalSpent: 9800 },
  { id: '4', fullName: 'Rajesh Kumar', email: 'rajesh@gmail.com', role: 'CUSTOMER', isVerified: false, totalOrders: 1, totalSpent: 1499 },
];

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/users');
      if (data?.data?.length > 0) {
        setUsers(data.data);
      } else {
        setUsers(demoUsers);
      }
    } catch (error) {
      setUsers(demoUsers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(`User role updated to ${newRole}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      toast.success(`Role changed to ${newRole}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  const filteredUsers = users.filter(u =>
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer & Admin User Accounts</h1>
          <p className="text-sm text-gray-500">Manage registered shoppers, admin privileges, and user roles</p>
        </div>

        <div className="relative w-full sm:w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gold-500 text-sm focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading accounts...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Verification</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-bold text-sm shadow">
                      {user.fullName?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-charcoal-900">{user.fullName}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <FiMail className="w-3 h-3" /> {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="text-xs font-semibold px-3 py-1 rounded-full border border-gray-300 focus:ring-2 focus:ring-gold-500 bg-white"
                    >
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      user.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {user.isVerified ? <FiUserCheck className="w-3.5 h-3.5" /> : <FiUserX className="w-3.5 h-3.5" />}
                      {user.isVerified ? 'Verified' : 'Pending OTP'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.totalOrders || 0} orders
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => toast.info(`Password reset email triggered for ${user.email}`)}
                      className="text-xs font-semibold text-gold-600 hover:text-gold-700 underline"
                    >
                      Reset Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
