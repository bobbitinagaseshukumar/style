import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiEdit2, FiSave, FiX, FiCamera, FiPhone, FiMail, FiCalendar } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../../config/api';

const ProfileTab = () => {
  const user = useSelector(s => s.auth.user);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    dob: user?.dob ? user.dob.slice(0, 10) : '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/auth/profile', form);
      toast.success('Profile updated successfully!');
      setEditing(false);
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: 'fullName', label: 'Full Name', icon: FiUser, type: 'text' },
    { key: 'phone', label: 'Phone Number', icon: FiPhone, type: 'tel' },
    { key: 'dob', label: 'Date of Birth', icon: FiCalendar, type: 'date' },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold text-white">My Profile</h2>
          <p className="text-white/40 text-sm mt-0.5">Manage your personal information</p>
        </div>
        {!editing ? (
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-sm font-medium hover:bg-yellow-400/20 transition-colors"
          >
            <FiEdit2 size={13} /> Edit Profile
          </motion.button>
        ) : (
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setEditing(false)}
              className="px-4 py-2 rounded-xl border border-white/10 text-white/50 text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <FiX size={13} /> Cancel
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-yellow-400 text-black text-sm font-bold hover:bg-yellow-300 transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              <FiSave size={13} /> {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </div>
        )}
      </div>

      {/* Avatar + Email */}
      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-bold text-3xl shadow-lg shadow-yellow-400/20">
            {user?.fullName?.[0]?.toUpperCase() || 'U'}
          </div>
          <button className="absolute -bottom-2 -right-2 w-7 h-7 bg-yellow-400 rounded-lg flex items-center justify-center shadow-lg hover:bg-yellow-300 transition-colors">
            <FiCamera size={12} className="text-black" />
          </button>
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">{user?.fullName}</h3>
          <div className="flex items-center gap-2 mt-1">
            <FiMail size={12} className="text-white/40" />
            <span className="text-white/50 text-sm">{user?.email}</span>
          </div>
          <div className="mt-2">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
              {user?.role || 'Customer'} Account
            </span>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest flex items-center gap-2">
              <field.icon size={11} /> {field.label}
            </label>
            {editing ? (
              <input
                type={field.type}
                value={form[field.key]}
                onChange={(e) => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/20 transition-all"
              />
            ) : (
              <div className="px-4 py-3 bg-white/3 border border-white/5 rounded-xl text-sm text-white/70">
                {user?.[field.key] || <span className="text-white/25 italic">Not provided</span>}
              </div>
            )}
          </div>
        ))}

        {/* Gender */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">Gender</label>
          {editing ? (
            <select
              value={form.gender}
              onChange={(e) => setForm(prev => ({ ...prev, gender: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-yellow-400/60 transition-all appearance-none"
            >
              <option value="" className="bg-[#111]">Select Gender</option>
              <option value="Male" className="bg-[#111]">Male</option>
              <option value="Female" className="bg-[#111]">Female</option>
              <option value="Other" className="bg-[#111]">Other</option>
              <option value="Prefer not to say" className="bg-[#111]">Prefer not to say</option>
            </select>
          ) : (
            <div className="px-4 py-3 bg-white/3 border border-white/5 rounded-xl text-sm text-white/70">
              {user?.gender || <span className="text-white/25 italic">Not provided</span>}
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        {[
          { label: 'Total Orders', value: '—' },
          { label: 'Reward Points', value: '0' },
          { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).getFullYear() : '—' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/3 border border-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400 mb-1">{stat.value}</p>
            <p className="text-xs text-white/40">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileTab;
