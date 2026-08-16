import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiTrash2, FiEdit2, FiMove, FiCheck, FiX,
  FiEye, FiEyeOff, FiSettings, FiArrowUp, FiArrowDown,
  FiSave, FiRefreshCw, FiSliders, FiShield, FiAlertCircle
} from 'react-icons/fi';
import api from '../../config/api';
import { toast } from 'react-toastify';

/**
 * Admin Authentication Form Builder & Live Validation Management Portal
 * Allows Super Admin to dynamically add, remove, enable, disable, reorder, and configure validation rules
 * for Customer Login & Registration forms without code changes.
 */
const AuthFormManager = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('REGISTER');

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);

  // New Field Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newField, setNewField] = useState({
    fieldKey: '',
    label: '',
    placeholder: '',
    helperText: '',
    type: 'text',
    isRequired: false,
    isEnabled: true,
    formType: 'REGISTER',
    minLength: '',
    maxLength: '',
    pattern: '',
    patternMsg: '',
  });

  const DEFAULT_FORM_FIELDS = [
    { id: '1', fieldKey: 'fullName', label: 'Full Name', placeholder: 'John Doe', type: 'text', isRequired: true, isEnabled: true, formType: 'REGISTER' },
    { id: '2', fieldKey: 'email', label: 'Email Address', placeholder: 'user@example.com', type: 'email', isRequired: true, isEnabled: true, formType: 'REGISTER' },
    { id: '3', fieldKey: 'phone', label: 'Mobile Number', placeholder: '9876543210', type: 'tel', isRequired: true, isEnabled: true, formType: 'REGISTER' },
    { id: '4', fieldKey: 'password', label: 'Password', placeholder: '••••••••', type: 'password', isRequired: true, isEnabled: true, formType: 'REGISTER' },
    { id: '5', fieldKey: 'confirmPassword', label: 'Confirm Password', placeholder: '••••••••', type: 'password', isRequired: true, isEnabled: true, formType: 'REGISTER' },
    { id: '6', fieldKey: 'gender', label: 'Gender', placeholder: 'Select Gender', type: 'select', isRequired: false, isEnabled: true, formType: 'REGISTER' },
  ];

  const fetchFields = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth-form/admin/auth-form-fields');
      const list = res.data?.data || res.data?.fields || (Array.isArray(res.data) ? res.data : []);
      setFields(Array.isArray(list) && list.length > 0 ? list : DEFAULT_FORM_FIELDS);
    } catch (err) {
      console.error('Auth form fields fetch:', err.message);
      setFields(DEFAULT_FORM_FIELDS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const broadcastUpdate = () => {
    try {
      localStorage.removeItem('__KVLR_HOME_PERSISTENT_CACHE_V3__');
      sessionStorage.removeItem('__KVLR_HOME_CACHE__');
      window.dispatchEvent(new CustomEvent('auth_settings_updated'));
      window.dispatchEvent(new CustomEvent('kvlr:content-updated'));
      window.dispatchEvent(new CustomEvent('settings_updated'));
    } catch (e) {}
  };

  const handleToggleEnabled = async (field) => {
    try {
      const updated = !field.isEnabled;
      setFields(fields.map(f => f.id === field.id ? { ...f, isEnabled: updated } : f));
      await api.put(`/auth-form/admin/auth-form-fields/${field.id}`, { isEnabled: updated });
      toast.success(`"${field.label}" ${updated ? 'enabled' : 'disabled'} and saved to database!`);
      broadcastUpdate();
    } catch (err) {
      toast.error('Failed to update field status');
      fetchFields();
    }
  };

  const handleToggleRequired = async (field) => {
    try {
      const updated = !field.isRequired;
      setFields(fields.map(f => f.id === field.id ? { ...f, isRequired: updated } : f));
      await api.put(`/auth-form/admin/auth-form-fields/${field.id}`, { isRequired: updated });
      toast.success(`"${field.label}" marked as ${updated ? 'Required' : 'Optional'} and saved to database!`);
      broadcastUpdate();
    } catch (err) {
      toast.error('Failed to update field requirement');
      fetchFields();
    }
  };

  const handleMoveField = async (index, direction) => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    const newFields = [...fields];
    const temp = newFields[index];
    newFields[index] = newFields[targetIndex];
    newFields[targetIndex] = temp;

    // Update sortOrder values
    const fieldOrders = newFields.map((f, i) => ({ id: f.id, sortOrder: i + 1 }));
    setFields(newFields);

    try {
      await api.put('/auth-form/admin/auth-form-fields/reorder', { fieldOrders });
      toast.success('Field order saved to database!');
      broadcastUpdate();
    } catch (err) {
      toast.error('Failed to save field order');
    }
  };

  const handleCreateField = async (e) => {
    e.preventDefault();
    if (!newField.fieldKey || !newField.label) {
      return toast.error('Field Key and Label are required');
    }

    try {
      setSaving(true);
      const validationRules = {
        ...(newField.minLength && { minLength: parseInt(newField.minLength) }),
        ...(newField.maxLength && { maxLength: parseInt(newField.maxLength) }),
        ...(newField.pattern && { pattern: newField.pattern }),
        ...(newField.patternMsg && { patternMsg: newField.patternMsg }),
      };

      await api.post('/auth-form/admin/auth-form-fields', {
        ...newField,
        validationRules,
      });

      toast.success(`Custom field "${newField.label}" created & saved to database! ✨`);
      setAddModalOpen(false);
      setNewField({
        fieldKey: '',
        label: '',
        placeholder: '',
        helperText: '',
        type: 'text',
        isRequired: false,
        isEnabled: true,
        formType: 'REGISTER',
        minLength: '',
        maxLength: '',
        pattern: '',
        patternMsg: '',
      });
      fetchFields();
      broadcastUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create field');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateField = async (e) => {
    e.preventDefault();
    if (!editingField) return;

    try {
      setSaving(true);
      const validationRules = {
        ...(editingField.minLength && { minLength: parseInt(editingField.minLength) }),
        ...(editingField.maxLength && { maxLength: parseInt(editingField.maxLength) }),
        ...(editingField.pattern && { pattern: editingField.pattern }),
        ...(editingField.patternMsg && { patternMsg: editingField.patternMsg }),
      };

      await api.put(`/auth-form/admin/auth-form-fields/${editingField.id}`, {
        label: editingField.label,
        placeholder: editingField.placeholder,
        helperText: editingField.helperText,
        type: editingField.type,
        isRequired: editingField.isRequired,
        isEnabled: editingField.isEnabled,
        validationRules,
      });

      toast.success(`Field "${editingField.label}" updated & saved to database!`);
      setEditModalOpen(false);
      fetchFields();
      broadcastUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update field');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteField = async (field) => {
    if (['email', 'password'].includes(field.fieldKey)) {
      return toast.error('Cannot delete mandatory system auth field');
    }

    if (!window.confirm(`Are you sure you want to delete "${field.label}"?`)) return;

    try {
      await api.delete(`/auth-form/admin/auth-form-fields/${field.id}`);
      toast.success(`Field "${field.label}" deleted from database`);
      fetchFields();
      broadcastUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete field');
    }
  };

  const filteredFields = fields.filter(f => (f.formType || 'REGISTER') === activeTab);
  const activeEnabledFields = filteredFields.filter(f => f.isEnabled);

  return (
    <div className="p-4 sm:p-6 space-y-6 text-charcoal-900 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-charcoal-900 flex items-center gap-2">
            <FiSliders className="text-gold-600" /> Customer Authentication Form Builder
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure dynamic fields, validation rules, required parameters, and layout order for Customer Login & Registration.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-black font-bold text-xs shadow hover:from-gold-400 transition flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <FiPlus className="w-4 h-4" /> Add Custom Input Field
        </button>
      </div>

      {/* Main Grid: Management Table vs Live Customer Registration Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Form Field Manager (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('REGISTER')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'REGISTER'
                    ? 'bg-gold-500 text-black shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Customer Registration Form ({fields.filter(f => (f.formType || 'REGISTER') === 'REGISTER').length})
              </button>
              <button
                onClick={() => setActiveTab('LOGIN')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'LOGIN'
                    ? 'bg-gold-500 text-black shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Customer Login Form ({fields.filter(f => f.formType === 'LOGIN').length})
              </button>
            </div>

            <button onClick={fetchFields} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600" title="Refresh">
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400">Loading form fields...</div>
          ) : (
            <div className="space-y-3">
              {filteredFields.map((field, idx) => (
                <div
                  key={field.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    field.isEnabled ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <div className="flex flex-col gap-1 shrink-0 mt-0.5 sm:mt-0">
                      <button
                        onClick={() => handleMoveField(idx, 'UP')}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 text-gray-500 cursor-pointer"
                      >
                        <FiArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveField(idx, 'DOWN')}
                        disabled={idx === filteredFields.length - 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 text-gray-500 cursor-pointer"
                      >
                        <FiArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                        <span className="font-bold text-xs text-gray-900 truncate">{field.label}</span>
                        <span className="text-[9px] sm:text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full shrink-0">
                          {field.fieldKey}
                        </span>
                        {field.isEnabled ? (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0">Enabled</span>
                        ) : (
                          <span className="text-[9px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded shrink-0">Disabled</span>
                        )}
                        {field.isRequired ? (
                          <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded shrink-0">Required</span>
                        ) : (
                          <span className="text-[9px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded shrink-0">Optional</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 truncate">
                        Placeholder: "{field.placeholder || 'None'}" • Type: {field.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Enable Toggle */}
                    <button
                      onClick={() => handleToggleEnabled(field)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                        field.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {field.isEnabled ? 'Enabled' : 'Disabled'}
                    </button>

                    {/* Required Toggle */}
                    <button
                      onClick={() => handleToggleRequired(field)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                        field.isRequired ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {field.isRequired ? 'Required' : 'Optional'}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => {
                        let parsedRules = {};
                        try { parsedRules = typeof field.validationRules === 'string' ? JSON.parse(field.validationRules) : field.validationRules || {}; } catch {}
                        setEditingField({
                          ...field,
                          minLength: parsedRules.minLength || '',
                          maxLength: parsedRules.maxLength || '',
                          pattern: parsedRules.pattern || '',
                          patternMsg: parsedRules.patternMsg || '',
                        });
                        setEditModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gold-100 hover:text-gold-800 text-gray-600"
                      title="Edit Field"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    {!['email', 'password'].includes(field.fieldKey) && (
                      <button
                        onClick={() => handleDeleteField(field)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600"
                        title="Delete Field"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Live Customer Form Preview (5 Cols) */}
        <div className="lg:col-span-5 bg-[#0D0D12] text-white rounded-2xl border border-gold-500/30 p-6 shadow-xl space-y-4">
          <div className="border-b border-white/10 pb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-gold-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiEye /> Customer Live Preview ({activeTab})
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
              Real-time DB Rendering
            </span>
          </div>

          <div className="space-y-3.5">
            {activeEnabledFields.map((field) => (
              <div key={field.id} className="space-y-1">
                <label className="block text-xs font-bold text-gray-300">
                  {field.label} {field.isRequired && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs">
                    <option>{field.placeholder || 'Select Option'}</option>
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    placeholder={field.placeholder}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                  />
                ) : (
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-gray-500"
                  />
                )}
                {field.helperText && <p className="text-[10px] text-gray-500">{field.helperText}</p>}
              </div>
            ))}

            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-black font-bold text-xs uppercase tracking-wider shadow">
              {activeTab === 'REGISTER' ? 'Create Account' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>

      {/* CREATE FIELD MODAL */}
      <AnimatePresence>
        {addModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-sm text-charcoal-900">Add Custom Auth Field</h3>
                <button onClick={() => setAddModalOpen(false)} className="text-gray-400 hover:text-black">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateField} className="space-y-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Field Key (camelCase)</label>
                  <input
                    type="text"
                    required
                    value={newField.fieldKey}
                    onChange={e => setNewField({ ...newField, fieldKey: e.target.value })}
                    placeholder="gstNumber, referralCode, village"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Label Name</label>
                  <input
                    type="text"
                    required
                    value={newField.label}
                    onChange={e => setNewField({ ...newField, label: e.target.value })}
                    placeholder="GST Number, Village / Landmark"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Placeholder Text</label>
                  <input
                    type="text"
                    value={newField.placeholder}
                    onChange={e => setNewField({ ...newField, placeholder: e.target.value })}
                    placeholder="Enter GST number"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Input Type</label>
                    <select
                      value={newField.type}
                      onChange={e => setNewField({ ...newField, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="password">Password</option>
                      <option value="tel">Telephone / Mobile</option>
                      <option value="number">Number</option>
                      <option value="select">Select Dropdown</option>
                      <option value="textarea">Textarea</option>
                      <option value="date">Date</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Target Form</label>
                    <select
                      value={newField.formType}
                      onChange={e => setNewField({ ...newField, formType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    >
                      <option value="REGISTER">Registration</option>
                      <option value="LOGIN">Login</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={newField.isRequired}
                      onChange={e => setNewField({ ...newField, isRequired: e.target.checked })}
                    />
                    Required
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={newField.isEnabled}
                      onChange={e => setNewField({ ...newField, isEnabled: e.target.checked })}
                    />
                    Enabled
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-gold-500 hover:bg-gold-600 text-black font-bold text-xs uppercase"
                >
                  {saving ? 'Creating Field...' : 'Create Field'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthFormManager;
