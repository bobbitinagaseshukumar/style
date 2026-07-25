import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiBell, FiShield, FiMoon, FiGlobe, FiTrash2, FiAlertTriangle, FiToggleLeft, FiToggleRight, FiDownload } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../../config/api';

const Toggle = ({ value, onChange, disabled }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!value)}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-yellow-400' : 'bg-white/10'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <motion.span
      layout
      className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);

const SettingsTab = () => {
  const user = useSelector(s => s.auth.user);
  const [prefs, setPrefs] = useState({
    emailNotifications: user?.emailNotifications ?? true,
    smsNotifications: user?.smsNotifications ?? true,
    orderUpdates: true,
    offerAlerts: true,
    newsletterEmails: false,
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const savePrefs = async () => {
    try {
      setSaving(true);
      await api.put('/auth/profile', prefs);
      toast.success('Preferences saved!');
    } catch {
      toast.error('Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    {
      title: 'Notifications',
      icon: FiBell,
      items: [
        { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email' },
        { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive updates via SMS' },
        { key: 'orderUpdates', label: 'Order Status Updates', desc: 'Shipping & delivery alerts' },
        { key: 'offerAlerts', label: 'Offer & Sale Alerts', desc: 'Flash sales and discount alerts' },
        { key: 'newsletterEmails', label: 'Newsletter', desc: 'Weekly fashion tips and trends' },
      ],
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 pb-4 border-b border-white/5">
        <h2 className="text-xl font-bold text-white">Account Settings</h2>
        <p className="text-white/40 text-sm">Manage your preferences and privacy</p>
      </div>

      {/* Notification Preferences */}
      <div className="space-y-6 mb-8">
        {sections.map(section => (
          <div key={section.title}>
            <div className="flex items-center gap-2 mb-4">
              <section.icon size={15} className="text-yellow-400" />
              <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest">{section.title}</h3>
            </div>
            <div className="space-y-3">
              {section.items.map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-white/3 border border-white/5 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
                  </div>
                  <Toggle value={prefs[item.key]} onChange={() => toggle(item.key)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={savePrefs}
        disabled={saving}
        className="px-6 py-3 rounded-xl bg-yellow-400 text-black font-bold text-sm hover:bg-yellow-300 transition-colors disabled:opacity-60 mb-8"
      >
        {saving ? 'Saving...' : 'Save Preferences'}
      </motion.button>

      {/* Security Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FiShield size={15} className="text-yellow-400" />
          <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest">Security</h3>
        </div>
        <div className="space-y-3">
          <div className="p-4 bg-white/3 border border-white/5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Change Password</p>
              <p className="text-xs text-white/40 mt-0.5">Last updated: recently</p>
            </div>
            <button className="text-xs text-yellow-400 hover:text-yellow-300 font-semibold transition-colors px-3 py-1.5 rounded-lg border border-yellow-400/20 hover:bg-yellow-400/5">
              Update
            </button>
          </div>
          <div className="p-4 bg-white/3 border border-white/5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Download My Data</p>
              <p className="text-xs text-white/40 mt-0.5">Export all your account data</p>
            </div>
            <button className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white font-semibold transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5">
              <FiDownload size={11} /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FiAlertTriangle size={15} className="text-red-400" />
          <h3 className="text-sm font-bold text-red-400/70 uppercase tracking-widest">Danger Zone</h3>
        </div>
        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="px-4 py-3 w-full text-left rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors flex items-center gap-3"
          >
            <FiTrash2 size={14} /> Delete My Account
            <span className="text-xs text-red-400/50 ml-auto">This action is irreversible</span>
          </button>
        ) : (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10">
            <p className="text-sm text-red-300 font-medium mb-3">Are you sure? This will permanently delete your account and all data.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => { toast.error('Please contact support to delete your account.'); setDeleteConfirm(false); }}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsTab;
