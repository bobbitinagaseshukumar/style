import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiUser, FiEdit2, FiSave, FiX, FiCamera, FiPhone,
  FiMail, FiCalendar, FiMapPin, FiGlobe, FiCheck
} from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../../config/api';
import BannerCropperModal from '../../admin/Banner/BannerCropperModal';

const ProfileTab = () => {
  const user = useSelector((s) => s.auth.user);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile Form
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    altPhone: user?.altPhone || '',
    gender: user?.gender || '',
    dob: user?.dob ? user.dob.slice(0, 10) : '',
    address: user?.address || '',
    city: user?.city || '',
    district: user?.district || '',
    state: user?.state || '',
    country: user?.country || 'India',
    zipCode: user?.zipCode || '',
    avatar: user?.avatar || '',
  });

  // Cropper Modal state
  const [rawImage, setRawImage] = useState(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  const handleSave = async () => {
    if (!form.fullName) return toast.error('Full Name is required');
    try {
      setSaving(true);
      await api.put('/auth/me', form);
      toast.success('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) return toast.error('Image size must be less than 10MB');
      const reader = new FileReader();
      reader.onload = () => {
        setRawImage(reader.result);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedDataUrl) => {
    setForm((prev) => ({ ...prev, avatar: croppedDataUrl }));
    setIsCropperOpen(false);
    try {
      await api.put('/auth/me', { ...form, avatar: croppedDataUrl });
      toast.success('Profile photo updated!');
    } catch (err) {
      console.error('Failed to update avatar:', err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold text-white">My Profile</h2>
          <p className="text-white/40 text-xs mt-0.5">Manage personal information and delivery profile</p>
        </div>
        {!editing ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs font-bold hover:bg-gold-500/20 transition cursor-pointer"
          >
            <FiEdit2 size={13} /> Edit Profile
          </motion.button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 rounded-xl border border-white/10 text-white/50 text-xs font-semibold hover:bg-white/5 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-gold-500 text-charcoal-900 text-xs font-extrabold hover:bg-gold-400 transition cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Avatar & Basic Info */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-white/5 p-6 rounded-2xl border border-white/10">
        <div className="relative group shrink-0">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-charcoal-900 font-bold text-4xl shadow-xl overflow-hidden">
            {form.avatar ? (
              <img src={form.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              (form.fullName?.[0] || 'U').toUpperCase()
            )}
          </div>

          <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-gold-500 rounded-xl flex items-center justify-center shadow-lg hover:bg-gold-400 transition cursor-pointer border border-charcoal-900">
            <FiCamera size={14} className="text-charcoal-900" />
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </label>
        </div>

        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-white font-bold text-xl">{form.fullName || 'Customer'}</h3>
          <p className="text-xs text-white/50">{user?.email}</p>
          <span className="inline-block px-3 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20 text-[10px] font-bold uppercase tracking-widest mt-2">
            Verified Customer
          </span>
        </div>
      </div>

      {/* Profile Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Full Name</label>
          <input
            type="text"
            disabled={!editing}
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white disabled:opacity-60 focus:outline-none focus:border-gold-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Phone Number</label>
          <input
            type="tel"
            disabled={!editing}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white disabled:opacity-60 focus:outline-none focus:border-gold-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Date of Birth</label>
          <input
            type="date"
            disabled={!editing}
            value={form.dob}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white disabled:opacity-60 focus:outline-none focus:border-gold-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Gender</label>
          <select
            disabled={!editing}
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white disabled:opacity-60 focus:outline-none focus:border-gold-500"
          >
            <option value="" className="bg-charcoal-900">Select Gender</option>
            <option value="Male" className="bg-charcoal-900">Male</option>
            <option value="Female" className="bg-charcoal-900">Female</option>
            <option value="Other" className="bg-charcoal-900">Other</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Street Address</label>
          <input
            type="text"
            disabled={!editing}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="House no., Street, Area..."
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white disabled:opacity-60 focus:outline-none focus:border-gold-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">City</label>
          <input
            type="text"
            disabled={!editing}
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white disabled:opacity-60 focus:outline-none focus:border-gold-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">ZIP / Postal Code</label>
          <input
            type="text"
            disabled={!editing}
            value={form.zipCode}
            onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white disabled:opacity-60 focus:outline-none focus:border-gold-500"
          />
        </div>
      </div>

      {/* Image Cropper Modal */}
      {isCropperOpen && (
        <BannerCropperModal
          imageUrl={rawImage}
          onCancel={() => setIsCropperOpen(false)}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
        />
      )}
    </div>
  );
};

export default ProfileTab;
