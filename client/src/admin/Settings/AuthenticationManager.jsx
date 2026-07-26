import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiLock, FiUserCheck, FiShield, FiSliders, FiCheck,
  FiSmartphone, FiMail, FiUser, FiEye, FiSave, FiAlertCircle, FiSettings
} from 'react-icons/fi';
import api from '../../config/api';

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
  const [activeTab, setActiveTab] = useState('METHODS'); // METHODS | FIELDS | VERIFICATION | POLICY | SOCIAL | UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Auth Configuration State
  const [loginMethods, setLoginMethods] = useState(['EMAIL', 'MOBILE']);
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

  const fetchAuthSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/settings/admin');
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        if (d.loginMethods) try { setLoginMethods(JSON.parse(d.loginMethods)); } catch (e) {}
        if (d.enableRegistration !== undefined) setEnableRegistration(d.enableRegistration);
        if (d.formFields) try { setFormFields(JSON.parse(d.formFields)); } catch (e) {}
        if (d.verificationMethod) setVerificationMethod(d.verificationMethod);
        if (d.requireAdminApproval !== undefined) setRequireAdminApproval(d.requireAdminApproval);
        if (d.passwordPolicy) try { setPasswordPolicy(JSON.parse(d.passwordPolicy)); } catch (e) {}
        if (d.socialLogins) try { setSocialLogins(JSON.parse(d.socialLogins)); } catch (e) {}
        if (d.uiSettings) try { setUiSettings(JSON.parse(d.uiSettings)); } catch (e) {}
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
      await api.put('/auth/settings/admin', {
        loginMethods,
        enableRegistration,
        formFields,
        verificationMethod,
        requireAdminApproval,
        passwordPolicy,
        socialLogins,
        uiSettings,
      });
      alert('Authentication Settings updated successfully! Customer login pages are now updated in real-time.');
    } catch (err) {
      console.error('Failed to save auth settings:', err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleLoginMethod = (method) => {
    setLoginMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
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
          <span className="text-xs font-bold uppercase tracking-widest text-gold-400">Enterprise CRM Security</span>
          <h1 className="text-2xl font-serif font-bold text-white mt-1">Authentication Manager</h1>
          <p className="text-xs text-gray-400 mt-1">
            Configure customer login methods, registration fields, password policy, social logins, and account verification.
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
              <div>
                <h3 className="text-base font-bold text-charcoal-900 mb-1">Supported Customer Login Methods</h3>
                <p className="text-xs text-gray-500">Choose which credentials customers can use to sign into their accounts.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'EMAIL', label: 'Email Address', desc: 'Login with Email + Password' },
                  { id: 'MOBILE', label: 'Mobile Number', desc: 'Login with Mobile Number + Password / OTP' },
                  { id: 'USERNAME', label: 'Username', desc: 'Login with Unique Username' },
                ].map((m) => {
                  const enabled = loginMethods.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleLoginMethod(m.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        enabled ? 'border-gold-500 bg-gold-50/50 ring-2 ring-gold-500/20' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-charcoal-900">{m.label}</span>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          enabled ? 'bg-gold-500 border-gold-600 text-white' : 'bg-white border-gray-300'
                        }`}>
                          {enabled && <FiCheck className="w-3 h-3" />}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{m.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: REGISTRATION FORM BUILDER */}
          {activeTab === 'FIELDS' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-base font-bold text-charcoal-900">Registration Master Toggle & Form Builder</h3>
                  <p className="text-xs text-gray-500">Enable or disable registration, and customize fields for new customer accounts.</p>
                </div>
                <label className="flex items-center gap-2 font-bold text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableRegistration}
                    onChange={(e) => setEnableRegistration(e.target.checked)}
                    className="w-4 h-4 rounded text-gold-500 focus:ring-gold-500"
                  />
                  <span>Allow New Customer Registrations</span>
                </label>
              </div>

              {/* Form Fields Config List */}
              <div className="space-y-3">
                {formFields.map((field, idx) => (
                  <div key={field.name} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <input
                        type="checkbox"
                        checked={field.enabled}
                        onChange={(e) => updateFieldConfig(idx, 'enabled', e.target.checked)}
                        className="w-4 h-4 rounded text-gold-500"
                      />
                      <div>
                        <p className="text-xs font-bold text-charcoal-900">{field.name}</p>
                        <span className="text-[10px] text-gray-400">Type: {field.type}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 w-full max-w-md">
                      <input
                        type="text"
                        placeholder="Field Label"
                        value={field.label}
                        onChange={(e) => updateFieldConfig(idx, 'label', e.target.value)}
                        className="px-3 py-1.5 rounded-lg border text-xs bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Placeholder Text"
                        value={field.placeholder}
                        onChange={(e) => updateFieldConfig(idx, 'placeholder', e.target.value)}
                        className="px-3 py-1.5 rounded-lg border text-xs bg-white"
                      />
                    </div>

                    <label className="flex items-center gap-1.5 text-xs font-semibold text-charcoal-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateFieldConfig(idx, 'required', e.target.checked)}
                        className="rounded text-gold-500"
                      />
                      Required Field
                    </label>
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
    </div>
  );
};

export default AuthenticationManager;
