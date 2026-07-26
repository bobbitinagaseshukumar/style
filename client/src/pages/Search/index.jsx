import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiSliders, FiArrowRight, FiFrown, FiCheck } from 'react-icons/fi';
import api from '../../config/api';
import ProductCard from '../../components/common/ProductCard';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState(10000);
  const [sortBy, setSortBy] = useState('relevance'); // relevance | price_asc | price_desc | newest | rating

  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const [prodRes, catRes] = await Promise.allSettled([
          api.get(`/products?search=${encodeURIComponent(query)}&limit=50`),
          api.get('/categories'),
        ]);

        if (prodRes.status === 'fulfilled' && prodRes.value.data?.data) {
          const prods = prodRes.value.data.data.products || prodRes.value.data.data || [];
          setProducts(prods);
        }
        if (catRes.status === 'fulfilled' && catRes.value.data?.data) {
          setCategories(catRes.value.data.data || []);
        }
      } catch (err) {
        console.error('Search fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  // Apply filters & sorting
  const filteredProducts = products.filter((p) => {
    const matchCategory = !selectedCategory || p.category?.id === selectedCategory || p.categoryId === selectedCategory;
    const matchPrice = (p.discountPrice || p.price || 0) <= priceRange;
    return matchCategory && matchPrice;
  }).sort((a, b) => {
    const priceA = a.discountPrice || a.price || 0;
    const priceB = b.discountPrice || b.price || 0;
    if (sortBy === 'price_asc') return priceA - priceB;
    if (sortBy === 'price_desc') return priceB - priceA;
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-50/50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Search Header Banner */}
        <div className="bg-charcoal-900 border border-gold-500/30 p-6 sm:p-8 rounded-3xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div>
            <span className="text-xs font-bold text-gold-400 uppercase tracking-widest">Search Catalogue</span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold mt-1">
              {query ? `Results for "${query}"` : 'Browse Catalog'}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Found <strong className="text-gold-400">{filteredProducts.length}</strong> matching products
            </p>
          </div>

          {/* Search Input Bar on Results Page */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = e.target.elements.searchInput.value.trim();
              if (q) setSearchParams({ q });
            }}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl w-full sm:w-80"
          >
            <FiSearch className="w-5 h-5 text-gold-400 ml-2 shrink-0" />
            <input
              name="searchInput"
              type="text"
              defaultValue={query}
              placeholder="Search products..."
              className="bg-transparent text-xs text-white placeholder-gray-400 focus:outline-none flex-1 allow-select"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gold-500 text-charcoal-900 font-extrabold text-xs rounded-xl shadow hover:bg-gold-400 transition cursor-pointer shrink-0"
            >
              Search
            </button>
          </form>
        </div>

        {/* Content Layout: Filters Sidebar + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Filters Sidebar */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-6 h-fit">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <FiFilter className="text-gold-600" /> Filters
              </h3>
              {(selectedCategory || priceRange < 10000) && (
                <button
                  onClick={() => { setSelectedCategory(''); setPriceRange(10000); }}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-gold-500"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Max Price Range Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-charcoal-900 mb-2">
                <span>Max Price:</span>
                <span className="text-gold-600">₹{priceRange.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="500"
                max="25000"
                step="500"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-gold-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Main Results Grid */}
          <div className="lg:col-span-3 space-y-4">
            {/* Sort Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-gray-500">
                Showing <strong className="text-charcoal-900">{filteredProducts.length}</strong> items
              </span>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-charcoal-900 flex items-center gap-1">
                  <FiSliders className="text-gold-600" /> Sort By:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-gold-500 font-semibold"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Product Cards Grid */}
            {loading ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold text-gray-500">Searching inventory...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-4">
                <FiFrown className="w-12 h-12 text-gold-500 mx-auto opacity-60" />
                <h3 className="text-lg font-serif font-bold text-charcoal-900">No Products Found</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  We couldn&apos;t find any products matching &quot;{query}&quot;. Try exploring our popular categories or adjusting your filters.
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-2 max-w-sm mx-auto">
                  <Link to="/categories" className="px-4 py-2 rounded-full bg-gold-500 text-charcoal-900 font-bold text-xs shadow hover:bg-gold-400 transition">
                    Explore Categories →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
