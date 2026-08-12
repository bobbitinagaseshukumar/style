import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import api from '../../config/api';

/**
 * Dynamic Mega Menu
 * Displays subcategories fetched from the API's nested subcategories array.
 * If zero subcategories exist, shows a simple "View All" link.
 */
const MegaMenu = ({ category, onMouseEnter, onMouseLeave }) => {
  const [subcategories, setSubcategories] = useState([]);
  const [parentCat, setParentCat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryData = async () => {
      setLoading(true);
      try {
        // Fetch categories and subcategories concurrently
        const [catsRes, subsRes] = await Promise.allSettled([
          api.get('/categories'),
          api.get('/subcategories?activeOnly=true')
        ]);

        const allCats = catsRes.status === 'fulfilled' ? (catsRes.value.data?.data || []) : [];
        const allSubs = subsRes.status === 'fulfilled' ? (subsRes.value.data?.data || []) : [];

        const targetKey = String(category || '').toLowerCase().trim();

        // Smart Category Matcher (resolves aliases like 'men' -> "Men's Wear", 'women' -> "Women's Sarees")
        const parent = allCats.find(c => {
          const cId = String(c.id || '').toLowerCase();
          const cSlug = String(c.slug || '').toLowerCase();
          const cName = String(c.name || '').toLowerCase();

          if (cId === targetKey || cSlug === targetKey || cName === targetKey) return true;
          if (cSlug.includes(targetKey) || targetKey.includes(cSlug)) return true;
          if (cName.includes(targetKey) || targetKey.includes(cName)) return true;

          // Special alias matching for header menu titles
          if (targetKey === 'men' && (cSlug.includes('men') || cName.includes('men'))) return true;
          if (targetKey === 'women' && (cSlug.includes('women') || cName.includes('women'))) return true;
          if (targetKey === 'kids' && (cSlug.includes('kid') || cName.includes('kid'))) return true;
          if (targetKey === 'jewellery' && (cSlug.includes('jewel') || cName.includes('jewel'))) return true;

          return false;
        });

        setParentCat(parent);

        let finalSubs = [];

        if (parent) {
          // 1. Check nested subcategories array on parent category
          if (Array.isArray(parent.subcategories) && parent.subcategories.length > 0) {
            finalSubs = parent.subcategories;
          } else {
            // 2. Filter from all active subcategories matching categoryId or category.id
            finalSubs = allSubs.filter(s =>
              s.categoryId === parent.id ||
              s.category?.id === parent.id ||
              s.category?.slug === parent.slug
            );
          }
        }

        // 3. Fallback: if parent category object was not found directly, filter all active subcategories by search key
        if (finalSubs.length === 0 && allSubs.length > 0) {
          finalSubs = allSubs.filter(s => {
            const catName = String(s.category?.name || '').toLowerCase();
            const catSlug = String(s.category?.slug || '').toLowerCase();
            const subSlug = String(s.slug || '').toLowerCase();
            return catName.includes(targetKey) || catSlug.includes(targetKey) || subSlug.includes(targetKey);
          });
        }

        setSubcategories(finalSubs);
      } catch (err) {
        console.error('Failed to fetch mega menu categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [category]);

  const containerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: 'easeOut' },
    },
    exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="fixed left-0 right-0 z-50 bg-[#0F0F0F]/98 backdrop-blur-2xl border-b border-white/10 shadow-[0_16px_64px_rgba(0,0,0,0.6)]"
      style={{ top: '80px' }}
    >
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-6 text-xs font-semibold text-gray-400">Loading Categories...</div>
        ) : (
          <div className="flex gap-8">
            {/* Dynamic Subcategories Column */}
            <div className="flex-1">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-4">
                {parentCat ? parentCat.name : category} Collection
              </h4>

              {subcategories.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No subcategories available yet.</p>
              ) : (
                <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {subcategories.map((sub) => (
                    <li key={sub.id}>
                      <Link
                        to={`/categories/${parentCat?.slug || category}?sub=${sub.slug}`}
                        className="group flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors duration-200"
                      >
                        <span className="w-0 group-hover:w-3 overflow-hidden transition-all duration-200 inline-block">
                          <FiArrowRight size={10} className="text-yellow-400 flex-shrink-0" />
                        </span>
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Quick Link CTA */}
            <div className="w-64 shrink-0 flex flex-col justify-end border-l border-white/10 pl-8">
              <Link
                to={`/categories/${parentCat?.slug || category}`}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-900 font-extrabold text-xs transition-all shadow-lg"
              >
                View All {parentCat?.name || category} <FiArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MegaMenu;
