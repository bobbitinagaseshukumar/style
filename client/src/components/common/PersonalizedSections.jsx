import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiHeart, FiStar, FiShoppingBag, FiLayers } from 'react-icons/fi';
import api from '../../config/api';
import ProductCard from './ProductCard';

const PersonalizedSections = () => {
  const [data, setData] = useState({
    continueShopping: [],
    inspiredByBrowsing: [],
    recommendedForYou: [],
    frequentlyBoughtTogether: [],
    becauseYouPurchased: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await api.get('/recommendations/personalized');
        if (res.data?.success && res.data?.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load personalized recommendations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) return null;

  return (
    <div className="space-y-12 my-12">
      {/* 1. Continue Shopping & Recently Viewed */}
      {data.continueShopping?.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <FiClock className="w-5 h-5 text-gold-500" />
              <div>
                <h2 className="text-xl font-serif font-bold text-charcoal-900">Continue Shopping</h2>
                <p className="text-xs text-gray-500">Pick up where you left off</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {data.continueShopping.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 2. Recommended Top Picks for You */}
      {data.recommendedForYou?.length > 0 && (
        <section className="space-y-4 bg-gradient-to-r from-gold-50/50 via-white to-gold-50/30 p-6 rounded-3xl border border-gold-200/50 shadow-sm">
          <div className="flex items-center justify-between border-b border-gold-200/60 pb-3">
            <div className="flex items-center gap-2">
              <FiStar className="w-5 h-5 text-gold-600" />
              <div>
                <h2 className="text-xl font-serif font-bold text-charcoal-900">Top Picks For You</h2>
                <p className="text-xs text-gold-700">AI-curated recommendations based on your preferences</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {data.recommendedForYou.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 3. Inspired by Your Browsing */}
      {data.inspiredByBrowsing?.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <FiLayers className="w-5 h-5 text-gold-500" />
              <div>
                <h2 className="text-xl font-serif font-bold text-charcoal-900">Inspired by Your Browsing</h2>
                <p className="text-xs text-gray-500">Matching your favorite categories and styles</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {data.inspiredByBrowsing.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 4. Frequently Bought Together */}
      {data.frequentlyBoughtTogether?.length > 0 && (
        <section className="space-y-4 bg-gray-50/80 p-6 rounded-3xl border border-gray-100">
          <div className="flex items-center justify-between border-b border-gray-200/60 pb-3">
            <div className="flex items-center gap-2">
              <FiShoppingBag className="w-5 h-5 text-charcoal-900" />
              <div>
                <h2 className="text-xl font-serif font-bold text-charcoal-900">Frequently Bought Together</h2>
                <p className="text-xs text-gray-500">Complete your look with matching accessories and outfits</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {data.frequentlyBoughtTogether.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default PersonalizedSections;
