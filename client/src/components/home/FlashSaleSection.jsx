import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiZap, FiHeart } from 'react-icons/fi';
import api from '../../config/api';
import { formatCurrency } from '../../utils/formatCurrency';

const DEFAULT_FLASH_SALE = {
  title: 'Grand Festive Flash Sale 🔥',
  description: 'Up to 50% OFF on Pure Silk Sarees & Bridal Kundan Jewellery Sets',
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  discountPercent: 35
};

const FlashSaleSection = ({ initialData }) => {
  const [flashSale, setFlashSale] = useState(initialData || null);
  const [products, setProducts] = useState(initialData?.products || []);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (initialData) {
      setFlashSale(initialData);
      if (initialData.products?.length > 0) setProducts(initialData.products);
      return;
    }
    const fetchData = async () => {
      try {
        const { data } = await api.get('/cms/flash-sale');
        if (data?.success && data.data) {
          setFlashSale(data.data);
          if (data.data.products?.length > 0) {
            setProducts(data.data.products);
          }
        }
      } catch (err) {
        console.error('Flash sale fetch error:', err);
      }
    };
    fetchData();
  }, [initialData]);

  useEffect(() => {
    if (!flashSale?.endDate) return;

    const calculateTime = () => {
      const diff = new Date(flashSale.endDate) - new Date();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [flashSale]);

  // If no active Flash Sale created by Admin, do not render section
  if (!flashSale || products.length === 0) return null;

  const bgColor = flashSale.bgColor || '#111827';
  const textColor = flashSale.textColor || '#FFFFFF';
  const buttonColor = flashSale.buttonColor || '#D4AF37';

  return (
    <section className="py-12 overflow-hidden relative transition-all" style={{ backgroundColor: bgColor, color: textColor }}>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 relative z-10">
        {/* Banner header image if uploaded */}
        {flashSale.bannerUrl && (
          <div className="w-full h-44 sm:h-64 rounded-3xl overflow-hidden mb-8 border border-white/10 shadow-2xl">
            <img src={flashSale.bannerUrl} alt={flashSale.name || ''} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-black mb-2 border border-red-500/30">
              <FiZap className="w-4 h-4 animate-bounce" /> FLASH SALE • LIMITED TIME
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold" style={{ color: textColor }}>{flashSale.name}</h2>
            {flashSale.description && <p className="text-gray-300 text-sm mt-1">{flashSale.description}</p>}
          </div>

          {/* Countdown Timer */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
            <span className="text-xs text-gray-300 font-bold flex items-center gap-1 mb-1 sm:mb-0">
              ⚡ SALE ENDS IN:
            </span>
            <div className="flex gap-2">
              {[
                { label: 'DAYS', val: timeLeft.days },
                { label: 'HRS', val: timeLeft.hours },
                { label: 'MIN', val: timeLeft.minutes },
                { label: 'SEC', val: timeLeft.seconds },
              ].map((t, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-base shadow-inner" style={{ color: buttonColor }}>
                    {String(t.val).padStart(2, '0')}
                  </div>
                  <span className="text-[9px] text-gray-300 mt-0.5 font-extrabold">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {products.map((product) => {
            const img = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600';
            const stockPct = Math.min(100, Math.max(15, (product.stock / 50) * 100));

            return (
              <motion.div
                key={product.id}
                whileHover={{ y: -6 }}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-gold-500/40 transition-all duration-300 group"
              >
                <div className="relative aspect-[3/4] bg-charcoal-900/50 overflow-hidden">
                  <img
                    src={img}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-red-600 text-white font-black text-[10px] px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                    ⚡ {product.discountPercent || 30}% OFF
                  </div>
                  <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:text-red-400 transition">
                    <FiHeart className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4">
                  <Link to={`/product/${product.slug}`}>
                    <h3 className="text-sm font-semibold text-white line-clamp-1 hover:text-gold-400 transition-colors mb-2">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold" style={{ color: buttonColor }}>
                      {formatCurrency(product.discountPrice || product.price)}
                    </span>
                    <span className="text-xs text-gray-400 line-through">
                      {formatCurrency(product.originalPrice || product.price)}
                    </span>
                  </div>

                  {/* Stock progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-gray-300">
                      <span>Available: <strong className="text-white">{product.stock}</strong></span>
                      <span className="text-red-400 font-semibold">Limited Time</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${stockPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FlashSaleSection;
