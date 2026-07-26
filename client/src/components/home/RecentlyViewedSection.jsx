import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiTrash2 } from 'react-icons/fi';
import api from '../../config/api';
import ProductCard from '../common/ProductCard';

const RecentlyViewedSection = ({ currentId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentlyViewed = async () => {
    try {
      setLoading(true);
      const res = await api.get('/recently-viewed');
      if (res.data?.success && res.data?.data) {
        let items = res.data.data;
        if (currentId) {
          items = items.filter((p) => p.id !== currentId);
        }
        setProducts(items);
      }
    } catch (err) {
      console.error('Recently viewed fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentlyViewed();
  }, [currentId]);

  const handleClearHistory = async () => {
    try {
      await api.delete('/recently-viewed');
      setProducts([]);
    } catch (err) {
      console.error('Clear recently viewed error:', err);
    }
  };

  if (loading || products.length === 0) return null;

  return (
    <section className="my-12 py-8 bg-gray-50/80 rounded-3xl border border-gray-100 p-6">
      <div className="flex items-center justify-between border-b border-gray-200/60 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <FiClock className="w-5 h-5 text-gold-600" />
          <div>
            <h2 className="text-xl font-serif font-bold text-charcoal-900">Recently Viewed Products</h2>
            <p className="text-xs text-gray-500">Pick up right where you left off</p>
          </div>
        </div>
        <button
          onClick={handleClearHistory}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600 font-semibold transition cursor-pointer"
        >
          <FiTrash2 size={13} /> Clear History
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        {products.slice(0, 8).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewedSection;
