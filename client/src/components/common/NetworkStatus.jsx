import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiWifi, FiWifiOff } from 'react-icons/fi';

/**
 * NetworkStatus — Global offline/online detection banner.
 * Shows a non-intrusive banner when user loses internet connection,
 * and a brief "Back online!" confirmation when reconnected.
 */
const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);
  const wasOffline = useRef(false);
  const reconnectTimer = useRef(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline.current) {
        setShowReconnected(true);
        wasOffline.current = false;
        // Auto-dismiss "back online" banner after 3 seconds
        reconnectTimer.current = setTimeout(() => {
          setShowReconnected(false);
        }, 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      wasOffline.current = true;
      setShowReconnected(false);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, []);

  // Dispatch custom events so other components (Checkout) can react
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('kvlr:network-status', { detail: { isOnline } }));
  }, [isOnline]);

  return (
    <AnimatePresence>
      {/* Offline Banner */}
      {!isOnline && (
        <motion.div
          key="offline"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium shadow-lg"
        >
          <FiWifiOff className="w-4 h-4 animate-pulse" />
          <span>You're offline. Check your internet connection.</span>
        </motion.div>
      )}

      {/* Reconnected Banner */}
      {showReconnected && isOnline && (
        <motion.div
          key="online"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-emerald-600 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium shadow-lg"
        >
          <FiWifi className="w-4 h-4" />
          <span>Back online! ✓</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetworkStatus;
