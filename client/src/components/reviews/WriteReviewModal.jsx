import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiStar, FiCheckCircle, FiUpload, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../config/api';

const WriteReviewModal = ({ order, item, onClose, onReviewSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState([]);
  const [recommend, setRecommend] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAddImage = () => {
    if (!imageUrl.trim()) return;
    setImages([...images, imageUrl.trim()]);
    setImageUrl('');
  };

  const handleRemoveImage = (idx) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      return toast.error('Please enter a review description.');
    }

    try {
      setSubmitting(true);
      const res = await api.post('/reviews', {
        productId: item.productId || item.product?.id,
        orderId: order.id,
        rating,
        title: title || 'Verified Experience',
        comment,
        images,
        recommend,
        isAnonymous,
      });

      toast.success('Thank you! Your verified review has been published. 🎉');
      if (onReviewSubmitted) onReviewSubmitted(res.data?.data);
      onClose();
    } catch (err) {
      console.error('Submit review error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-charcoal-900 border border-gold-500/30 max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl text-white"
      >
        <div className="bg-charcoal-800 p-5 flex items-center justify-between border-b border-white/10">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1">
              <FiCheckCircle size={12} /> Verified Purchase Review
            </span>
            <h3 className="font-serif font-bold text-lg text-white">Review Product</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Product Summary Header */}
          <div className="flex items-center gap-3 bg-black/30 p-3 rounded-2xl border border-white/5">
            {item.product?.images?.[0]?.url && (
              <img
                src={item.product.images[0].url}
                alt={item.product?.name}
                className="w-14 h-16 object-cover rounded-xl shrink-0"
              />
            )}
            <div>
              <p className="text-xs font-bold text-white line-clamp-1">{item.product?.name || item.name || 'Product'}</p>
              <p className="text-[10px] text-white/50 mt-0.5">
                {item.size ? `Size: ${item.size}` : ''} {item.color ? `· Color: ${item.color}` : ''}
              </p>
              <p className="text-[10px] text-emerald-400 font-semibold mt-1">Delivered Order #{order.orderNumber}</p>
            </div>
          </div>

          {/* Interactive Star Rating */}
          <div className="text-center space-y-1">
            <label className="block text-xs font-bold uppercase text-gray-300">Overall Rating</label>
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition transform hover:scale-125 focus:outline-none cursor-pointer"
                >
                  <FiStar
                    size={28}
                    className={`${
                      (hoverRating || rating) >= star
                        ? 'text-gold-400 fill-gold-400 drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]'
                        : 'text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review Title */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Review Headline / Title</label>
            <input
              type="text"
              placeholder="e.g. Excellent Fabric & Comfortable Fit!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-xs text-white placeholder-gray-500 focus:border-gold-400 focus:outline-none"
            />
          </div>

          {/* Detailed Review Description */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Detailed Review Description</label>
            <textarea
              rows={4}
              required
              placeholder="Share your experience regarding quality, comfort, color accuracy, and sizing..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-xs text-white placeholder-gray-500 focus:border-gold-400 focus:outline-none"
            />
          </div>

          {/* Review Images URL Upload */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Add Product Photos (Optional)</label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Paste Image URL (https://...)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-xs text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-4 py-2 rounded-xl bg-gold-500 text-charcoal-900 font-bold text-xs hover:bg-gold-400 cursor-pointer"
              >
                Add Photo
              </button>
            </div>

            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {images.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={url} alt="Review upload" className="w-14 h-14 object-cover rounded-xl border border-white/10" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 text-[10px]"
                    >
                      <FiX size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkbox options */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs text-gray-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={recommend}
                onChange={(e) => setRecommend(e.target.checked)}
                className="rounded text-gold-500"
              />
              <span>I recommend this product</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded text-gold-500"
              />
              <span>Post Anonymously</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-gray-300 hover:bg-white/5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-900 font-extrabold text-xs transition cursor-pointer"
            >
              {submitting ? 'Publishing...' : 'Submit Verified Review'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default WriteReviewModal;
