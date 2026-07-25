import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiPlus, FiEdit2, FiTrash2, FiCheck, FiHome, FiBriefcase } from 'react-icons/fi';
import api from '../../config/api';
import { toast } from 'react-toastify';

const BLANK = { fullName: '', phone: '', street: '', city: '', state: '', postalCode: '', country: 'India', addressType: 'HOME', isDefault: false };

const AddressTab = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    api.get('/address').then(({ data }) => setAddresses(data.data || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post('/address', form);
      toast.success('Address saved!');
      setShowForm(false);
      setForm(BLANK);
      load();
    } catch { toast.error('Failed to save address.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      setDeleting(id);
      await api.delete(`/address/${id}`);
      toast.success('Address removed.');
      load();
    } catch { toast.error('Failed to delete.'); }
    finally { setDeleting(null); }
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
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-sm font-medium hover:bg-yellow-400/20 transition-colors"
        >
          <FiPlus size={13} /> Add New
        </motion.button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            onSubmit={handleSave}
            className="mb-6 p-5 bg-white/3 border border-yellow-400/20 rounded-2xl overflow-hidden"
          >
            <h3 className="text-white font-bold mb-4">New Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {[
                { key: 'fullName', label: 'Full Name', col: 1 },
                { key: 'phone', label: 'Phone Number', col: 1 },
                { key: 'street', label: 'Street / House No.', col: 2 },
                { key: 'city', label: 'City', col: 1 },
                { key: 'state', label: 'State', col: 1 },
                { key: 'postalCode', label: 'Pincode', col: 1 },
                { key: 'country', label: 'Country', col: 1 },
              ].map(f => (
                <div key={f.key} className={f.col === 2 ? 'sm:col-span-2' : ''}>
                  <label className="text-xs text-white/40 mb-1 block">{f.label}</label>
                  <input
                    type="text"
                    value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    required={['fullName','phone','street','city','state','postalCode'].includes(f.key)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-yellow-400/60 transition-all"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mb-4">
              {['HOME', 'WORK', 'OTHER'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, addressType: t }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${form.addressType === t ? 'bg-yellow-400/15 border-yellow-400/40 text-yellow-400' : 'border-white/10 text-white/40 hover:text-white'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-white/10 text-white/50 text-sm hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-yellow-400 text-black font-bold text-sm hover:bg-yellow-300 transition-colors disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Address List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="h-32 bg-white/3 rounded-xl animate-pulse" />)}
        </div>
      ) : addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 flex items-center justify-center mb-4">
            <FiMapPin size={28} className="text-yellow-400" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">No Addresses Saved</h3>
          <p className="text-white/40 text-sm">Add a delivery address to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((addr, i) => (
            <motion.div
              key={addr.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`relative p-4 rounded-2xl border transition-all ${addr.isDefault ? 'border-yellow-400/30 bg-yellow-400/5' : 'border-white/5 bg-white/3 hover:border-white/10'}`}
            >
              {addr.isDefault && (
                <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                  <FiCheck size={8} /> Default
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${addr.addressType === 'WORK' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'}`}>
                  <TypeIcon type={addr.addressType} /> {addr.addressType}
                </span>
              </div>
              <p className="text-white font-semibold text-sm mb-1">{addr.fullName}</p>
              <p className="text-white/50 text-xs leading-relaxed">{addr.street}, {addr.city}, {addr.state} — {addr.postalCode}</p>
              <p className="text-white/40 text-xs mt-1">{addr.country} · {addr.phone}</p>
              <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                <button
                  onClick={() => handleDelete(addr.id)}
                  disabled={deleting === addr.id}
                  className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  <FiTrash2 size={11} /> {deleting === addr.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressTab;
