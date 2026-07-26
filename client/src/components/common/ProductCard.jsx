import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingBag, FiEye, FiStar } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatCurrency';

const fadeInUp = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

/**
 * Ultra-Clean Minimal Luxury Product Card
 * Inspired by Apple Store, Myntra, Ajio Luxe & Zara
 * Image is the hero (80-85%), zero clutter, minimal badges, clean pricing.
 */
const ProductCard = ({ product }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!product) return null;

  const name = product.name || 'StyleVerse Product';
  const slug = product.slug || '';
  const images = product.images?.length > 0
    ? product.images.map(img => (typeof img === 'string' ? img : img.url))
    : [`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=600&background=f8f8f8&color=D4AF37&bold=true&format=svg`];
  const primaryImage = images[0];

  const price = product.price || 0;
  const discountPrice = product.discountPrice || 0;
  const discountPercent = product.discountPercent || 0;
  const finalPrice = discountPrice > 0 ? discountPrice : price;

  const rating = product.rating || product.averageRating || 0;
  const reviewCount = product.reviewCount || product.totalReviews || 0;
  const category = product.category?.name || product.categoryName || '';

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="group relative bg-white rounded-[18px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)] border border-gray-100 transition-all duration-300 flex flex-col h-full"
    >
      {/* ═══════════════ HERO PRODUCT IMAGE (80-85% Height Focus) ═══════════════ */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f9f9f9]">
        {/* Skeleton placeholder while image loads */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse" />
        )}

        {/* Product Image */}
        <img
          src={primaryImage}
          alt={name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* ── TOP-LEFT: Single Small Red Discount Badge ── */}
        {discountPercent > 0 && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-md max-h-[28px]">
              -{discountPercent}%
            </span>
          </div>
        )}

        {/* ── TOP-RIGHT: Wishlist Heart Icon Button ── */}
        <button
          onClick={toggleWishlist}
          aria-label="Add to Wishlist"
          className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${
            isWishlisted
              ? 'bg-red-600 text-white shadow-red-600/30'
              : 'bg-white/90 backdrop-blur-sm text-gray-500 hover:text-red-600 hover:bg-white'
          }`}
        >
          <FiHeart className={`w-4 h-4 transition-transform duration-200 ${isWishlisted ? 'fill-white scale-110' : 'group-hover:scale-110'}`} />
        </button>

        {/* ── DESKTOP HOVER QUICK ACTIONS (Revealed on hover) ── */}
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300 hidden sm:flex gap-2 z-10">
          <Link
            to={`/product/${slug}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-charcoal-900/90 backdrop-blur-md text-white text-xs font-bold hover:bg-charcoal-900 transition-colors shadow-lg"
          >
            <FiShoppingBag className="w-3.5 h-3.5" /> Add to Cart
          </Link>
          <Link
            to={`/product/${slug}`}
            aria-label="Quick View"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/90 backdrop-blur-md text-charcoal-900 hover:bg-white transition-colors shadow-lg"
          >
            <FiEye className="w-4 h-4" />
          </Link>
        </div>

        {/* ── MOBILE QUICK ADD FLOATING BUTTON ── */}
        <Link
          to={`/product/${slug}`}
          aria-label="Add to Cart"
          className="sm:hidden absolute bottom-3 right-3 z-10 w-8 h-8 rounded-full bg-charcoal-900 text-white shadow-md flex items-center justify-center active:scale-95 transition-transform"
        >
          <FiShoppingBag className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ═══════════════ MINIMAL PRODUCT INFORMATION ═══════════════ */}
      <div className="flex flex-col flex-grow p-4 space-y-2">
        {/* Category */}
        {category && (
          <p className="text-[10px] font-semibold text-gold-600 uppercase tracking-widest line-clamp-1">
            {category}
          </p>
        )}

        {/* Product Name (Max 2 lines) */}
        <Link to={`/product/${slug}`} className="block">
          <h3 className="text-xs sm:text-sm font-bold text-charcoal-900 leading-snug line-clamp-2 hover:text-gold-600 transition-colors">
            {name}
          </h3>
        </Link>

        {/* Star Rating (Hidden if no reviews exist) */}
        {rating > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  className={`w-3 h-3 ${i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-charcoal-900 ml-0.5">{rating.toFixed(1)}</span>
            {reviewCount > 0 && (
              <span className="text-[10px] text-gray-400">({reviewCount})</span>
            )}
          </div>
        )}

        {/* Spacer to push price neatly to bottom */}
        <div className="flex-grow min-h-[4px]" />

        {/* Clean Price Line: ₹1,999  ₹2,999  40% OFF */}
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-sm sm:text-base font-extrabold text-charcoal-900">
            {formatCurrency(finalPrice)}
          </span>
          {discountPercent > 0 && (
            <>
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(price)}
              </span>
              <span className="text-xs font-bold text-emerald-600">
                {discountPercent}% OFF
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
