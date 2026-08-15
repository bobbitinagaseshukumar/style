import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatImageUrl } from '../../utils/formatImageUrl';

const RecentlyViewed = ({ currentProductId }) => {
  const [recentProducts, setRecentProducts] = useState([]);

  useEffect(() => {
    try {
      localStorage.removeItem('styleverse_recently_viewed');
      setRecentProducts([]);
    } catch (err) {
      console.error(err);
    }
  }, [currentProductId]);

  if (recentProducts.length === 0) return null;

  return (
    <div className="mt-16 border-t border-gray-100 pt-10">
      <h2 className="text-2xl font-serif font-bold text-charcoal-900 mb-6">Recently Viewed Products</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
        {recentProducts.map((product) => (
          <motion.div
            key={product.id}
            whileHover={{ y: -4 }}
            className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm group"
          >
            <Link to={`/product/${product.slug}`}>
              <div className="aspect-[3/4] bg-gray-50 overflow-hidden">
                <img
                  src={product.image || 'https://via.placeholder.com/300'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>
              <div className="p-3">
                <h3 className="text-xs font-semibold text-charcoal-900 truncate mb-1">{product.name}</h3>
                <span className="font-bold text-xs text-charcoal-900">{formatCurrency(product.price)}</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewed;
