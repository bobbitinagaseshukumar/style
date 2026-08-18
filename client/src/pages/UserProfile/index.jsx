import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiUser, FiShoppingBag, FiMapPin, FiHeart, FiShield,
  FiEdit, FiPlus, FiTrash2, FiSave, FiLock, FiCheckCircle, FiCheck, FiPrinter, FiLogOut, FiKey, FiSmartphone, FiEye, FiEyeOff
} from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../config/api';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import SixDigitOtpInput from '../../components/common/SixDigitOtpInput';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { toast } from 'react-toastify';
import { updateUser, getMe, logoutUser } from '../../redux/auth/authSlice';

const checkPasswordStrength = (pass) => {
  const p = pass || '';
  const checks = {
    length: p.length >= 8,
    upper: /[A-Z]/.test(p),
    lower: /[a-z]/.test(p),
    number: /[0-9]/.test(p),
    special: /[^A-Za-z0-9]/.test(p),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { checks, score };
};

const UserProfile = () => {
  const dispatch = useDispatch();
  const reduxUser = useSelector((s) => s.auth.user);
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(reduxUser || null);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(!reduxUser);

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

  // Sync user state whenever Redux user updates
  useEffect(() => {
    if (reduxUser) {
      setUser((prev) => ({
        ...prev,
        ...reduxUser,
        fullName: reduxUser.fullName || prev?.fullName || '',
        email: reduxUser.email || prev?.email || '',
        phone: reduxUser.phone || prev?.phone || '',
        gender: reduxUser.gender || prev?.gender || '',
      }));
    }
  }, [reduxUser]);

  const fetchAddresses = async () => {
    try {
      const addrRes = await api.get('/users/addresses');
      setAddresses(addrRes.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserData = async () => {
    try {
      const [userRes, addrRes, orderRes, logRes] = await Promise.allSettled([
        api.get('/users/me'),
        api.get('/users/addresses'),
        api.get(`/orders/my-orders?_t=${Date.now()}`),
        api.get('/users/activity-logs'),
      ]);

      if (userRes.status === 'fulfilled' && userRes.value.data?.data) {
        const u = userRes.value.data.data;
        setUser(u);
        dispatch(updateUser(u));
      } else if (reduxUser) {
        setUser(reduxUser);
      }
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
    const handleSync = () => {
      fetchAddresses();
      fetchUserData();
    };
    const handleUserUpdate = (e) => {
      if (e?.detail) {
        setUser((prev) => ({ ...prev, ...e.detail }));
      } else {
        fetchUserData();
      }
    };
    window.addEventListener('addresses_updated', handleSync);
    window.addEventListener('orders_updated', handleSync);
    window.addEventListener('user_updated', handleUserUpdate);
    return () => {
      window.removeEventListener('addresses_updated', handleSync);
      window.removeEventListener('orders_updated', handleSync);
      window.removeEventListener('user_updated', handleUserUpdate);
    };
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/users/profile', {
        fullName: user?.fullName || '',
        phone: user?.phone || '',
        alternatePhone: user?.alternatePhone || user?.altPhone || '',
        gender: user?.gender || '',
        dob: user?.dob || null,
        avatar: user?.avatar || '',
      });
      toast.success('Profile details updated successfully!');
      if (res.data?.data) {
        const updated = res.data.data;
        setUser(updated);
        dispatch(updateUser(updated));
        dispatch(getMe());
        window.dispatchEvent(new CustomEvent('user_updated', { detail: updated }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isForgotFlow, setIsForgotFlow] = useState(false);
  const [otpModal, setOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const handleRequestPasswordOTP = async (e) => {
    if (e) e.preventDefault();
    if (!passForm.newPassword) {
      toast.error('Please enter your new password first.');
      return;
    }
    if (passForm.confirmPassword && passForm.newPassword !== passForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    const { score } = checkPasswordStrength(passForm.newPassword);
    if (score < 5) {
      toast.error('Please satisfy all password security requirements shown in green below.');
      return;
    }
    if (!isForgotFlow && !passForm.currentPassword) {
      toast.error('Please enter your current password or click "Forgot Current Password?"');
      return;
    }
    try {
      setRequestingOtp(true);
      const res = await api.post('/users/password-otp/request', {
        currentPassword: isForgotFlow ? '' : passForm.currentPassword,
        newPassword: passForm.newPassword,
        confirmNewPassword: passForm.confirmPassword,
        isForgotFlow
      });
      toast.success(res.data?.message || 'Verification OTP code sent to your registered email!');
      setOtpModal(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP for password change');
    } finally {
      setRequestingOtp(false);
    }
  };

  const handleVerifyPasswordOTP = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      toast.error('Please enter a valid 6-digit OTP code');
      return;
    }
    try {
      setVerifyingOtp(true);
      const res = await api.post('/users/password-otp/verify', {
        ...passForm,
        otpCode: otpCode.trim(),
        isForgotFlow
      });
      toast.success(res.data?.message || 'Password changed successfully!');
      setOtpModal(false);
      setOtpCode('');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsForgotFlow(false);
      fetchUserData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP code');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!window.confirm('Are you sure you want to forcibly log out from all active sessions across all devices?')) return;
    try {
      await api.post('/users/logout-all-devices');
      toast.success('Logged out from all devices successfully');
      dispatch(logoutUser());
      window.location.href = '/login';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log out from all devices');
    }
  };

  const [editingAddressId, setEditingAddressId] = useState(null);

  const openAddAddressModal = () => {
    setEditingAddressId(null);
    setAddressForm({ fullName: user?.fullName || '', phone: user?.phone || '', street: '', city: '', state: '', postalCode: '', country: 'India', addressType: 'HOME', isDefault: false });
    setAddressModal(true);
  };

  const openEditAddressModal = (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      street: addr.street || addr.streetAddress || '',
      city: addr.city || '',
      state: addr.state || '',
      postalCode: addr.postalCode || addr.zipCode || '',
      country: addr.country || 'India',
      addressType: addr.addressType || addr.type || 'HOME',
      isDefault: Boolean(addr.isDefault)
    });
    setAddressModal(true);
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      if (editingAddressId) {
        await api.put(`/users/addresses/${editingAddressId}`, addressForm);
        toast.success('Address updated successfully!');
      } else {
        await api.post('/users/addresses', addressForm);
        toast.success('Address saved successfully!');
      }
      setAddressModal(false);
      setEditingAddressId(null);
      fetchAddresses();
      window.dispatchEvent(new CustomEvent('addresses_updated'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.delete(`/users/addresses/${id}`);
      toast.success('Address removed');
      fetchAddresses();
      window.dispatchEvent(new CustomEvent('addresses_updated'));
    } catch (err) {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      await api.put(`/users/addresses/${id}/default`);
      toast.success('Default address updated');
      fetchAddresses();
      window.dispatchEvent(new CustomEvent('addresses_updated'));
    } catch (err) {
      toast.error('Failed to set default address');
    }
  };

  const handleDeleteSingleLog = async (id) => {
    try {
      await api.delete(`/users/activity-logs/${id}`);
      toast.success('Activity log entry permanently deleted');
      setActivityLogs(prev => prev.filter(log => log.id !== id));
    } catch (err) {
      toast.error('Failed to delete activity log entry');
    }
  };

  const handleClearAllLogs = async () => {
    if (!window.confirm('Are you sure you want to permanently clear all activity logs? This cannot be undone.')) return;
    try {
      await api.delete('/users/activity-logs');
      toast.success('All activity logs permanently cleared');
      setActivityLogs([]);
    } catch (err) {
      toast.error('Failed to clear activity logs');
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Loading user portal...</div>;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm h-fit space-y-2">
          <div className="text-center pb-6 border-b border-gray-100">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-bold text-3xl mx-auto shadow-lg mb-3">
              {(user?.fullName?.trim()?.[0] || user?.email?.trim()?.[0] || 'U').toUpperCase()}
            </div>
            <h2 className="font-bold text-charcoal-900 text-lg">{user?.fullName || user?.name || user?.email?.split('@')[0] || 'My Account'}</h2>
            <p className="text-xs text-gray-400">{user?.email || '—'}</p>
          </div>

          <div className="pt-4 space-y-1">
            {[
              { id: 'profile', label: 'Profile Details', icon: FiUser },
              { id: 'orders', label: 'Order History', icon: FiShoppingBag },
              { id: 'addresses', label: 'Saved Addresses', icon: FiMapPin },
              { id: 'security', label: 'Security & Activity', icon: FiShield },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-charcoal-900 text-gold-400 shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-3xl p-6 lg:p-8 shadow-sm">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSave} className="space-y-6">
              <h3 className="text-xl font-serif font-bold text-charcoal-900 border-b pb-3">Personal Profile Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Full Name" value={user?.fullName || ''} onChange={e => setUser({ ...user, fullName: e.target.value })} required />
                <Input label="Email Address" value={user?.email || ''} disabled readOnly />
                <Input label="Phone Number" value={user?.phone || ''} onChange={e => setUser({ ...user, phone: e.target.value })} />
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Gender</label>
                  <select value={user?.gender || ''} onChange={e => setUser({ ...user, gender: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm bg-white">
                    <option value="">Select Gender</option>
                    <option value="Women">Women</option>
                    <option value="Men">Men</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <Button type="submit" icon={FiCheck}>Save Profile Changes</Button>
            </form>
          )}

          {/* TAB 2: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h3 className="text-xl font-serif font-bold text-charcoal-900 border-b pb-3">Your Order History</h3>
              {orders.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No orders placed yet.</div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-2xl p-5 hover:border-gold-500/50 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-charcoal-900">#{order.orderNumber || order.id.slice(-8)}</span>
                          <span className="text-xs bg-gold-50 text-gold-700 px-2 py-0.5 rounded-full font-bold uppercase">{order.status}</span>
                        </div>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)} • {order.orderItems?.length || 0} Items</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-charcoal-900">{formatCurrency(order.totalAmount)}</div>
                        <Link to={`/orders/${order.id}`} className="text-xs text-gold-600 font-bold hover:underline">View Order Details →</Link>
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
                <div>
                  <h3 className="text-xl font-serif font-bold text-charcoal-900">Saved Shipping Addresses</h3>
                  <p className="text-xs text-gray-500 mt-1">Manage your delivery addresses</p>
                </div>
                <Button icon={FiPlus} onClick={openAddAddressModal}>Add New Address</Button>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <FiMapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-600">No Addresses Saved</p>
                  <p className="text-xs text-gray-400 mt-1 mb-4">You have not added any shipping addresses yet.</p>
                  <Button icon={FiPlus} onClick={openAddAddressModal}>Add Address</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((a) => (
                    <div key={a.id} className="border border-gray-200 rounded-2xl p-5 shadow-sm relative bg-white hover:border-gold-500/50 transition-all">
                      {a.isDefault && (
                        <span className="absolute top-3 right-3 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          DEFAULT
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          {a.addressType || a.type || 'HOME'}
                        </span>
                        <h4 className="font-bold text-charcoal-900 text-sm">{a.fullName}</h4>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{a.street || a.streetAddress}</p>
                      <p className="text-xs text-gray-600 mb-1">
                        {a.city}, {a.state} - {a.postalCode || a.zipCode}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">{a.country || 'India'} • Phone: {a.phone}</p>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-3">
                        <button onClick={() => openEditAddressModal(a)} className="text-xs text-amber-600 font-bold hover:underline">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteAddress(a.id)} className="text-xs text-red-600 font-bold hover:underline">
                          Remove
                        </button>
                        {!a.isDefault && (
                          <button onClick={() => handleSetDefaultAddress(a.id)} className="text-xs text-gray-500 font-semibold hover:text-charcoal-900 ml-auto">
                            Set Default
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SECURITY & LOGS */}
          {activeTab === 'security' && (
            <div className="space-y-8">
              {/* Change Security Password */}
              <form onSubmit={handleRequestPasswordOTP} className="space-y-4 bg-amber-50/30 p-6 rounded-2xl border border-amber-200/60 shadow-sm">
                <div className="border-b border-amber-200/60 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-charcoal-900 flex items-center gap-2">
                      <FiLock className="text-amber-600" /> {isForgotFlow ? 'Reset Password (Forgot Current Password)' : 'Change Security Password'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {isForgotFlow 
                        ? 'Current password is not required. A 6-digit OTP code will be sent to your registered email address.' 
                        : 'An OTP verification code will be sent to your email to confirm the password update.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotFlow(!isForgotFlow);
                      setPassForm(p => ({ ...p, currentPassword: '' }));
                    }}
                    className="text-xs text-amber-600 font-bold hover:underline cursor-pointer bg-amber-100/60 px-3 py-1.5 rounded-lg whitespace-nowrap"
                  >
                    {isForgotFlow ? '← Remember Current Password?' : 'Forgot Current Password?'}
                  </button>
                </div>

                {/* Current Password Field (Only shown when NOT in forgot flow) */}
                {!isForgotFlow && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Current Password *</label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        value={passForm.currentPassword}
                        onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })}
                        placeholder="••••••••"
                        required={!isForgotFlow}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-amber-600 outline-none text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                      >
                        {showCurrentPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* New Password Field */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">New Password *</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={passForm.newPassword}
                      onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-amber-600 outline-none text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                    >
                      {showNewPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Live Password Security Requirements Checklist */}
                {passForm.newPassword && (
                  <div className="bg-white/80 border border-amber-200/80 p-3 rounded-xl text-xs space-y-1.5 shadow-inner">
                    <p className="font-bold text-gray-700">Password Security Requirements:</p>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <span className={checkPasswordStrength(passForm.newPassword).checks.length ? "text-emerald-600 font-bold flex items-center gap-1" : "text-gray-400 flex items-center gap-1"}>
                        {checkPasswordStrength(passForm.newPassword).checks.length ? "✓" : "○"} Min 8 characters
                      </span>
                      <span className={checkPasswordStrength(passForm.newPassword).checks.upper ? "text-emerald-600 font-bold flex items-center gap-1" : "text-gray-400 flex items-center gap-1"}>
                        {checkPasswordStrength(passForm.newPassword).checks.upper ? "✓" : "○"} Uppercase letter (A-Z)
                      </span>
                      <span className={checkPasswordStrength(passForm.newPassword).checks.lower ? "text-emerald-600 font-bold flex items-center gap-1" : "text-gray-400 flex items-center gap-1"}>
                        {checkPasswordStrength(passForm.newPassword).checks.lower ? "✓" : "○"} Lowercase letter (a-z)
                      </span>
                      <span className={checkPasswordStrength(passForm.newPassword).checks.number ? "text-emerald-600 font-bold flex items-center gap-1" : "text-gray-400 flex items-center gap-1"}>
                        {checkPasswordStrength(passForm.newPassword).checks.number ? "✓" : "○"} Number (0-9)
                      </span>
                      <span className={checkPasswordStrength(passForm.newPassword).checks.special ? "text-emerald-600 font-bold flex items-center gap-1" : "text-gray-400 flex items-center gap-1"}>
                        {checkPasswordStrength(passForm.newPassword).checks.special ? "✓" : "○"} Special character (!@#$%^&*)
                      </span>
                    </div>
                  </div>
                )}

                {/* Confirm New Password Field */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Confirm New Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={passForm.confirmPassword || ''}
                      onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-amber-600 outline-none text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                    >
                      {showConfirmPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" icon={FiKey} disabled={requestingOtp}>
                  {requestingOtp ? 'Sending Security OTP...' : 'Send Security OTP for Verification'}
                </Button>
              </form>

              {/* Force Multi-Device Logout Section */}
              <div className="bg-red-50/40 p-6 rounded-2xl border border-red-200/60 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-bold text-red-950 text-base flex items-center gap-2">
                    <FiSmartphone className="text-red-600" /> Multi-Device Session Security
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 max-w-xl">
                    Want to secure your account across all phones, tablets, and computers? Click below to forcibly log out from all active sessions in one click.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogoutAllDevices}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all whitespace-nowrap"
                >
                  <FiLogOut size={14} /> Logout All Devices
                </button>
              </div>

              {/* Recent Login Activity */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-charcoal-900 text-sm">Recent Login Activity</h4>
                  {activityLogs.length > 0 && (
                    <button
                      onClick={handleClearAllLogs}
                      className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <FiTrash2 size={12} /> Clear All History
                    </button>
                  )}
                </div>
                {activityLogs.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 bg-gray-50 rounded-xl text-center border border-gray-100 font-medium">
                    No activity logs recorded.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="text-xs p-3.5 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-100 flex items-center justify-between gap-4 transition-colors">
                        <span className="text-gray-800 font-medium flex-1 leading-relaxed">{log.details || log.action}</span>
                        <span className="text-gray-400 text-[11px] whitespace-nowrap">{formatDate(log.createdAt)}</span>
                        <button
                          onClick={() => handleDeleteSingleLog(log.id)}
                          title="Delete this entry permanently"
                          className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 ml-2"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add/Edit Address */}
      <Modal isOpen={addressModal} onClose={() => { setAddressModal(false); setEditingAddressId(null); }} title={editingAddressId ? "Edit Shipping Address" : "Add Shipping Address"}>
        <form onSubmit={handleAddAddress} className="space-y-4">
          <Input label="Full Name *" value={addressForm.fullName} onChange={e => setAddressForm({ ...addressForm, fullName: e.target.value })} required />
          <Input label="Phone Number *" value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} required />
          <Input label="Flat, House no., Building, Street *" value={addressForm.street} onChange={e => setAddressForm({ ...addressForm, street: e.target.value })} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="City *" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} required />
            <Input label="State *" value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} required />
          </div>
          <Input label="Pincode / Postal Code *" value={addressForm.postalCode} onChange={e => setAddressForm({ ...addressForm, postalCode: e.target.value })} required />
          
          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs font-bold text-gray-600 uppercase">Address Type:</span>
            {['HOME', 'WORK', 'OTHER'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setAddressForm(p => ({ ...p, addressType: type }))}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${addressForm.addressType === type ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                {type}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer pt-2">
            <input type="checkbox" checked={addressForm.isDefault} onChange={e => setAddressForm({ ...addressForm, isDefault: e.target.checked })} className="rounded text-gold-500 focus:ring-gold-500" />
            Set as default shipping address
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setAddressModal(false); setEditingAddressId(null); }}>Cancel</Button>
            <Button type="submit">{editingAddressId ? "Update Address" : "Save Address"}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Security OTP Verification for Password Change */}
      <Modal isOpen={otpModal} onClose={() => setOtpModal(false)} title="Security OTP Verification">
        <form onSubmit={handleVerifyPasswordOTP} className="space-y-4">
          <p className="text-xs text-gray-600">
            A 6-digit security code was sent to your registered email address ({user?.email}). Please enter it below to confirm your new password.
          </p>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1 text-center">6-Digit OTP Code *</label>
            <SixDigitOtpInput
              value={otpCode}
              onChange={setOtpCode}
              disabled={verifyingOtp}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOtpModal(false)}>Cancel</Button>
            <Button type="submit" disabled={verifyingOtp}>
              {verifyingOtp ? 'Verifying OTP...' : 'Verify OTP & Save Password'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserProfile;
