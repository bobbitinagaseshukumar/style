import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiPlus, FiEdit2, FiTrash2, FiCheck, FiHome, FiBriefcase } from 'react-icons/fi';
import api from '../../config/api';
import { toast } from 'react-toastify';

import { useDispatch } from 'react-redux';
import { getMe } from '../../redux/auth/authSlice';

const BLANK_FORM = {
  fullName: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  addressType: 'HOME',
  isDefault: false
};

const AddressTab = () => {
  const dispatch = useDispatch();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/addresses');
      if (res.data?.success) {
        setAddresses(res.data.data || []);
      }
    } catch (err) {
      console.error('[ADDRESS TAB LOAD ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
    const handleSync = () => loadAddresses();
    window.addEventListener('addresses_updated', handleSync);
    return () => window.removeEventListener('addresses_updated', handleSync);
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setForm(BLANK_FORM);
    setShowForm(true);
  };

  const openEditForm = (addr) => {
    setEditingId(addr.id);
    setForm({
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
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/users/addresses/${editingId}`, form);
        toast.success('Address updated successfully!');
      } else {
        await api.post('/users/addresses', form);
        toast.success('Address saved successfully!');
      }
      setShowForm(false);
      setEditingId(null);
      setForm(BLANK_FORM);
      loadAddresses();
      dispatch(getMe());
      window.dispatchEvent(new CustomEvent('addresses_updated'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      setDeleting(id);
      await api.delete(`/users/addresses/${id}`);
      toast.success('Address removed.');
      loadAddresses();
      dispatch(getMe());
      window.dispatchEvent(new CustomEvent('addresses_updated'));
    } catch (err) {
      toast.error('Failed to delete address.');
    } finally {
      setDeleting(null);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/users/addresses/${id}/default`);
      toast.success('Default address updated');
      loadAddresses();
      dispatch(getMe());
      window.dispatchEvent(new CustomEvent('addresses_updated'));
    } catch (err) {
      toast.error('Failed to set default address');
    }
  };

  const TypeIcon = ({ type }) => type === 'WORK' ? <FiBriefcase size={12} /> : <FiHome size={12} />;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold text-white">Saved Addresses</h2>
          <p className="text-white/40 text-sm">{addresses.length} address{addresses.length !== 1 ? 'es' : ''} saved</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={showForm ? () => setShowForm(false) : openAddForm}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400 text-charcoal-900 text-sm font-bold hover:bg-yellow-300 transition-colors shadow-sm cursor-pointer"
        >
          {showForm ? 'Cancel' : <><FiPlus size={14} /> Add New Address</>}
        </motion.button>
      </div>

      {/* Add / Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSave}
            className="mb-8 p-6 bg-white/5 border border-yellow-400/30 rounded-2xl space-y-4"
          >
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              {editingId ? <FiEdit2 className="text-yellow-400" /> : <FiPlus className="text-yellow-400" />}
              {editingId ? 'Edit Address' : 'Add New Shipping Address'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/60 mb-1 block font-medium">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="Receiver's full name"
                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white text-sm outline-none focus:border-yellow-400 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block font-medium">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="10-digit mobile number"
                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white text-sm outline-none focus:border-yellow-400 transition-all"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-white/60 mb-1 block font-medium">Flat, House no., Building, Street *</label>
                <input
                  type="text"
                  required
                  value={form.street}
                  onChange={e => setForm(p => ({ ...p, street: e.target.value }))}
                  placeholder="Street address, area"
                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white text-sm outline-none focus:border-yellow-400 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block font-medium">City *</label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  placeholder="City"
                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white text-sm outline-none focus:border-yellow-400 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block font-medium">State *</label>
                <input
                  type="text"
                  required
                  value={form.state}
                  onChange={e => setForm(p => ({ ...p, state: e.target.value }))}
                  placeholder="State"
                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white text-sm outline-none focus:border-yellow-400 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block font-medium">Pincode / Postal Code *</label>
                <input
                  type="text"
                  required
                  value={form.postalCode}
                  onChange={e => setForm(p => ({ ...p, postalCode: e.target.value }))}
                  placeholder="6-digit Pincode"
                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white text-sm outline-none focus:border-yellow-400 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block font-medium">Country *</label>
                <input
                  type="text"
                  required
                  value={form.country}
                  onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                  placeholder="Country"
                  className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-white text-sm outline-none focus:border-yellow-400 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs font-bold text-white/60 uppercase">Address Type:</span>
              {['HOME', 'WORK', 'OTHER'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, addressType: t }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${form.addressType === t ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))}
                className="rounded text-yellow-400 focus:ring-yellow-400"
              />
              Set as default shipping address
            </label>

            <div className="flex gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl border border-white/15 text-white/70 text-sm hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-yellow-400 text-black font-extrabold text-sm hover:bg-yellow-300 transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Address List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white/3 rounded-2xl border border-dashed border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 flex items-center justify-center mb-4">
            <FiMapPin size={28} className="text-yellow-400" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">No Addresses Saved</h3>
          <p className="text-white/40 text-sm mb-6">Add a delivery address to get started.</p>
          <button
            onClick={openAddForm}
            className="px-5 py-2.5 rounded-xl bg-yellow-400 text-black font-bold text-xs hover:bg-yellow-300 transition-colors"
          >
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr, i) => (
            <motion.div
              key={addr.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative p-5 rounded-2xl border transition-all bg-white/5 ${addr.isDefault ? 'border-yellow-400/50 shadow-lg shadow-yellow-400/5' : 'border-white/10 hover:border-white/20'}`}
            >
              {addr.isDefault && (
                <span className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2.5 py-0.5 rounded-full">
                  <FiCheck size={10} /> DEFAULT
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${addr.addressType === 'WORK' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'}`}>
                  <TypeIcon type={addr.addressType} /> {addr.addressType || addr.type || 'HOME'}
                </span>
                <h4 className="text-white font-bold text-sm">{addr.fullName}</h4>
              </div>
              <p className="text-white/70 text-xs mb-1">{addr.street || addr.streetAddress}</p>
              <p className="text-white/70 text-xs mb-1">{addr.city}, {addr.state} - {addr.postalCode || addr.zipCode}</p>
              <p className="text-white/40 text-xs mt-2">{addr.country || 'India'} • Phone: {addr.phone}</p>
              
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/10">
                <button
                  onClick={() => openEditForm(addr)}
                  className="text-xs font-bold text-yellow-400 hover:underline flex items-center gap-1"
                >
                  <FiEdit2 size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  disabled={deleting === addr.id}
                  className="text-xs font-bold text-red-400 hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  <FiTrash2 size={12} /> {deleting === addr.id ? 'Removing...' : 'Remove'}
                </button>
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs font-medium text-white/50 hover:text-white ml-auto"
                  >
                    Set Default
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressTab;
