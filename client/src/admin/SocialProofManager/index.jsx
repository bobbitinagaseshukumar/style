import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiShield, FiSave, FiEye, FiSettings, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import api from '../../config/api';
import { toast } from 'react-toastify';

/**
 * Admin Social Proof Management Portal
 * Allows Admin to enable/disable social proof popups, choose screen position,
 * display interval, and fetch ONLY real delivered orders from the database.
 */
const SocialProofManager = () => {
  const [settings, setSettings] = useState({
    isEnabled: false,
    position: 'bottom-left',
    displayTimeMs: 5000,
    intervalTimeMs: 15000,
    onlyRealOrders: true,
  });
  const [realOrders, setRealOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [setRes, ordRes] = await Promise.all([
          api.get('/social-proof/settings'),
          api.get('/social-proof/recent-delivered-orders')
        ]);
        if (setRes.data?.data) setSettings(setRes.data.data);
        if (ordRes.data?.data) setRealOrders(ordRes.data.data);
      } catch (err) {
        toast.error('Failed to load social proof settings');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/social-proof/admin/settings', settings);
      toast.success('Social proof settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 text-charcoal-900 max-w-5xl mx-auto">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-charcoal-900 flex items-center gap-2">
            <FiCheckCircle className="text-emerald-600" /> Social Proof & Delivered Order Toasts
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Control customer purchase notifications. ONLY real delivered customer orders from your database are shown! No fake customer names generated.
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4 text-xs">
          <h2 className="font-bold text-sm text-charcoal-900 border-b pb-2">Configuration Settings</h2>

          {/* Toggle Enable */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border">
            <div>
              <p className="font-bold text-gray-800">Enable Social Proof Notifications</p>
              <p className="text-[10px] text-gray-500">Show real delivered customer order toasts</p>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, isEnabled: !settings.isEnabled })}
              className={`text-2xl transition ${settings.isEnabled ? 'text-emerald-600' : 'text-gray-400'}`}
            >
              {settings.isEnabled ? <FiToggleRight className="w-8 h-8" /> : <FiToggleLeft className="w-8 h-8" />}
            </button>
          </div>

          {/* Screen Position */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">Screen Position</label>
            <select
              value={settings.position}
              onChange={(e) => setSettings({ ...settings, position: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold"
            >
              <option value="bottom-left">Bottom Left Corner</option>
              <option value="bottom-right">Bottom Right Corner</option>
            </select>
          </div>

          {/* Display Duration */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">Toast Duration (Seconds)</label>
            <input
              type="number"
              value={settings.displayTimeMs / 1000}
              onChange={(e) => setSettings({ ...settings, displayTimeMs: parseInt(e.target.value || 5) * 1000 })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
            />
          </div>

          {/* Interval Gap */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">Interval Between Toasts (Seconds)</label>
            <input
              type="number"
              value={settings.intervalTimeMs / 1000}
              onChange={(e) => setSettings({ ...settings, intervalTimeMs: parseInt(e.target.value || 15) * 1000 })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
            />
          </div>
        </div>

        {/* Real Orders Preview Feed */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4 text-xs">
          <h2 className="font-bold text-sm text-charcoal-900 border-b pb-2 flex items-center justify-between">
            <span>Real Delivered Orders Stream</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {realOrders.length} Delivered
            </span>
          </h2>

          {realOrders.length === 0 ? (
            <p className="text-gray-400 py-8 text-center">No delivered orders found in database yet.</p>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto">
              {realOrders.map((ord) => (
                <div key={ord.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center gap-3">
                  <img src={ord.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-charcoal-900 text-xs truncate">{ord.productName}</p>
                    <p className="text-[10px] text-gray-500">{ord.name} from {ord.city}</p>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialProofManager;
