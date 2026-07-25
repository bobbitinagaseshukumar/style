import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiFilter, FiSliders, FiHeart, FiShoppingBag, FiStar, FiX } from 'react-icons/fi';
import api from '../../config/api';
import { formatCurrency } from '../../utils/formatCurrency';

const Categories = () => {
  const { slug } = useParams();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Sort state
  const [selectedCategory, setSelectedCategory] = useState(slug || '');
  const [sortOption, setSortOption] = useState('newest');
  const [maxPrice, setMaxPrice] = useState(15000);
  const [filterFeatured, setFilterFeatured] = useState(false);
  const [filterTrending, setFilterTrending] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        setCategories(data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let url = `/products?limit=30`;
        if (selectedCategory) {
          const found = categories.find(c => c.slug === selectedCategory || c.id === selectedCategory);
          if (found) url += `&category=${found.id}`;
        }
        if (filterFeatured) url += `&featured=true`;
        if (filterTrending) url += `&trending=true`;

        if (sortOption === 'price_asc') url += `&sort=price_asc`;
        else if (sortOption === 'price_desc') url += `&sort=price_desc`;

        const { data } = await api.get(url);
        setProducts(data.data?.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategory, sortOption, filterFeatured, filterTrending, categories]);

  const filteredProducts = products.filter(p => (p.discountPrice || p.price) <= maxPrice);

  return (
    <div className="min-h-screen bg-white">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-charcoal-900 via-charcoal-800 to-charcoal-900 text-white py-12 px-4 text-center relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-2">
            {selectedCategory ? categories.find(c => c.slug === selectedCategory || c.id === selectedCategory)?.name || 'Collections' : 'Explore All Collections'}
          </h1>
          <p className="text-sm text-gray-300">Discover handcrafted sarees, kundan jewellery, kurtis, and designer wear</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="text-xs text-gray-500">
            Showing <strong className="text-charcoal-900">{filteredProducts.length}</strong> products
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-semibold text-charcoal-900"
            >
              <FiFilter /> Filters
            </button>

            {/* Sort Dropdown */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-gold-500 focus:outline-none bg-white"
            >
              <option value="newest">Sort by: Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* DESKTOP FILTER SIDEBAR */}
          <div className="hidden lg:block bg-gray-50/50 border border-gray-200 rounded-3xl p-6 h-fit space-y-6">
            <div>
              <h3 className="font-serif font-bold text-sm text-charcoal-900 mb-3 uppercase tracking-wider">Categories</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={!selectedCategory}
                    onChange={() => setSelectedCategory('')}
                    className="text-gold-500 focus:ring-gold-500"
                  />
                  All Categories
                </label>
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === cat.slug || selectedCategory === cat.id}
                      onChange={() => setSelectedCategory(cat.slug)}
                      className="text-gold-500 focus:ring-gold-500"
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>

            {/* Price Slider */}
            <div>
              <div className="flex justify-between items-center mb-2 text-xs font-bold text-charcoal-900">
                <span>Max Price</span>
                <span className="text-gold-600">{formatCurrency(maxPrice)}</span>
              </div>
              <input
                type="range"
                min={500}
                max={20000}
                step={500}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-gold-500 cursor-pointer"
              />
            </div>

            {/* Badges Toggle */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <h3 className="font-serif font-bold text-sm text-charcoal-900 mb-2 uppercase tracking-wider">Collection Badges</h3>
              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterFeatured}
                  onChange={(e) => setFilterFeatured(e.target.checked)}
                  className="rounded text-gold-500 focus:ring-gold-500"
                />
                Featured Products
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterTrending}
                  onChange={(e) => setFilterTrending(e.target.checked)}
                  className="rounded text-gold-500 focus:ring-gold-500"
                />
                Trending Now 🔥
              </label>
            </div>
          </div>

          {/* PRODUCT GRID */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-gray-200 rounded-2xl" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-3xl border border-gray-100">
                No products match your selected filters. Try widening your price range.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6">
                {filteredProducts.map((product) => (
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
      </div>
    </div>
  );
};

export default Categories;
