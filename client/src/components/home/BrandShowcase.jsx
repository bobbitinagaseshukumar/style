import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../config/api';

const DEFAULT_BRANDS = [
  { id: 'b1', name: 'KVLR Couture', logoUrl: '👑' },
  { id: 'b2', name: 'Royal Heritage', logoUrl: '💎' },
  { id: 'b3', name: 'Silk Weavers Guild', logoUrl: '🥻' },
  { id: 'b4', name: 'Kundan Artisan House', logoUrl: '✨' },
  { id: 'b5', name: 'Imperial Jewels', logoUrl: '🏆' },
];

const BrandShowcase = () => {
  const [brands, setBrands] = useState(DEFAULT_BRANDS);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const { data } = await api.get('/cms/brands');
        if (data?.success && data.data?.length > 0) setBrands(data.data);
      } catch (err) {
        console.error('Brand showcase error:', err);
      }
    };
    fetchBrands();
  }, []);

  return (
    <section className="py-10 bg-gray-50 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
          Featured Heritage Brands & Artisans
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
          {brands.map((brand) => (
            <motion.div
              key={brand.id}
              whileHover={{ scale: 1.08 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-sm border border-gray-100 cursor-pointer text-charcoal-900 font-serif font-bold text-base"
            >
              <span className="text-2xl">{brand.logoUrl}</span>
              <span>{brand.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandShowcase;
