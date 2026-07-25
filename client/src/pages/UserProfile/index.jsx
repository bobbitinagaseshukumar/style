import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiUser, FiShoppingBag, FiMapPin, FiHeart, FiShield,
  FiEdit, FiPlus, FiTrash2, FiSave, FiLock, FiCheckCircle, FiPrinter
} from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../config/api';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { toast } from 'react-toastify';

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Address Modal
  const [addressModal, setAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    addressType: 'HOME',
    isDefault: false,
  });

  // Password Form
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '' });

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [userRes, addrRes, orderRes, logRes] = await Promise.allSettled([
        api.get('/users/me'),
        api.get('/users/addresses'),
        api.get('/orders/my-orders'),
        api.get('/users/activity-logs'),
      ]);

      if (userRes.status === 'fulfilled') setUser(userRes.value.data?.data);
      if (addrRes.status === 'fulfilled') setAddresses(addrRes.value.data?.data || []);
      if (orderRes.status === 'fulfilled') setOrders(orderRes.value.data?.data || []);
      if (logRes.status === 'fulfilled') setActivityLogs(logRes.value.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      await api.put('/users/profile', user);
      toast.success('Profile details updated!');
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    try {
      await api.put('/users/password', passForm);
      toast.success('Password changed successfully!');
      setPassForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password update failed');
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/addresses', addressForm);
      toast.success('Address saved!');
      setAddressModal(false);
      setAddressForm({ fullName: '', phone: '', street: '', city: '', state: '', postalCode: '', addressType: 'HOME', isDefault: false });
      const addrRes = await api.get('/users/addresses');
      setAddresses(addrRes.data?.data || []);
    } catch (err) {
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await api.delete(`/users/addresses/${id}`);
      toast.success('Address removed');
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      toast.error('Failed to delete address');
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Loading user portal...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm h-fit space-y-2">
          <div className="text-center pb-6 border-b border-gray-100">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-bold text-3xl mx-auto shadow-lg mb-3">
              {user?.fullName?.[0] || 'U'}
            </div>
            <h2 className="font-serif font-bold text-lg text-charcoal-900">{user?.fullName || 'Customer Account'}</h2>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>

          {[
            { id: 'profile', label: 'Profile Details', icon: FiUser },
            { id: 'orders', label: 'Order History', icon: FiShoppingBag },
            { id: 'addresses', label: 'Saved Addresses', icon: FiMapPin },
            { id: 'security', label: 'Security & Activity', icon: FiShield },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-charcoal-900 text-gold-400 shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-3xl p-6 lg:p-8 shadow-sm">
          {/* TAB 1: PROFILE DETAILS */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSave} className="space-y-6">
              <h3 className="text-xl font-serif font-bold text-charcoal-900 border-b pb-3">Personal Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Full Name" value={user?.fullName || ''} onChange={e => setUser({ ...user, fullName: e.target.value })} required />
                <Input label="Email Address" value={user?.email || ''} disabled />
                <Input label="Phone Number" value={user?.phone || ''} onChange={e => setUser({ ...user, phone: e.target.value })} placeholder="+91 98765 43210" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select value={user?.gender || 'Women'} onChange={e => setUser({ ...user, gender: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gold-500 focus:outline-none text-sm">
                    <option value="Women">Women</option>
                    <option value="Men">Men</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button type="submit" icon={FiSave}>Save Profile Changes</Button>
              </div>
            </form>
          )}

          {/* TAB 2: ORDER HISTORY */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h3 className="text-xl font-serif font-bold text-charcoal-900 border-b pb-3">My Orders ({orders.length})</h3>
              {orders.length === 0 ? (
                <div className="p-8 text-center text-gray-500">You have no previous orders.</div>
              ) : (
                <div className="space-y-4">
                  {orders.map((o) => (
                    <div key={o.id} className="border rounded-2xl p-5 shadow-sm space-y-3">
                      <div className="flex justify-between items-center text-sm border-b pb-3">
                        <div>
                          <strong className="text-charcoal-900">{o.orderNumber || o.id}</strong>
                          <span className="text-xs text-gray-400 block">{formatDate(o.createdAt)}</span>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                          {o.orderStatus}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Items: {o.items?.length || 1}</span>
                        <strong className="text-charcoal-900">{formatCurrency(o.totalAmount)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAVED ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-xl font-serif font-bold text-charcoal-900">Saved Shipping Addresses</h3>
                <Button icon={FiPlus} onClick={() => setAddressModal(true)}>Add New Address</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((a) => (
                  <div key={a.id} className="border border-gray-200 rounded-2xl p-5 shadow-sm relative">
                    {a.isDefault && (
                      <span className="absolute top-3 right-3 bg-gold-100 text-gold-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        DEFAULT
                      </span>
                    )}
                    <h4 className="font-bold text-charcoal-900 text-sm mb-1">{a.fullName}</h4>
                    <p className="text-xs text-gray-600">{a.street}</p>
                    <p className="text-xs text-gray-600">{a.city}, {a.state} - {a.postalCode}</p>
                    <p className="text-xs text-gray-400 mt-2">Phone: {a.phone}</p>

                    <div className="mt-4 pt-3 border-t flex justify-end">
                      <button onClick={() => handleDeleteAddress(a.id)} className="text-xs text-red-600 font-semibold hover:underline">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY & LOGS */}
          {activeTab === 'security' && (
            <div className="space-y-8">
              <form onSubmit={handlePasswordSave} className="space-y-4">
                <h3 className="text-xl font-serif font-bold text-charcoal-900 border-b pb-3">Change Security Password</h3>
                <Input label="Current Password" type="password" value={passForm.currentPassword} onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })} required />
                <Input label="New Password" type="password" value={passForm.newPassword} onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} required />
                <Button type="submit" icon={FiLock}>Update Password</Button>
              </form>

              <div>
                <h4 className="font-bold text-charcoal-900 text-sm mb-3">Recent Login Activity</h4>
                <div className="space-y-2">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="text-xs p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between">
                      <span>{log.details || log.action}</span>
                      <span className="text-gray-400">{formatDate(log.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Address */}
      <Modal isOpen={addressModal} onClose={() => setAddressModal(false)} title="Add Shipping Address">
        <form onSubmit={handleAddAddress} className="space-y-4">
          <Input label="Full Name" value={addressForm.fullName} onChange={e => setAddressForm({ ...addressForm, fullName: e.target.value })} required />
          <Input label="Phone Number" value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} required />
          <Input label="Flat, House no., Building, Street" value={addressForm.street} onChange={e => setAddressForm({ ...addressForm, street: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} required />
            <Input label="State" value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} required />
          </div>
          <Input label="Pincode / Postal Code" value={addressForm.postalCode} onChange={e => setAddressForm({ ...addressForm, postalCode: e.target.value })} required />
          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer pt-2">
            <input type="checkbox" checked={addressForm.isDefault} onChange={e => setAddressForm({ ...addressForm, isDefault: e.target.checked })} className="rounded text-gold-500 focus:ring-gold-500" />
            Set as default shipping address
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setAddressModal(false)}>Cancel</Button>
            <Button type="submit">Save Address</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserProfile;
