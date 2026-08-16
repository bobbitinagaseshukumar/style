import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiClock, FiTrash2, FiArrowLeft, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import api from '../../config/api';
import ProductCard from '../../components/common/ProductCard';
import { toast } from 'react-toastify';

/**
 * RecentlyViewed Page — Account-based (database per user).
 * Different accounts see different recently viewed products.
 */
const RecentlyViewed = () => {
  const user = useSelector(state => state.auth?.user);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentlyViewed = async () => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/recently-viewed');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setProducts(res.data.data);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentlyViewed();
    window.scrollTo(0, 0);
  }, [user]);

  const handleClearHistory = async () => {
    try {
      await api.delete('/recently-viewed');
      setProducts([]);
      toast.success('Recently viewed history cleared!');
    } catch (err) {
      setProducts([]);
    }
  };

  return (
    <div className="min-h-screen bg-white py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <Link to="/" className="hover:text-gold-600 transition flex items-center gap-1">
                <FiArrowLeft size={12} /> Home
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Recently Viewed</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
                <FiClock size={20} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">Recently Viewed Products</h1>
                <p className="text-xs text-gray-500 mt-0.5">Products you explored during your browsing sessions</p>
              </div>
            </div>
          </div>

          {products.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50/50 transition cursor-pointer self-start sm:self-auto"
            >
              <FiTrash2 size={14} /> Clear Browsing History
            </button>
          )}
        </div>

        {/* Content State */}
        {!user ? (
          <div className="text-center py-16 sm:py-24 bg-gray-50/60 rounded-3xl border border-dashed border-gray-200 max-w-xl mx-auto px-6">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4">
              <FiClock size={28} />
            </div>
            <h3 className="text-lg font-serif font-bold text-charcoal-900 mb-2">Sign In to View History</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
              Please sign in to your account to see your recently viewed products.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-charcoal-900 text-amber-400 font-bold text-xs hover:bg-black transition shadow-lg"
            >
              Sign In <FiArrowRight size={14} />
            </Link>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-gray-50 rounded-2xl p-3 border border-gray-100 animate-pulse flex flex-col">
                <div className="w-full aspect-[3/4] bg-gray-200 rounded-xl mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
                <div className="h-5 bg-gray-200 rounded w-1/3 mt-auto" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 sm:py-24 bg-gray-50/60 rounded-3xl border border-dashed border-gray-200 max-w-xl mx-auto px-6">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4">
              <FiClock size={28} />
            </div>
            <h3 className="text-lg font-serif font-bold text-charcoal-900 mb-2">No Recently Viewed Products</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
              You haven&apos;t viewed any products yet. Explore our luxury collection to start seeing items here.
            </p>
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-charcoal-900 text-amber-400 font-bold text-xs hover:bg-black transition shadow-lg"
            >
              <FiShoppingBag size={14} /> Explore Catalog <FiArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default RecentlyViewed;
