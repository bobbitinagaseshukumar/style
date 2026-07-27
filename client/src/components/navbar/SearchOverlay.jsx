import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { FiSearch, FiX, FiTrendingUp, FiArrowRight, FiStar } from 'react-icons/fi';
import api from '../../config/api';
import { formatCurrency } from '../../utils/formatCurrency';

const POPULAR_SEARCHES = ['Silk Sarees', 'Kundan Jewellery', 'Men Kurtas', 'Bridal Wear', 'Cotton Shirts', 'Kids Dresses'];

const SearchOverlay = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Focus input and lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key and keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          navigate(`/product/${suggestions[selectedIndex].slug}`);
          onClose();
        } else if (query.trim()) {
          navigate(`/search?q=${encodeURIComponent(query.trim())}`);
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, query, suggestions, selectedIndex, navigate, onClose]);

  // Live Predictive Search Fetcher
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products?search=${encodeURIComponent(query)}&limit=6`);
        const prods = res.data?.data?.products || res.data?.data || [];
        setSuggestions(prods);
      } catch (err) {
        console.error('Live search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelectTag = (tag) => {
    setQuery(tag);
    navigate(`/search?q=${encodeURIComponent(tag)}`);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-lg transition-opacity cursor-pointer"
        />

        {/* Floating Search Container */}
        <div className="relative w-full max-w-4xl mx-auto mt-12 sm:mt-20 px-4 z-10">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
          >
            {/* Search Input Header */}
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/60">
              <FiSearch className="w-6 h-6 text-gold-600 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(-1); }}
                placeholder="Search products by name, category, brand, SKU..."
                className="w-full text-base sm:text-lg font-medium text-charcoal-900 bg-transparent focus:outline-none placeholder-gray-400 allow-select"
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-1 text-gray-400 hover:text-gray-600 text-xs font-bold">
                  Clear
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-charcoal-900 rounded-full hover:bg-gray-200/50 transition cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Popular Searches when query is empty */}
              {!query.trim() && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                    <FiTrendingUp className="text-gold-500" /> Popular Searches
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SEARCHES.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleSelectTag(tag)}
                        className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gold-500 hover:text-white text-xs font-bold text-charcoal-900 transition-all cursor-pointer whitespace-nowrap"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading Spinner */}
              {loading && (
                <div className="py-8 text-center">
                  <div className="w-7 h-7 border-3 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-semibold">Searching catalog...</p>
                </div>
              )}

              {/* Live Matching Product Suggestions */}
              {!loading && query.trim() && (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                    <span>Matching Products ({suggestions.length})</span>
                    <span className="text-[10px] text-gray-400 font-normal">Use ↑↓ keys to navigate</span>
                  </div>

                  {suggestions.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 space-y-2">
                      <p className="text-sm font-semibold text-charcoal-800">No products found matching &quot;{query}&quot;</p>
                      <p className="text-xs text-gray-400">Try searching for sarees, jewellery, kurtas, or shirts.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {suggestions.map((p, idx) => {
                        const img = p.images?.[0]?.url || 'https://via.placeholder.com/80';
                        const isSelected = idx === selectedIndex;

                        return (
                          <div
                            key={p.id}
                            onClick={() => { navigate(`/product/${p.slug}`); onClose(); }}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                              isSelected ? 'bg-gold-50/80 border border-gold-300 ring-2 ring-gold-500/20' : 'hover:bg-gray-50 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <img src={img} alt={p.name} className="w-14 h-14 object-cover rounded-xl shrink-0" />
                              <div>
                                <p className="text-[10px] font-semibold uppercase text-gold-600">{p.category?.name || 'Item'}</p>
                                <h4 className="text-xs sm:text-sm font-bold text-charcoal-900 line-clamp-1">{p.name}</h4>
                                {p.rating > 0 && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <FiStar className="w-3 h-3 text-amber-400 fill-amber-400" />
                                    <span className="text-[10px] font-bold text-gray-700">{p.rating}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-sm font-extrabold text-charcoal-900">{formatCurrency(p.discountPrice || p.price)}</p>
                              {p.discountPercent > 0 && (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                  {p.discountPercent}% OFF
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* View All Search Results Footer */}
                  {query.trim() && (
                    <button
                      onClick={() => { navigate(`/search?q=${encodeURIComponent(query.trim())}`); onClose(); }}
                      className="w-full mt-4 py-3 rounded-xl bg-charcoal-900 hover:bg-black text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                    >
                      View All Results for &quot;{query}&quot; <FiArrowRight />
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default SearchOverlay;
