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

const DEFAULT_PRODUCTS = [
  {
    id: 'flash-1',
    name: 'Kanjivaram Pure Silk Saree with Zari Border',
    slug: 'kanjivaram-pure-silk-saree',
    price: 18999,
    discountPrice: 13999,
    discountPercent: 26,
    stock: 12,
    images: [{ url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600' }]
  },
  {
    id: 'flash-2',
    name: '22K Gold Plated Royal Kundan Choker Necklace Set',
    slug: 'royal-kundan-choker-necklace-set',
    price: 11999,
    discountPrice: 7999,
    discountPercent: 33,
    stock: 8,
    images: [{ url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600' }]
  },
  {
    id: 'flash-3',
    name: 'Handcrafted Heritage Art Silk Kurta Set',
    slug: 'heritage-art-silk-kurta-set',
    price: 5999,
    discountPrice: 3999,
    discountPercent: 33,
    stock: 15,
    images: [{ url: 'https://images.unsplash.com/photo-1597983073493-88cd35cf03b0?w=600' }]
  },
  {
    id: 'flash-4',
    name: 'Antique Temple Work Gold Plated Bangles',
    slug: 'antique-temple-gold-plated-bangles',
    price: 3999,
    discountPrice: 2499,
    discountPercent: 37,
    stock: 20,
    images: [{ url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600' }]
  }
];

const FlashSaleSection = () => {
  const [flashSale, setFlashSale] = useState(DEFAULT_FLASH_SALE);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [timeLeft, setTimeLeft] = useState({ hours: 18, minutes: 42, seconds: 10 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [saleRes, prodRes] = await Promise.all([
          api.get('/cms/flash-sale'),
          api.get('/products?flashSale=true&limit=4'),
        ]);

        if (saleRes.data?.success && saleRes.data.data) {
          setFlashSale(saleRes.data.data);
        }
        if (prodRes.data?.success && prodRes.data.data?.products?.length > 0) {
          setProducts(prodRes.data.data.products);
        }
      } catch (err) {
        console.error('Flash sale fetch error:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!flashSale?.endTime) return;

    const calculateTime = () => {
      const diff = new Date(flashSale.endTime) - new Date();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [flashSale]);

  return (
    <section className="py-12 bg-gradient-to-r from-charcoal-900 via-charcoal-800 to-charcoal-900 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold mb-2">
              <FiZap className="w-4 h-4 animate-bounce" /> LIMITED TIME OFFER
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">{flashSale.title}</h2>
            <p className="text-gray-400 text-sm mt-1">{flashSale.description}</p>
          </div>

          {/* Countdown Timer */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium">Ends in:</span>
            <div className="flex gap-2">
              {[
                { label: 'HRS', val: timeLeft.hours },
                { label: 'MIN', val: timeLeft.minutes },
                { label: 'SEC', val: timeLeft.seconds },
              ].map((t, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-gold-400 font-bold text-lg shadow-inner">
                    {String(t.val).padStart(2, '0')}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 font-semibold">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
                  <div className="absolute top-3 left-3 bg-red-600 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-lg">
                    -{flashSale.discountPercent || product.discountPercent}%
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
                    <span className="text-lg font-bold text-gold-400">
                      {formatCurrency(product.discountPrice || product.price)}
                    </span>
                    <span className="text-xs text-gray-400 line-through">
                      {formatCurrency(product.price)}
                    </span>
                  </div>

                  {/* Stock progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>Available: <strong className="text-white">{product.stock}</strong></span>
                      <span className="text-red-400 font-semibold">Almost Sold Out</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-gold-500 rounded-full transition-all duration-500"
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
