import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiShield, FiLock, FiCheck, FiKey, FiSmartphone } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../../config/api';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { updateUser, getMe } from '../../redux/auth/authSlice';

const Toggle = ({ value, onChange, disabled }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!value)}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-yellow-400' : 'bg-white/10'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <motion.span
      layout
      className={`inline-block h-4 w-4 rounded-full bg-charcoal-900 shadow-md transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);

const SettingsTab = () => {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    smsNotifications: true,
    promoNotifications: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setPrefs({
        emailNotifications: user.emailNotifications !== undefined ? Boolean(user.emailNotifications) : true,
        smsNotifications: user.smsNotifications !== undefined ? Boolean(user.smsNotifications) : true,
        promoNotifications: user.promoNotifications !== undefined ? Boolean(user.promoNotifications) : true,
      });
    }
  }, [user]);

  // Password Change State
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [otpModal, setOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const togglePref = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const savePrefs = async () => {
    try {
      setSaving(true);
      const res = await api.put('/users/profile', {
        emailNotifications: prefs.emailNotifications,
        smsNotifications: prefs.smsNotifications,
        promoNotifications: prefs.promoNotifications,
      });
      toast.success('Notification preferences updated!');
      if (res.data?.data) {
        dispatch(updateUser(res.data.data));
        dispatch(getMe());
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestPasswordOTP = async (e) => {
    e.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword) {
      return toast.error('Please enter current and new password');
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (passwords.newPassword.length < 8) {
      return toast.error('Password must be at least 8 characters long');
    }

    try {
      setRequestingOtp(true);
      const res = await api.post('/users/password-otp/request', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
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
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
        otpCode: otpCode.trim(),
      });
      toast.success(res.data?.message || 'Password changed successfully!');
      setOtpModal(false);
      setOtpCode('');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP code');
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="pb-4 border-b border-white/5">
        <h2 className="text-xl font-bold text-white">Security & Account Settings</h2>
        <p className="text-white/40 text-xs mt-0.5">Manage notification preferences, password, and security</p>
      </div>

      {/* Password Change Form */}
      <div className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10 shadow-sm">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
          <FiLock className="text-yellow-400 w-4 h-4" />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Change Security Password</h3>
            <p className="text-[11px] text-white/40 mt-0.5">A security verification OTP will be sent to your email</p>
          </div>
        </div>

        <form onSubmit={handleRequestPasswordOTP} className="space-y-4 max-w-md">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Current Password *</label>
            <input
              type="password"
              required
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-yellow-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">New Password *</label>
            <input
              type="password"
              required
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-yellow-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Confirm New Password *</label>
            <input
              type="password"
              required
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-yellow-400 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={requestingOtp}
            className="px-5 py-2.5 rounded-xl bg-yellow-400 text-charcoal-900 font-extrabold text-xs hover:bg-yellow-300 transition cursor-pointer disabled:opacity-50 shadow-md flex items-center gap-2"
          >
            <FiKey size={14} />
            {requestingOtp ? 'Sending Security OTP...' : 'Send Security OTP for Verification'}
          </button>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <FiBell className="text-yellow-400 w-4 h-4" />
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Notification Preferences</h3>
        </div>

        <div className="space-y-3">
          {[
            { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive order status updates and account alerts via email' },
            { key: 'smsNotifications', label: 'SMS / WhatsApp Alerts', desc: 'Receive dispatch & tracking alerts on your mobile phone' },
            { key: 'promoNotifications', label: 'Flash Sale & Offer Alerts', desc: 'Exclusive VIP sales, festival discounts, and promo codes' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
              <div>
                <p className="text-xs font-bold text-white">{item.label}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{item.desc}</p>
              </div>
              <Toggle value={prefs[item.key]} onChange={() => togglePref(item.key)} />
            </div>
          ))}
        </div>

        <button
          onClick={savePrefs}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl border border-yellow-400/40 text-yellow-400 text-xs font-bold hover:bg-yellow-400/10 transition cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Saving Preferences...' : 'Save Notification Preferences'}
        </button>
      </div>

      {/* Modal: Security OTP Verification for Password Change */}
      <Modal isOpen={otpModal} onClose={() => setOtpModal(false)} title="Security OTP Verification">
        <form onSubmit={handleVerifyPasswordOTP} className="space-y-4">
          <p className="text-xs text-gray-600">
            A 6-digit security code was sent to your registered email address ({user?.email}). Please enter it below to confirm your new password.
          </p>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">6-Digit OTP Code *</label>
            <input
              type="text"
              maxLength={6}
              required
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="123456"
              className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3 border border-gray-300 rounded-xl focus:border-amber-600 outline-none"
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

export default SettingsTab;
