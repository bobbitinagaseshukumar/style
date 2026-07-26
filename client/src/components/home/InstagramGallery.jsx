import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../config/api';
import {
  FiInstagram, FiFacebook, FiYoutube, FiTwitter, FiLinkedin, FiShare2, FiAtSign
} from 'react-icons/fi';
import { FaWhatsapp, FaTelegram, FaPinterest, FaSnapchat } from 'react-icons/fa';

const PLATFORM_ICONS = {
  INSTAGRAM: FiInstagram,
  FACEBOOK: FiFacebook,
  WHATSAPP: FaWhatsapp,
  WHATSAPP_CHANNEL: FaWhatsapp,
  TELEGRAM: FaTelegram,
  YOUTUBE: FiYoutube,
  X: FiTwitter,
  PINTEREST: FaPinterest,
  THREADS: FiAtSign,
  SNAPCHAT: FaSnapchat,
  LINKEDIN: FiLinkedin,
  CUSTOM: FiShare2
};

const InstagramGallery = () => {
  const [buttons, setButtons] = useState([]);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [socRes, setRes] = await Promise.allSettled([
          api.get('/cms/social-follow/public'),
          api.get('/cms/settings'),
        ]);

        if (setRes.status === 'fulfilled') {
          const cfg = setRes.value.data?.data || {};
          if (cfg.enableSocialFollow === false) {
            setEnabled(false);
            return;
          }
        }

        if (socRes.status === 'fulfilled' && socRes.value.data?.success) {
          setButtons(socRes.value.data.data || []);
        }
      } catch (err) {
        console.error('Social follow fetch error:', err);
      }
    };
    fetchData();
  }, []);

  if (!enabled || buttons.length === 0) return null;

  return (
    <section className="py-12 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="max-w-xl mx-auto mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-700 text-xs font-black mb-2 border border-pink-200">
            📱 JOIN OUR COMMUNITY
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">
            Connect With StyleVerse
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Follow our official social handles for exclusive reveals, fashion updates & VIP offers
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-4">
          {buttons.map((btn) => {
            const IconComp = PLATFORM_ICONS[btn.platform] || FiShare2;
            const bg = btn.bgColor || '#111827';
            const color = btn.textColor || '#FFFFFF';

            return (
              <motion.a
                key={btn.id}
                href={btn.profileUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                style={{ backgroundColor: bg, color: color }}
                className="px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm shadow-md hover:shadow-xl transition-all flex items-center gap-2.5 cursor-pointer border border-white/10"
              >
                {btn.customIconUrl ? (
                  <img src={btn.customIconUrl} alt="" className="w-5 h-5 object-contain" />
                ) : (
                  <IconComp className="w-5 h-5 shrink-0" />
                )}
                <span>{btn.buttonText || `Follow on ${btn.platform}`}</span>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default InstagramGallery;
