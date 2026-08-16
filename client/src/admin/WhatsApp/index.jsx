/**
 * Admin WhatsApp Settings — Manage business WhatsApp number and order settings.
 * Changes reflect immediately across the entire website (floating button, checkout).
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa';
import {
  FiSave, FiPhone, FiClock, FiToggleLeft, FiToggleRight,
  FiCheckCircle, FiAlertCircle, FiInfo
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { setStoreSettings } from '../../redux/settings/settingsSlice';
import api from '../../config/api';

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-sm font-bold text-gray-700 mb-1.5">{label}</label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const Input = (props) => (
  <input {...props} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none transition" />
);

const Textarea = (props) => (
  <textarea {...props} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none resize-none" />
);

const AdminWhatsApp = () => {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    whatsappNumber: '919876543210',
    whatsappEnabled: true,
    whatsappBusinessName: 'KVLR Styles',
    whatsappWorkingHours: 'Mon-Sat 9AM-7PM',
    whatsappAutoReply: 'Thank you for contacting us! We will respond within 24 hours.',
    whatsappDefaultMessage: 'Hi! I would like to place an order from KVLR Styles.',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saved, setSaved] = useState(false);

  const loadSettings = () => {
    api.get('/cms/settings')
      .then(r => {
        const d = r.data?.data || {};
        const updated = {
          whatsappNumber: d.whatsappNumber || '',
          whatsappEnabled: d.whatsappEnabled !== false,
          whatsappBusinessName: d.whatsappBusinessName || 'KVLR Styles',
          whatsappWorkingHours: d.whatsappWorkingHours || 'Mon-Sat 9AM-7PM',
          whatsappAutoReply: d.whatsappAutoReply || 'Thank you for contacting us! We will respond within 24 hours.',
          whatsappDefaultMessage: d.whatsappDefaultMessage || d.defaultOrderMessage || 'Hi! I would like to place an order from KVLR Styles.',
        };
        setForm(prev => ({ ...prev, ...updated }));
        dispatch(setStoreSettings(d));
      })
      .catch(() => {
        api.get('/settings').then(r => {
          const d = r.data?.data || {};
          setForm(prev => ({
            ...prev,
            whatsappNumber: d.whatsappNumber || '',
            whatsappEnabled: d.whatsappEnabled !== false,
            whatsappBusinessName: d.whatsappBusinessName || 'KVLR Styles',
            whatsappWorkingHours: d.whatsappWorkingHours || 'Mon-Sat 9AM-7PM',
            whatsappAutoReply: d.whatsappAutoReply || prev.whatsappAutoReply,
          }));
        }).catch(() => {});
      })
      .finally(() => setFetching(false));
  };

  useEffect(() => {
    loadSettings();

    window.addEventListener('kvlr:content-updated', loadSettings);
    window.addEventListener('store_settings_updated', loadSettings);
    return () => {
      window.removeEventListener('kvlr:content-updated', loadSettings);
      window.removeEventListener('store_settings_updated', loadSettings);
    };
  }, []);

  const handleSave = async () => {
    if (!form.whatsappNumber.trim()) {
      toast.error('Please enter the business WhatsApp number');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        ...form,
        defaultOrderMessage: form.whatsappDefaultMessage,
        supportTiming: form.whatsappWorkingHours,
      };

      const res = await api.put('/cms/settings', payload).catch(() => api.put('/settings', payload));
      const updatedData = res.data?.data || payload;
      setSaved(true);

      // Dispatch to Redux & broadcast across all open pages
      dispatch(setStoreSettings(updatedData));
      window.dispatchEvent(new CustomEvent('store_settings_updated', { detail: updatedData }));
      window.dispatchEvent(new CustomEvent('kvlr:content-updated', { detail: { type: 'STORE_SETTINGS', payload: updatedData } }));

      toast.success('✨ WhatsApp settings saved to database & synchronized site-wide!');
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const toggle = (key) => setForm(f => ({ ...f, [key]: !f[key] }));

  const previewLink = form.whatsappNumber
    ? `https://wa.me/${form.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Hello! I have a question about an order.')}`
    : null;

  if (fetching) return (
    <div className="flex items-center justify-center py-20">
      <span className="w-8 h-8 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#25D366] flex items-center justify-center">
              <FaWhatsapp size={22} className="text-white" />
            </div>
            WhatsApp Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure your business WhatsApp number. Changes apply instantly site-wide.
          </p>
        </div>
      </div>

      {/* Enable / Disable toggle */}
      <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-900">WhatsApp Orders</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {form.whatsappEnabled
                ? 'Enabled — Customers can order via WhatsApp'
                : 'Disabled — WhatsApp option hidden from checkout'}
            </p>
          </div>
          <button onClick={() => toggle('whatsappEnabled')} className="flex-shrink-0">
            {form.whatsappEnabled
              ? <FiToggleRight size={36} className="text-green-500" />
              : <FiToggleLeft size={36} className="text-gray-300" />}
          </button>
        </div>
      </div>

      {/* Main settings card */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-5">
        <h2 className="text-base font-black text-gray-900">Business Configuration</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Business WhatsApp Number *"
            hint="Include country code, digits only. e.g. 919876543210"
          >
            <div className="relative">
              <FiPhone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="whatsappNumber"
                value={form.whatsappNumber}
                onChange={h}
                placeholder="919876543210"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none font-mono"
              />
            </div>
          </Field>

          <Field label="Business Name">
            <Input name="whatsappBusinessName" value={form.whatsappBusinessName} onChange={h} placeholder="KVLR Styles" />
          </Field>
        </div>

        <Field label="Working Hours" hint="Shown in the floating chat widget">
          <div className="relative">
            <FiClock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input name="whatsappWorkingHours" value={form.whatsappWorkingHours} onChange={h}
              placeholder="Mon-Sat 9AM-7PM"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
          </div>
        </Field>

        <Field label="Auto-Reply Message" hint="Displayed in the chat bubble when customer opens the widget">
          <Textarea name="whatsappAutoReply" value={form.whatsappAutoReply} onChange={h} rows={3}
            placeholder="Hi! Thank you for contacting us. We will reply shortly." />
        </Field>

        {/* Preview */}
        {previewLink && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1.5">
              <FiInfo size={11} /> Live Preview
            </p>
            <p className="text-xs text-green-700 mb-2">
              Your floating button will link to: <code className="bg-green-100 px-1 rounded">wa.me/{form.whatsappNumber.replace(/\D/g, '')}</code>
            </p>
            <a href={previewLink} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#1ebe57] transition">
              <FaWhatsapp size={14} /> Test in WhatsApp
            </a>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-black text-sm transition flex items-center justify-center gap-2 disabled:opacity-50
            bg-yellow-400 text-black hover:bg-yellow-300 shadow-lg shadow-yellow-100"
        >
          {loading
            ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Saving...</>
            : saved
              ? <><FiCheckCircle size={14} /> Saved! Changes are live</>
              : <><FiSave size={14} /> Save WhatsApp Settings</>
          }
        </button>
      </div>

      {/* How it works */}
      <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 space-y-3">
        <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">How It Works</h3>
        {[
          { icon: '1️⃣', text: 'Customer clicks "Buy Now" on any product page' },
          { icon: '2️⃣', text: 'A modal appears with Online Payment and WhatsApp Order options' },
          { icon: '3️⃣', text: 'If WhatsApp selected, customer\'s app opens with a pre-filled order message' },
          { icon: '4️⃣', text: 'Customer taps Send — you receive the complete order on WhatsApp' },
          { icon: '5️⃣', text: 'Order is also logged in your Admin Dashboard as "WhatsApp Pending"' },
          { icon: '6️⃣', text: 'Confirm the order in Admin → customer gets email + your WhatsApp notification' },
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3 text-sm text-gray-700">
            <span className="text-base">{step.icon}</span>
            <span>{step.text}</span>
          </div>
        ))}
      </div>

      {/* Message templates info */}
      <div className="bg-blue-50 border border-blue-100 rounded-3xl p-5">
        <h3 className="font-bold text-blue-800 text-sm mb-3">📱 Auto-Generated WhatsApp Messages</h3>
        <p className="text-xs text-blue-700 mb-3">
          When you update an order status, a WhatsApp deeplink is automatically generated so you can notify the customer with one click:
        </p>
        <div className="space-y-2">
          {[
            ['✅ Confirmed', 'Order confirmed + tracking link'],
            ['🚚 Shipped', 'Courier name + tracking number'],
            ['📦 Delivered', 'Delivery confirmation + review request'],
            ['❌ Cancelled', 'Cancellation reason + support link'],
          ].map(([status, desc]) => (
            <div key={status} className="flex items-center gap-3 text-xs text-blue-700">
              <span className="font-bold w-32">{status}</span>
              <span className="text-blue-600">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminWhatsApp;
