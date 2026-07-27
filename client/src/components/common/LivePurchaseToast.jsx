import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheckCircle, FiShoppingBag } from 'react-icons/fi';

const SAMPLE_NOTIFICATIONS = [
  {
    name: 'Ananya S.',
    location: 'Mumbai',
    product: 'Royal Silk Kanjeevaram Saree',
    timeAgo: '2 mins ago',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=150',
  },
  {
    name: 'Rahul V.',
    location: 'Bangalore',
    product: "Men's Heritage Tuxedo Suit",
    timeAgo: '5 mins ago',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=150',
  },
  {
    name: 'Priya K.',
    location: 'Delhi NCR',
    product: 'Gold Diamond Solitaire Pendant',
    timeAgo: '1 min ago',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=150',
  },
  {
    name: 'Vikram M.',
    location: 'Hyderabad',
    product: 'Handcrafted Velvet Sherwani',
    timeAgo: '4 mins ago',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=150',
  },
];

/**
 * Real-time Social Proof Live Purchase Toast
 * Displays subtle popups showing recent customer activity & purchases.
 */
const LivePurchaseToast = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    // Show initial toast after 4 seconds
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, 4000);

    // Rotate toast every 12 seconds
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % SAMPLE_NOTIFICATIONS.length);
        setIsVisible(true);
      }, 800);
    }, 12000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [dismissed]);

  if (dismissed) return null;

  const current = SAMPLE_NOTIFICATIONS[currentIdx];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="fixed bottom-20 left-4 sm:bottom-6 sm:left-6 z-40 max-w-[320px] bg-charcoal-900/95 border border-gold-500/30 text-white rounded-2xl p-3 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl flex items-center gap-3 select-none"
        >
          <img
            src={current.image}
            alt={current.product}
            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-white truncate">{current.name}</span>
              <span className="text-[10px] text-gray-400 font-normal">from {current.location}</span>
              <FiCheckCircle className="w-3 h-3 text-emerald-400 shrink-0 ml-auto" />
            </div>

            <p className="text-[11px] text-gold-400 font-semibold truncate leading-snug">
              Purchased {current.product}
            </p>

            <span className="text-[9px] text-gray-500">{current.timeAgo} • Verified Order</span>
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
