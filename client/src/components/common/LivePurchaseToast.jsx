import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheckCircle } from 'react-icons/fi';
import api from '../../config/api';

/**
 * Real-Time Verified Social Proof Purchase Toast
 * STRICT REQUIREMENT: Does NOT show fake popups!
 * Only displays if Admin enables Social Proof in Admin Dashboard AND fetches real delivered customer orders from DB.
 */
const LivePurchaseToast = () => {
  const [settings, setSettings] = useState(null);
  const [realOrders, setRealOrders] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchSettingsAndOrders = async () => {
      try {
        const setRes = await api.get('/social-proof/settings');
        const sData = setRes.data?.data;
        setSettings(sData);

        if (sData && sData.isEnabled) {
          const ordersRes = await api.get('/social-proof/recent-delivered-orders');
          if (ordersRes.data?.success && Array.isArray(ordersRes.data.data)) {
            setRealOrders(ordersRes.data.data);
          }
        }
      } catch (err) {
        // Silent fail
      }
    };
    fetchSettingsAndOrders();
  }, []);

  useEffect(() => {
    if (dismissed || !settings?.isEnabled || realOrders.length === 0) return;

    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, 4000);

    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % realOrders.length);
        setIsVisible(true);
      }, 800);
    }, settings.intervalTimeMs || 15000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [dismissed, settings, realOrders]);

  // If disabled by Admin or no real orders in database, DO NOT RENDER ANYTHING
  if (dismissed || !settings?.isEnabled || realOrders.length === 0) {
    return null;
  }

  const current = realOrders[currentIdx];
  if (!current) return null;

  const posClass = settings.position === 'bottom-right'
    ? 'bottom-20 right-4 sm:bottom-6 sm:right-6'
    : 'bottom-20 left-4 sm:bottom-6 sm:left-6';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className={`fixed ${posClass} z-40 max-w-[320px] bg-charcoal-900/95 border border-gold-500/30 text-white rounded-2xl p-3 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl flex items-center gap-3 select-none`}
        >
          <img
            src={current.image}
            alt={current.productName}
            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-white truncate">{current.name}</span>
              <span className="text-[10px] text-gray-400 font-normal">from {current.city}</span>
              <FiCheckCircle className="w-3 h-3 text-emerald-400 shrink-0 ml-auto" />
            </div>

            <p className="text-[11px] text-gold-400 font-semibold truncate leading-snug">
              Purchased {current.productName}
            </p>

            <span className="text-[9px] text-gray-500">Verified Delivered Order</span>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            title="Dismiss"
          >
            <FiX className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LivePurchaseToast;
