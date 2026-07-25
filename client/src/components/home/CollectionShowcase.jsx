import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiHeart, FiShoppingBag } from 'react-icons/fi';
import api from '../../config/api';
import { formatCurrency } from '../../utils/formatCurrency';

const fadeInUp = { initial: { opacity: 0, y: 25 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

const CollectionShowcase = ({ title, subtitle, categorySlug, bannerImage, bgLight = false }) => {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await api.get('/categories');
        const foundCat = catRes.data?.data?.find((c) => c.slug === categorySlug);
        if (foundCat) {
          setCategory(foundCat);
          const prodRes = await api.get(`/products?category=${foundCat.id}&limit=4`);
          setProducts(prodRes.data?.data?.products || []);
        }
      } catch (err) {
        console.error(`Failed to load ${categorySlug}:`, err);
      }
    };
    fetchData();
  }, [categorySlug]);

  if (products.length === 0) return null;

  return (
    <section className={`py-12 lg:py-16 ${bgLight ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Banner header if provided */}
        {bannerImage && (
          <div className="relative rounded-2xl overflow-hidden mb-8 h-48 sm:h-64 shadow-md">
            <img src={bannerImage} alt={title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex items-center p-6 lg:p-10">
              <div className="max-w-md text-white">
                <span className="text-xs font-bold text-gold-400 uppercase tracking-widest">CURATED COLLECTION</span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold mt-1">{title}</h2>
                {subtitle && <p className="text-sm text-gray-200 mt-2">{subtitle}</p>}
              </div>
            </div>
          </div>
        )}

        {!bannerImage && (
          <motion.div {...fadeInUp} className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">{title}</h2>
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
            <Link
              to={`/categories/${categorySlug}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-gold-600 hover:text-gold-700 transition"
            >
              Explore Collection <FiArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.map((product) => {
            const img = product.images?.[0]?.url || 'https://via.placeholder.com/300';
            return (
              <motion.div
                key={product.id}
                whileHover={{ y: -6 }}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
              >
                <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
                  <img
                    src={img}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {product.discountPercent > 0 && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                      -{product.discountPercent}%
                    </span>
                  )}
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-8 h-8 rounded-full bg-white/90 shadow text-gray-600 hover:text-red-500 flex items-center justify-center transition">
                      <FiHeart className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <Link to={`/product/${product.slug}`}>
                    <h3 className="text-sm font-semibold text-charcoal-900 line-clamp-1 hover:text-gold-600 transition mb-2">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-charcoal-900">
                      {formatCurrency(product.discountPrice || product.price)}
                    </span>
                    {product.discountPercent > 0 && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatCurrency(product.price)}
                      </span>
                    )}
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

export default CollectionShowcase;
