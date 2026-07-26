import React, { useState, useEffect } from 'react';
import { FiStar, FiCheckCircle, FiThumbsUp, FiFilter, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../config/api';

const ReviewSection = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [distribution, setDistribution] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [selectedRating, setSelectedRating] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('recent');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedRating) params.set('rating', selectedRating);
      if (verifiedOnly) params.set('verifiedOnly', 'true');
      if (sortBy) params.set('sortBy', sortBy);

      const res = await api.get(`/reviews/product/${productId}?${params}`);
      if (res.data?.success && res.data?.data) {
        setReviews(res.data.data.reviews || []);
        setAvgRating(res.data.data.avgRating || 0);
        setTotalReviews(res.data.data.totalReviews || 0);
        setVerifiedCount(res.data.data.verifiedCount || 0);
        setDistribution(res.data.data.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) fetchReviews();
  }, [productId, selectedRating, verifiedOnly, sortBy]);

  const handleVoteHelpful = async (reviewId) => {
    try {
      await api.post(`/reviews/${reviewId}/vote`, { vote: 'helpful' });
      toast.success('Thank you for voting!');
      fetchReviews();
    } catch (err) {
      toast.info(err.response?.data?.message || 'Already voted on this review');
    }
  };

  return (
    <div className="space-y-8 my-12 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
      <h2 className="text-2xl font-serif font-bold text-charcoal-900">Customer Ratings & Reviews</h2>

      {/* Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
        {/* Rating Number */}
        <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-200 pb-4 md:pb-0">
          <span className="text-5xl font-black text-charcoal-900">{avgRating.toFixed(1)}</span>
          <div className="flex gap-1 text-gold-400 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <FiStar
                key={star}
                size={18}
                className={`${star <= Math.round(avgRating) ? 'fill-gold-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 font-medium">Based on {totalReviews} Verified Ratings</p>
          {verifiedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mt-2">
              <FiCheckCircle size={11} /> {verifiedCount} Verified Purchases
            </span>
          )}
        </div>

        {/* Rating Breakdown Bars */}
        <div className="md:col-span-2 space-y-2 flex flex-col justify-center">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = distribution[stars] || 0;
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-12 text-gray-600 font-bold">{stars} Star</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gold-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-12 text-right text-gray-400 font-mono text-[11px]">{pct}% ({count})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter & Sort Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-500 flex items-center gap-1 mr-1">
            <FiFilter size={12} /> Filter:
          </span>
          <button
            onClick={() => setSelectedRating('')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedRating === '' ? 'bg-charcoal-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {[5, 4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRating(r === selectedRating ? '' : r)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedRating === r ? 'bg-charcoal-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r} ★
            </button>
          ))}
          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
              verifiedOnly ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            ✓ Verified Only
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 rounded-xl bg-gray-100 text-xs font-bold text-charcoal-900 focus:outline-none border-none cursor-pointer"
          >
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-12 text-center text-gray-400 text-xs animate-pulse">Loading verified reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="py-12 text-center text-gray-500 text-sm bg-gray-50 rounded-2xl">
          No reviews match your selected filters. Be the first verified customer to leave a review!
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((rev) => {
            let imageList = [];
            try {
              imageList = typeof rev.images === 'string' ? JSON.parse(rev.images) : rev.images || [];
            } catch (e) {
              imageList = [];
            }

            return (
              <div key={rev.id} className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100 space-y-3">
                {/* Author Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gold-500/20 text-gold-700 flex items-center justify-center font-bold text-sm">
                      {rev.isAnonymous ? <FiUser /> : rev.user?.fullName?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-charcoal-900">
                          {rev.isAnonymous ? 'Verified Customer' : rev.user?.fullName || 'Customer'}
                        </span>
                        {rev.isVerified && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <FiCheckCircle size={10} /> Verified Purchase
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400">
                        Reviewed on {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex text-gold-400 gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <FiStar key={s} size={14} className={s <= rev.rating ? 'fill-gold-400' : 'text-gray-200'} />
                    ))}
                  </div>
                </div>

                {/* Review Title & Comment */}
                <div>
                  {rev.title && <h4 className="text-xs font-bold text-charcoal-900 mb-1">{rev.title}</h4>}
                  <p className="text-xs text-gray-700 leading-relaxed">{rev.comment}</p>
                </div>

                {/* Photo Gallery */}
                {imageList.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {imageList.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt="Customer review photo"
                        className="w-16 h-16 object-cover rounded-xl border border-gray-200 hover:scale-105 transition shadow-sm"
                      />
                    ))}
                  </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 text-xs">
                  <button
                    onClick={() => handleVoteHelpful(rev.id)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gold-50 hover:text-gold-700 transition font-bold cursor-pointer"
                  >
                    <FiThumbsUp size={12} /> Helpful ({rev.helpfulVotes || 0})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
