import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiLock, FiUserCheck, FiShield, FiSliders, FiCheck,
  FiSmartphone, FiMail, FiUser, FiEye, FiSave, FiAlertCircle, FiSettings, FiPlus, FiTrash2, FiKey
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../../config/api';
import { setAuthSettings } from '../../redux/settings/settingsSlice';

const DEFAULT_LOGIN_METHODS = [
  { id: 'EMAIL', label: 'Email Address', desc: 'Login with Email + Password', icon: FiMail },
  { id: 'MOBILE', label: 'Mobile Number', desc: 'Login with Mobile Number + Password / OTP', icon: FiSmartphone },
  { id: 'OTP_LOGIN', label: 'Direct OTP Sign In', desc: 'Instant Passwordless Login with 6-digit OTP code', icon: FiKey },
  { id: 'USERNAME', label: 'Username', desc: 'Login with Unique Username', icon: FiUser },
  { id: 'WHATSAPP_OTP', label: 'WhatsApp OTP Login', desc: 'Receive Instant Login Code on WhatsApp', icon: FaWhatsapp },
];

const STANDARD_FIELDS = [
  { name: 'fullName', label: 'Full Name', type: 'text', required: true, enabled: true, placeholder: 'e.g. Rahul Sharma' },
  { name: 'email', label: 'Email Address', type: 'email', required: true, enabled: true, placeholder: 'name@example.com' },
  { name: 'phone', label: 'Mobile Number', type: 'tel', required: false, enabled: true, placeholder: '+91 98765 43210' },
  { name: 'password', label: 'Password', type: 'password', required: true, enabled: true, placeholder: '••••••••' },
  { name: 'gender', label: 'Gender', type: 'select', required: false, enabled: true, placeholder: 'Select Gender' },
  { name: 'dob', label: 'Date of Birth', type: 'date', required: false, enabled: false, placeholder: 'YYYY-MM-DD' },
  { name: 'address', label: 'Delivery Address', type: 'textarea', required: false, enabled: false, placeholder: 'Street address, city, pincode...' },
  { name: 'termsConsent', label: 'Terms & Privacy Consent Checkbox', type: 'checkbox', required: true, enabled: true, placeholder: '' },
  { name: 'newsletterConsent', label: 'Subscribe to Newsletter Checkbox', type: 'checkbox', required: false, enabled: true, placeholder: '' },
];

const AuthenticationManager = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('METHODS'); // METHODS | FIELDS | VERIFICATION | POLICY | SOCIAL | UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Auth Configuration State
  const [availableMethods, setAvailableMethods] = useState(DEFAULT_LOGIN_METHODS);
  const [loginMethods, setLoginMethods] = useState(['EMAIL', 'MOBILE', 'OTP_LOGIN']);
  const [enableRegistration, setEnableRegistration] = useState(true);
  const [formFields, setFormFields] = useState(STANDARD_FIELDS);
  const [verificationMethod, setVerificationMethod] = useState('NONE');
  const [requireAdminApproval, setRequireAdminApproval] = useState(false);
  const [passwordPolicy, setPasswordPolicy] = useState({ minLength: 6, requireNumbers: false, requireSymbols: false });
  const [socialLogins, setSocialLogins] = useState({ google: true, facebook: true, apple: false, github: false });
  const [uiSettings, setUiSettings] = useState({
    welcomeTitle: 'Welcome Back to StyleVerse',
    loginButtonText: 'Sign In',
    registerButtonText: 'Create Account',
    bannerUrl: '',
  });

  // Modal State for Adding Custom Login Method
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [newMethod, setNewMethod] = useState({ id: '', label: '', desc: '' });

  // Modal State for Adding Custom Registration Field
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [newField, setNewField] = useState({ name: '', label: '', type: 'text', placeholder: '', required: false, enabled: true });

  const fetchAuthSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/settings/admin');
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        if (d.loginMethods) {
          try {
            const parsed = typeof d.loginMethods === 'string' ? JSON.parse(d.loginMethods) : d.loginMethods;
            if (Array.isArray(parsed)) {
              setLoginMethods(parsed);
              // Check if any custom methods were saved
              parsed.forEach((mId) => {
                if (!DEFAULT_LOGIN_METHODS.some(dm => dm.id === mId)) {
                  setAvailableMethods(prev => {
                    if (prev.some(p => p.id === mId)) return prev;
                    return [...prev, { id: mId, label: mId.replace(/_/g, ' '), desc: `Custom Login Method: ${mId}`, icon: FiKey }];
                  });
                }
              });
            }
          } catch (e) {}
        }
        if (d.enableRegistration !== undefined) setEnableRegistration(d.enableRegistration);
        if (d.formFields) {
          try {
            const parsedFields = typeof d.formFields === 'string' ? JSON.parse(d.formFields) : d.formFields;
            if (Array.isArray(parsedFields)) setFormFields(parsedFields);
          } catch (e) {}
        }
        if (d.verificationMethod) setVerificationMethod(d.verificationMethod);
        if (d.requireAdminApproval !== undefined) setRequireAdminApproval(d.requireAdminApproval);
        if (d.passwordPolicy) {
          try {
            const parsedPolicy = typeof d.passwordPolicy === 'string' ? JSON.parse(d.passwordPolicy) : d.passwordPolicy;
            setPasswordPolicy(parsedPolicy);
          } catch (e) {}
        }
        if (d.socialLogins) {
          try {
            const parsedSocial = typeof d.socialLogins === 'string' ? JSON.parse(d.socialLogins) : d.socialLogins;
            setSocialLogins(parsedSocial);
          } catch (e) {}
        }
        if (d.uiSettings) {
          try {
            const parsedUi = typeof d.uiSettings === 'string' ? JSON.parse(d.uiSettings) : d.uiSettings;
            setUiSettings(parsedUi);
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Failed to load auth settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        loginMethods,
        enableRegistration,
        formFields,
        verificationMethod,
        requireAdminApproval,
        passwordPolicy,
        socialLogins,
        uiSettings,
      };
      const res = await api.put('/auth/settings/admin', payload);
      toast.success('Authentication settings updated & live throughout the store!');
      if (res.data?.data) {
        dispatch(setAuthSettings(res.data.data));
        try {
          window.dispatchEvent(new CustomEvent('auth_settings_updated', { detail: res.data.data }));
          window.dispatchEvent(new Event('kvlr:content-updated'));
        } catch (e) {}
      }
    } catch (err) {
      console.error('Failed to save auth settings:', err);
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleLoginMethod = (method) => {
    setLoginMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const handleAddCustomMethod = (e) => {
    e.preventDefault();
    const cleanId = newMethod.id.trim().toUpperCase().replace(/\s+/g, '_');
    if (!cleanId || !newMethod.label) {
      return toast.error('Please enter a Method ID and Display Label');
    }
    if (availableMethods.some(m => m.id === cleanId)) {
      return toast.error('This login method ID already exists');
    }
    const item = {
      id: cleanId,
      label: newMethod.label.trim(),
      desc: newMethod.desc.trim() || `Login with ${newMethod.label.trim()}`,
      icon: FiKey,
      isCustom: true
    };
    setAvailableMethods(prev => [...prev, item]);
    setLoginMethods(prev => [...prev, cleanId]);
    setShowAddMethodModal(false);
    setNewMethod({ id: '', label: '', desc: '' });
    toast.success(`Custom login method "${item.label}" added!`);
  };

  const handleAddCustomField = (e) => {
    e.preventDefault();
    const cleanName = newField.name.trim().replace(/[^a-zA-Z0-9]/g, '');
    if (!cleanName || !newField.label) {
      return toast.error('Please enter a Field Key Name and Label');
    }
    if (formFields.some(f => f.name.toLowerCase() === cleanName.toLowerCase())) {
      return toast.error('A field with this name already exists');
    }
    const item = {
      name: cleanName,
      label: newField.label.trim(),
      type: newField.type,
      placeholder: newField.placeholder.trim(),
      required: Boolean(newField.required),
      enabled: true,
      isCustom: true
    };
    setFormFields(prev => [...prev, item]);
    setShowAddFieldModal(false);
    setNewField({ name: '', label: '', type: 'text', placeholder: '', required: false, enabled: true });
    toast.success(`Custom field "${item.label}" added!`);
  };

  const removeField = (name) => {
    setFormFields(prev => prev.filter(f => f.name !== name));
    toast.info(`Field "${name}" removed`);
  };

  const updateFieldConfig = (index, key, val) => {
    setFormFields((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: val };
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-charcoal-900 border border-gold-500/30 p-6 rounded-3xl shadow-2xl">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-gold-400">ENTERPRISE CRM SECURITY</span>
          <h1 className="text-2xl font-serif font-bold text-white mt-1">Authentication Manager</h1>
          <p className="text-xs text-gray-400 mt-1">
            Configure customer login methods, OTP sign-in, registration fields, password policy, social logins, and account verification.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gold-500 hover:bg-gold-400 text-charcoal-900 font-extrabold text-xs transition-all shadow-lg cursor-pointer disabled:opacity-50"
        >
          <FiSave className="w-4 h-4" /> {saving ? 'Saving Changes...' : 'Save Settings'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white p-2 rounded-2xl shadow-sm overflow-x-auto">
        {[
          { id: 'METHODS', label: '1. Login Methods' },
          { id: 'FIELDS', label: '2. Registration Form Builder' },
          { id: 'VERIFICATION', label: '3. Verification & Approval' },
          { id: 'POLICY', label: '4. Password Policy' },
          { id: 'SOCIAL', label: '5. Social Logins' },
          { id: 'UI', label: '6. UI & Branding' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-gold-500 text-charcoal-900 shadow'
                : 'text-gray-500 hover:text-charcoal-900 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Tab Content */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-500">Loading Auth Configuration...</p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">

          {/* TAB 1: LOGIN METHODS */}
          {activeTab === 'METHODS' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                <div>
                  <h3 className="text-base font-bold text-charcoal-900 mb-1">Supported Customer Login Methods</h3>
                  <p className="text-xs text-gray-500">Choose which credentials customers can use to sign into their accounts. Changes reflect live on customer login forms.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddMethodModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-charcoal-900 hover:bg-black text-gold-400 font-bold text-xs shadow transition cursor-pointer self-start sm:self-auto"
                >
                  <FiPlus className="w-4 h-4" /> Add Login Option
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableMethods.map((m) => {
                  const enabled = loginMethods.includes(m.id);
                  const Icon = m.icon || FiKey;
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleLoginMethod(m.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        enabled ? 'border-gold-500 bg-gold-50/50 ring-2 ring-gold-500/20' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${enabled ? 'text-gold-600' : 'text-gray-400'}`} />
                            <span className="text-sm font-bold text-charcoal-900">{m.label}</span>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            enabled ? 'bg-gold-500 border-gold-600 text-white' : 'bg-white border-gray-300'
                          }`}>
                            {enabled && <FiCheck className="w-3 h-3" />}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">{m.desc}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                        <span className={`font-bold ${enabled ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {enabled ? '● Active' : '○ Inactive'}
                        </span>
                        <span className="text-gray-400 font-mono text-[10px]">{m.id}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: REGISTRATION FORM BUILDER */}
          {activeTab === 'FIELDS' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h3 className="text-base font-bold text-charcoal-900">Registration Master Toggle & Form Builder</h3>
                  <p className="text-xs text-gray-500">Enable or disable registration, and customize or add fields for new customer accounts.</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 font-bold text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableRegistration}
                      onChange={(e) => setEnableRegistration(e.target.checked)}
                      className="w-4 h-4 rounded text-gold-500 focus:ring-gold-500"
                    />
                    <span>Allow New Registrations</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddFieldModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-charcoal-900 hover:bg-black text-gold-400 font-bold text-xs shadow transition cursor-pointer"
                  >
                    <FiPlus className="w-4 h-4" /> Add Field
                  </button>
                </div>
              </div>

              {/* Form Fields Config List */}
              <div className="space-y-3">
                {formFields.map((field, idx) => (
                  <div key={field.name} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto min-w-[160px]">
                      <input
                        type="checkbox"
                        checked={field.enabled}
                        onChange={(e) => updateFieldConfig(idx, 'enabled', e.target.checked)}
                        className="w-4 h-4 rounded text-gold-500 cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-bold text-charcoal-900">{field.label || field.name}</p>
                        <span className="text-[10px] text-gray-400 font-mono">key: {field.name} • {field.type}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 w-full max-w-md">
                      <input
                        type="text"
                        placeholder="Field Label"
                        value={field.label}
                        onChange={(e) => updateFieldConfig(idx, 'label', e.target.value)}
                        className="px-3 py-1.5 rounded-lg border text-xs bg-white focus:outline-none focus:border-gold-500"
                      />
                      <input
                        type="text"
                        placeholder="Placeholder Text"
                        value={field.placeholder}
                        onChange={(e) => updateFieldConfig(idx, 'placeholder', e.target.value)}
                        className="px-3 py-1.5 rounded-lg border text-xs bg-white focus:outline-none focus:border-gold-500"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-charcoal-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateFieldConfig(idx, 'required', e.target.checked)}
                          className="rounded text-gold-500"
                        />
                        Required
                      </label>
                      {field.isCustom && (
                        <button
                          type="button"
                          onClick={() => removeField(field.name)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition cursor-pointer"
                          title="Delete Custom Field"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: VERIFICATION & APPROVAL */}
          {activeTab === 'VERIFICATION' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-2">
                    Account Verification Method
                  </label>
                  <select
                    value={verificationMethod}
                    onChange={(e) => setVerificationMethod(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500"
                  >
                    <option value="NONE">No Verification (Instant Access)</option>
                    <option value="EMAIL_OTP">Email OTP Verification</option>
                    <option value="MOBILE_OTP">Mobile OTP Verification</option>
                    <option value="ADMIN_APPROVAL">Admin Approval Required</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-3 p-4 rounded-2xl border border-gray-200 bg-gray-50/50 w-full cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireAdminApproval}
                      onChange={(e) => setRequireAdminApproval(e.target.checked)}
                      className="w-5 h-5 rounded text-gold-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-charcoal-900">Require Manual Admin Approval</p>
                      <p className="text-[10px] text-gray-500">New customer accounts will be set to Pending status until an Admin approves them.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PASSWORD POLICY */}
          {activeTab === 'POLICY' && (
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                  Minimum Password Length
                </label>
                <input
                  type="number"
                  min="4"
                  max="32"
                  value={passwordPolicy.minLength}
                  onChange={(e) => setPasswordPolicy({ ...passwordPolicy, minLength: parseInt(e.target.value) || 6 })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-charcoal-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={passwordPolicy.requireNumbers}
                  onChange={(e) => setPasswordPolicy({ ...passwordPolicy, requireNumbers: e.target.checked })}
                  className="rounded text-gold-500"
                />
                Require at least one numeric digit (0-9)
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-charcoal-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={passwordPolicy.requireSymbols}
                  onChange={(e) => setPasswordPolicy({ ...passwordPolicy, requireSymbols: e.target.checked })}
                  className="rounded text-gold-500"
                />
                Require at least one special character (!@#$%^&*)
              </label>
            </div>
          )}

          {/* TAB 5: SOCIAL LOGINS */}
          {activeTab === 'SOCIAL' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-charcoal-900">Enable Third-Party Social Logins</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'google', label: 'Google OAuth Login' },
                  { key: 'facebook', label: 'Facebook Login' },
                  { key: 'apple', label: 'Sign in with Apple' },
                  { key: 'github', label: 'GitHub Login' },
                ].map((s) => (
                  <label key={s.key} className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-gray-50/50 cursor-pointer">
                    <span className="text-xs font-bold text-charcoal-900">{s.label}</span>
                    <input
                      type="checkbox"
                      checked={!!socialLogins[s.key]}
                      onChange={(e) => setSocialLogins({ ...socialLogins, [s.key]: e.target.checked })}
                      className="w-5 h-5 rounded text-gold-500"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: UI & BRANDING */}
          {activeTab === 'UI' && (
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                  Login Welcome Title
                </label>
                <input
                  type="text"
                  value={uiSettings.welcomeTitle}
                  onChange={(e) => setUiSettings({ ...uiSettings, welcomeTitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                  Sign In Button Text
                </label>
                <input
                  type="text"
                  value={uiSettings.loginButtonText}
                  onChange={(e) => setUiSettings({ ...uiSettings, loginButtonText: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                  Create Account Button Text
                </label>
                <input
                  type="text"
                  value={uiSettings.registerButtonText}
                  onChange={(e) => setUiSettings({ ...uiSettings, registerButtonText: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>
          )}

        </div>
      )}

      {/* Modal: Add Custom Login Method */}
      <AnimatePresence>
        {showAddMethodModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-serif font-bold text-lg text-charcoal-900">Add New Login Option</h3>
                <button
                  type="button"
                  onClick={() => setShowAddMethodModal(false)}
                  className="text-gray-400 hover:text-gray-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddCustomMethod} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal-900 uppercase mb-1">Method Identifier Key *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PASSKEY, QR_LOGIN, GOOGLE_ONE_TAP"
                    value={newMethod.id}
                    onChange={(e) => setNewMethod({ ...newMethod, id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono uppercase bg-gray-50 focus:bg-white focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-900 uppercase mb-1">Display Label *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Biometric Passkey, QR Code Login"
                    value={newMethod.label}
                    onChange={(e) => setNewMethod({ ...newMethod, label: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-900 uppercase mb-1">Description / Subtitle</label>
                  <input
                    type="text"
                    placeholder="e.g. Instant login using device fingerprint or face"
                    value={newMethod.desc}
                    onChange={(e) => setNewMethod({ ...newMethod, desc: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddMethodModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-extrabold bg-gold-500 hover:bg-gold-400 text-charcoal-900 shadow cursor-pointer"
                  >
                    Add Login Method
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Add Custom Registration Field */}
      <AnimatePresence>
        {showAddFieldModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-serif font-bold text-lg text-charcoal-900">Add Registration Field</h3>
                <button
                  type="button"
                  onClick={() => setShowAddFieldModal(false)}
                  className="text-gray-400 hover:text-gray-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddCustomField} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal-900 uppercase mb-1">Field Key (JSON property) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. alternatePhone, anniversaryDate, referralCode"
                    value={newField.name}
                    onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono bg-gray-50 focus:bg-white focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-900 uppercase mb-1">Field Label *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alternate Phone Number, Anniversary Date"
                    value={newField.label}
                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-charcoal-900 uppercase mb-1">Input Type</label>
                    <select
                      value={newField.type}
                      onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-gold-500"
                    >
                      <option value="text">Text Input</option>
                      <option value="tel">Phone / Mobile</option>
                      <option value="email">Email</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="textarea">Textarea</option>
                      <option value="checkbox">Consent Checkbox</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-charcoal-900 uppercase mb-1">Placeholder</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 99999 99999"
                      value={newField.placeholder}
                      onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 pt-2 text-xs font-bold text-charcoal-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newField.required}
                    onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                    className="w-4 h-4 rounded text-gold-500"
                  />
                  <span>Mark as Mandatory / Required Field</span>
                </label>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddFieldModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-extrabold bg-gold-500 hover:bg-gold-400 text-charcoal-900 shadow cursor-pointer"
                  >
                    Add Field to Form
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthenticationManager;
