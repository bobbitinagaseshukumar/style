import React, { useState, useEffect } from 'react';
import { FiMapPin, FiPlus, FiEdit2, FiTrash2, FiCheck, FiHome, FiBriefcase, FiAlertCircle } from 'react-icons/fi';
import api from '../../config/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { toast } from 'react-toastify';

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

const AddressBook = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/addresses');
      if (res.data?.success) {
        setAddresses(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load user addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setFormData(BLANK_FORM);
    setIsFormOpen(true);
  };

  const openEditForm = (addr) => {
    setEditingId(addr.id);
    setFormData({
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
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingId) {
        await api.put(`/users/addresses/${editingId}`, formData);
        toast.success('Address updated successfully!');
      } else {
        await api.post('/users/addresses', formData);
        toast.success('Address saved successfully!');
      }
      setIsFormOpen(false);
      setFormData(BLANK_FORM);
      setEditingId(null);
      fetchAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.delete(`/users/addresses/${id}`);
      toast.success('Address removed');
      fetchAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete address');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/users/addresses/${id}/default`);
      toast.success('Default address updated');
      fetchAddresses();
    } catch (err) {
      toast.error('Failed to set default address');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal-900 flex items-center gap-3">
            <FiMapPin className="text-amber-600" /> Address Book
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your personal shipping and billing addresses for quick checkout
          </p>
        </div>
        <Button onClick={isFormOpen ? () => setIsFormOpen(false) : openAddForm}>
          {isFormOpen ? 'Cancel' : 'Add New Address'}
        </Button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSave} className="bg-amber-50/40 p-6 rounded-2xl mb-8 border border-amber-200/60 shadow-sm">
          <h2 className="text-xl font-bold text-charcoal-900 mb-4 flex items-center gap-2">
            {editingId ? <FiEdit2 className="text-amber-600" /> : <FiPlus className="text-amber-600" />}
            {editingId ? 'Edit Address' : 'New Address'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                placeholder="Receiver's full name"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-amber-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                placeholder="10-digit mobile number"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-amber-600"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Street / Flat / House No. *</label>
              <input
                type="text"
                required
                value={formData.street}
                onChange={e => setFormData(p => ({ ...p, street: e.target.value }))}
                placeholder="Flat / Building / House No., Street, Area"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-amber-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">City *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                placeholder="City / Town"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-amber-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">State *</label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={e => setFormData(p => ({ ...p, state: e.target.value }))}
                placeholder="State / Region"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-amber-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Pincode / Postal Code *</label>
              <input
                type="text"
                required
                value={formData.postalCode}
                onChange={e => setFormData(p => ({ ...p, postalCode: e.target.value }))}
                placeholder="6-digit Pincode"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-amber-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Country *</label>
              <input
                type="text"
                required
                value={formData.country}
                onChange={e => setFormData(p => ({ ...p, country: e.target.value }))}
                placeholder="Country"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mb-5">
            <span className="text-xs font-bold text-gray-600 uppercase">Address Type:</span>
            {['HOME', 'WORK', 'OTHER'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData(p => ({ ...p, addressType: type }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.addressType === type ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-6">
            <input
              type="checkbox"
              id="setAsDefaultCheck"
              checked={formData.isDefault}
              onChange={e => setFormData(p => ({ ...p, isDefault: e.target.checked }))}
              className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
            />
            <label htmlFor="setAsDefaultCheck" className="text-sm font-medium text-gray-700 cursor-pointer">
              Set as default shipping address
            </label>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
            </Button>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <p>Loading your saved addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
          <FiMapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-700">No Saved Addresses</h3>
          <p className="text-sm text-gray-500 mt-1 mb-5">You have not added any shipping addresses yet.</p>
          <Button onClick={openAddForm}>Add Your First Address</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <div key={address.id} className="border border-gray-200 rounded-2xl p-6 relative bg-white shadow-sm hover:border-amber-500/50 transition-all">
              {address.isDefault && (
                <span className="absolute top-4 right-4 bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold">
                  Default
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  {address.addressType || address.type || 'HOME'}
                </span>
                <h3 className="font-bold text-charcoal-900">{address.fullName || 'Saved Address'}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-1">{address.street || address.streetAddress}</p>
              <p className="text-sm text-gray-600 mb-1">
                {address.city}, {address.state} {address.postalCode || address.zipCode}
              </p>
              <p className="text-sm text-gray-500 mb-4">{address.country || 'India'} • {address.phone}</p>
              
              <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openEditForm(address)}
                  className="text-amber-600 hover:text-amber-700 font-bold text-xs flex items-center gap-1"
                >
                  <FiEdit2 size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  className="text-red-600 hover:text-red-700 font-bold text-xs flex items-center gap-1"
                >
                  <FiTrash2 size={12} /> Delete
                </button>
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    className="text-gray-500 hover:text-charcoal-900 font-medium text-xs ml-auto"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressBook;
