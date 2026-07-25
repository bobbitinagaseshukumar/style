import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiX, FiShoppingBag, FiHeart } from 'react-icons/fi';
import api from '../../config/api';
import { formatCurrency } from '../../utils/formatCurrency';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/products?search=${encodeURIComponent(query)}&limit=20`);
        setResults(data.data?.products || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Search Bar Input */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gold-600" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchParams({ q: e.target.value });
              }}
              placeholder="Search sarees, jewellery, kurtis, lehengas..."
              autoFocus
              className="w-full pl-14 pr-12 py-4 rounded-full border-2 border-gold-400 focus:border-gold-500 focus:ring-4 focus:ring-gold-500/20 focus:outline-none text-base font-medium shadow-lg"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setSearchParams({});
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Results Info */}
        {query && (
          <div className="mb-6 text-sm text-gray-500">
            Showing search results for &ldquo;<strong className="text-charcoal-900">{query}</strong>&rdquo; ({results.length} found)
          </div>
        )}

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-gray-200 rounded-2xl" />
            ))}
          </div>
        ) : results.length === 0 && query ? (
          <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-3xl border border-gray-100 max-w-lg mx-auto">
            No products found matching &ldquo;{query}&rdquo;. Try searching for &ldquo;Saree&rdquo;, &ldquo;Kundan&rdquo;, or &ldquo;Kurti&rdquo;.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {results.map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -6 }}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
              >
                <Link to={`/product/${product.slug}`}>
                  <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
                    <img
                      src={product.images?.[0]?.url || 'https://via.placeholder.com/300'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {product.discountPercent > 0 && (
                      <span className="absolute top-3 left-3 bg-red-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                        -{product.discountPercent}%
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] text-gold-600 font-semibold uppercase mb-1">{product.category?.name}</p>
                    <h3 className="text-sm font-semibold text-charcoal-900 line-clamp-1 group-hover:text-gold-600 transition mb-2">
                      {product.name}
                    </h3>
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
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
