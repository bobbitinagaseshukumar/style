import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import api from '../../config/api';

const AnnouncementBar = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data } = await api.get('/cms/announcements');
        if (data?.success && data.data?.length > 0) {
          setAnnouncements(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch announcements:', err);
      }
    };
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [announcements.length]);

  if (dismissed || announcements.length === 0) return null;

  const current = announcements[currentIndex];

  return (
    <div
      style={{ backgroundColor: current.backgroundColor || '#D4AF37', color: current.textColor || '#FFFFFF' }}
      className="relative text-xs sm:text-sm font-medium py-2 px-4 shadow-sm transition-colors duration-500 z-50 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length)}
          className="p-1 hover:opacity-80 transition"
        >
          <FiChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 text-center truncate px-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id || currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-2"
            >
              <span className="font-bold tracking-wider">{current.title}:</span>
              <span>{current.message}</span>
              {current.link && (
                <a
                  href={current.link}
                  className="underline font-semibold hover:opacity-80 transition ml-1"
                >
                  {current.buttonText || 'Shop Now'} →
                </a>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % announcements.length)}
            className="p-1 hover:opacity-80 transition"
          >
            <FiChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => setDismissed(true)} className="p-1 hover:opacity-80 transition ml-2">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
