import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiCpu, FiEye, FiSettings, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import api from '../../config/api';
import { toast } from 'react-toastify';

/**
 * Admin Chatbot Management & Real-Time Live Preview Portal
 * Admin controls enable/disable, positions, desktop/mobile visibility, themes, and welcome messages.
 */
const ChatbotManager = () => {
  const [settings, setSettings] = useState({
    isEnabled: true,
    showOnMobile: true,
    showOnDesktop: true,
    position: 'bottom-right',
    theme: 'dark',
    welcomeMessage: "👋 Hello! Welcome to KVLR Styles. I'm your 24/7 AI Shopping Assistant. How can I help you today?",
    hideOnCheckout: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/chatbot-setting/settings');
        if (res.data?.data) setSettings(res.data.data);
      } catch (err) {
        toast.error('Failed to load chatbot settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/chatbot-setting/admin/settings', settings);
      toast.success('Chatbot settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save chatbot settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 text-charcoal-900 max-w-6xl mx-auto">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-charcoal-900 flex items-center gap-2">
            <FiCpu className="text-gold-600" /> AI Customer Assistant Chatbot Manager
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure widget visibility, positions, themes, and welcome messages with real-time live preview.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-black font-bold text-xs shadow hover:from-gold-400 transition flex items-center gap-1.5 cursor-pointer"
        >
          <FiSave className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Panel (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4 text-xs">
          <h2 className="font-bold text-sm text-charcoal-900 border-b pb-2">Control Parameters</h2>

          {/* Toggle Enable */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border">
            <div>
              <p className="font-bold text-gray-800">Enable AI Chatbot Widget</p>
              <p className="text-[10px] text-gray-500">Show floating AI shopping assistant across website</p>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, isEnabled: !settings.isEnabled })}
              className={`text-2xl transition ${settings.isEnabled ? 'text-emerald-600' : 'text-gray-400'}`}
            >
              {settings.isEnabled ? <FiToggleRight className="w-8 h-8" /> : <FiToggleLeft className="w-8 h-8" />}
            </button>
          </div>

          {/* Widget Position */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">Widget Position</label>
            <select
              value={settings.position}
              onChange={(e) => setSettings({ ...settings, position: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold"
            >
              <option value="bottom-right">Bottom Right Corner</option>
              <option value="bottom-left">Bottom Left Corner</option>
            </select>
          </div>

          {/* Theme */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">Chat Window Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold"
            >
              <option value="dark">Dark Luxury Velvet</option>
              <option value="gold">Gold Obsidian</option>
            </select>
          </div>

          {/* Welcome Message */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">Automated Greeting / Welcome Message</label>
            <textarea
              rows={3}
              value={settings.welcomeMessage}
              onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 text-xs font-medium"
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
              <input
                type="checkbox"
                checked={settings.hideOnCheckout}
                onChange={(e) => setSettings({ ...settings, hideOnCheckout: e.target.checked })}
              />
              Hide on Checkout Page
            </label>
          </div>
        </div>

        {/* Live Customer Preview (5 cols) */}
        <div className="lg:col-span-5 bg-[#0D0D0D] text-white rounded-2xl border border-gold-500/30 p-6 shadow-xl space-y-4">
          <div className="border-b border-white/10 pb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-gold-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiEye /> Admin Live Preview
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
              {settings.isEnabled ? 'ACTIVE' : 'DISABLED'}
            </span>
          </div>

          <div className="bg-charcoal-950 border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-gold-400 font-bold text-xs">
              <FiCpu /> KVLR AI Assistant
            </div>
            <div className="p-3 bg-white/10 rounded-xl text-xs text-white leading-relaxed border border-white/10">
              {settings.welcomeMessage}
            </div>
            <p className="text-[10px] text-gray-500">Position: {settings.position} • Theme: {settings.theme}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotManager;
