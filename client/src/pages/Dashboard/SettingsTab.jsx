import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiBell, FiShield, FiLock, FiCheck } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../../config/api';

const Toggle = ({ value, onChange, disabled }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!value)}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-gold-500' : 'bg-white/10'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <motion.span
      layout
      className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);

const SettingsTab = () => {
  const user = useSelector((s) => s.auth.user);
  const [prefs, setPrefs] = useState({
    emailNotifications: user?.emailNotifications ?? true,
    smsNotifications: user?.smsNotifications ?? true,
    orderUpdates: true,
    offerAlerts: true,
    newsletterEmails: false,
  });
  const [saving, setSaving] = useState(false);

  // Password Change State
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPass, setChangingPass] = useState(false);

  const toggle = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const savePrefs = async () => {
    try {
      setSaving(true);
      await api.put('/auth/me', prefs);
      toast.success('Notification preferences saved!');
    } catch {
      toast.error('Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword) {
      return toast.error('Please enter current and new password');
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (passwords.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters long');
    }

    try {
      setChangingPass(true);
      await api.post('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password updated successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Password change error:', err);
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="pb-4 border-b border-white/5">
        <h2 className="text-xl font-bold text-white">Security & Account Settings</h2>
        <p className="text-white/40 text-xs mt-0.5">Manage notification preferences, password, and security</p>
      </div>

      {/* Password Change Form */}
      <div className="space-y-4 bg-white/5 p-5 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <FiLock className="text-gold-400 w-4 h-4" />
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Change Password</h3>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-3 max-w-md">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Current Password</label>
            <input
              type="password"
              required
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-gold-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">New Password</label>
            <input
              type="password"
              required
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-gold-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-gold-500"
            />
          </div>

          <button
            type="submit"
            disabled={changingPass}
            className="px-5 py-2 rounded-xl bg-gold-500 text-charcoal-900 font-extrabold text-xs hover:bg-gold-400 transition cursor-pointer disabled:opacity-50"
          >
            {changingPass ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <FiBell className="text-gold-400 w-4 h-4" />
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Notification Preferences</h3>
        </div>

        <div className="space-y-3">
          {[
            { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive order status updates via email' },
            { key: 'smsNotifications', label: 'SMS / WhatsApp Alerts', desc: 'Receive dispatch & tracking alerts' },
            { key: 'offerAlerts', label: 'Flash Sale & Offer Alerts', desc: 'Exclusive VIP sales and promo codes' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
              <div>
                <p className="text-xs font-bold text-white">{item.label}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{item.desc}</p>
              </div>
              <Toggle value={prefs[item.key]} onChange={() => toggle(item.key)} />
            </div>
          ))}
        </div>

        <button
          onClick={savePrefs}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl border border-gold-500/30 text-gold-400 text-xs font-bold hover:bg-gold-500/10 transition cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Notification Preferences'}
        </button>
      </div>
    </div>
  );
};

export default SettingsTab;
