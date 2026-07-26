import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingBag, FiEye, FiStar, FiTruck, FiZap, FiTag } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatCurrency';

const fadeInUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

/**
 * Premium Product Card — Luxury E-Commerce Design
 * Inspired by Zara, Nike, Myntra Luxe, Apple Store, Ajio Luxe
 */
const ProductCard = ({ product }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!product) return null;

  const name = product.name || 'StyleVerse Product';
  const slug = product.slug || '';
  const images = product.images?.length > 0
    ? product.images.map(img => (typeof img === 'string' ? img : img.url))
    : [`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=600&background=f5f5f5&color=D4AF37&bold=true&format=svg`];
  const primaryImage = images[currentImageIndex] || images[0];
  const hasMultipleImages = images.length > 1;

  const price = product.price || 0;
  const discountPrice = product.discountPrice || 0;
  const discountPercent = product.discountPercent || 0;
  const finalPrice = discountPrice > 0 ? discountPrice : price;
  const savings = discountPercent > 0 ? price - finalPrice : 0;

  const rating = product.rating || product.averageRating || 0;
  const reviewCount = product.reviewCount || product.totalReviews || 0;
  const stock = product.stock !== undefined ? product.stock : (product.stockQuantity !== undefined ? product.stockQuantity : 99);
  const category = product.category?.name || product.categoryName || '';

  // Dynamic Badges (Admin controllable & product props)
  const badges = [];
  if (product.newArrival) badges.push({ label: 'NEW ARRIVAL', color: 'bg-emerald-600' });
  if (product.bestSeller) badges.push({ label: 'BEST SELLER', color: 'bg-amber-600' });
  if (product.trending) badges.push({ label: 'TRENDING', color: 'bg-violet-600' });
  if (product.flashSale) badges.push({ label: 'FLASH SALE', color: 'bg-red-600' });
  if (product.premiumChoice) badges.push({ label: 'PREMIUM CHOICE', color: 'bg-charcoal-900' });
  if (product.editorsPick) badges.push({ label: "EDITOR'S PICK", color: 'bg-yellow-600' });
  if (product.mostLoved) badges.push({ label: 'MOST LOVED', color: 'bg-rose-600' });

  // Offers & Trust Tags
  const offerChip = product.offerChip || (product.bankOffer ? 'Bank Offer' : (product.freeDelivery ? 'Free Delivery' : null));

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="group relative bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-gray-100/90 transition-all duration-400 flex flex-col h-full"
    >
      {/* ═══════════════ IMAGE SECTION (75-80% of card) ═══════════════ */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50/90">
        {/* Blur loading placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 animate-pulse" />
        )}

        {/* Main Product Image */}
        <img
          src={primaryImage}
          alt={name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.07] ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Hover overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />

        {/* ── Top-Left: Discount Badge (Red Pill with soft shadow) ── */}
        {discountPercent > 0 && (
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
            <span className="inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-red-600 text-white text-[10px] sm:text-xs font-extrabold tracking-wide shadow-lg shadow-red-600/30">
              -{discountPercent}%
            </span>
          </div>
        )}

        {/* ── Top-Left: Dynamic Status Badges (Below discount pill) ── */}
        {badges.length > 0 && (
          <div className={`absolute left-3 sm:left-4 z-10 flex flex-col gap-1.5 ${discountPercent > 0 ? 'top-10 sm:top-12' : 'top-3 sm:top-4'}`}>
            {badges.slice(0, 2).map((badge, i) => (
              <span key={i} className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full ${badge.color} text-white text-[8px] sm:text-[10px] font-bold tracking-wider shadow-md`}>
                {badge.label}
              </span>
            ))}
          </div>
        )}

        {/* ── Top-Right: Wishlist Button ── */}
        <button
          onClick={toggleWishlist}
          aria-label="Add to Wishlist"
          className={`absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
            isWishlisted
              ? 'bg-red-600 text-white shadow-red-600/30 scale-105'
              : 'bg-white/95 backdrop-blur-sm text-gray-500 hover:text-red-600 hover:bg-white shadow-black/10'
          }`}
        >
          <FiHeart className={`w-4 h-4 sm:w-[18px] sm:h-[18px] transition-transform duration-200 ${isWishlisted ? 'fill-white scale-110' : 'group-hover:scale-110'}`} />
        </button>

        {/* ── Mobile Quick View Eye Icon (Bottom-Right of Image) ── */}
        <Link
          to={`/product/${slug}`}
          className="absolute bottom-3 right-3 z-10 sm:hidden w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-charcoal-900 shadow-md flex items-center justify-center active:scale-95 transition-transform"
        >
          <FiEye className="w-4 h-4" />
        </Link>

        {/* ── Image Thumbnail Dots (Desktop hover preview) ── */}
        {hasMultipleImages && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 hidden sm:flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-400">
            {images.slice(0, 4).map((_, i) => (
              <button
                key={i}
                onMouseEnter={() => setCurrentImageIndex(i)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${i === currentImageIndex ? 'bg-white w-5 shadow-md' : 'bg-white/60 hover:bg-white/90'}`}
              />
            ))}
          </div>
        )}

        {/* ── Desktop Hover Action Buttons ── */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-400 hidden sm:flex gap-2 z-10">
          <Link
            to={`/product/${slug}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-charcoal-900/90 backdrop-blur-md text-white text-xs font-bold hover:bg-charcoal-900 transition-colors shadow-xl"
          >
            <FiShoppingBag className="w-3.5 h-3.5" /> Add to Cart
          </Link>
          <Link
            to={`/product/${slug}`}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/90 backdrop-blur-md text-charcoal-900 hover:bg-white transition-colors shadow-xl"
          >
            <FiEye className="w-4 h-4" />
          </Link>
        </div>

        {/* ── Stock Alert Badge (if low stock) ── */}
        {stock <= 5 && stock > 0 && (
          <div className="absolute bottom-3 left-3 z-10">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-600 text-white text-[9px] font-bold shadow-md">
              Only {stock} Left
            </span>
          </div>
        )}
        {stock === 0 && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <span className="px-3 py-1.5 rounded-full bg-red-600 text-white font-extrabold text-xs shadow-xl tracking-wider uppercase">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* ═══════════════ PRODUCT INFO SECTION ═══════════════ */}
      <div className="flex flex-col flex-grow p-3.5 sm:p-5 space-y-2 sm:space-y-2.5">
        {/* Category */}
        {category && (
          <p className="text-[10px] sm:text-xs text-gold-600 font-semibold uppercase tracking-[0.12em] line-clamp-1">
            {category}
          </p>
        )}

        {/* Product Name (Max 2 lines, truncated with ...) */}
        <Link to={`/product/${slug}`} className="block">
          <h3 className="text-[13px] sm:text-[15px] font-bold text-charcoal-900 leading-snug line-clamp-2 hover:text-gold-600 transition-colors duration-200 tracking-[-0.01em]">
            {name}
          </h3>
        </Link>

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                />
              ))}
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-charcoal-900">{rating.toFixed(1)}</span>
            {reviewCount > 0 && (
              <span className="text-[10px] sm:text-xs text-gray-400">({reviewCount.toLocaleString('en-IN')})</span>
            )}
          </div>
        )}

        {/* Offer Chip */}
        {offerChip && (
          <div className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold w-fit">
            <FiTag className="w-3 h-3 text-emerald-600" /> {offerChip}
          </div>
        )}

        {/* Push price section to bottom */}
        <div className="flex-grow" />

        {/* Price Section */}
        <div className="space-y-1 pt-2 border-t border-gray-100/90">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-base sm:text-lg font-extrabold text-charcoal-900 tracking-tight">
              {formatCurrency(finalPrice)}
            </span>
            {discountPercent > 0 && (
              <span className="text-xs sm:text-sm text-gray-400 line-through font-medium">
                {formatCurrency(price)}
              </span>
            )}
          </div>

          {/* Money Saved (Green text) */}
          {savings > 0 && (
            <p className="text-[11px] sm:text-xs text-emerald-600 font-bold">
              Save {formatCurrency(savings)} ({discountPercent}% OFF)
            </p>
          )}
        </div>

        {/* Delivery Information */}
        {product.freeDelivery && (
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 font-medium">
            <FiTruck className="w-3.5 h-3.5 text-emerald-600" /> Free Delivery
          </div>
        )}

        {/* Mobile Sticky Add to Cart Button */}
        <Link
          to={`/product/${slug}`}
          className="sm:hidden flex items-center justify-center gap-1.5 w-full py-2.5 mt-1 rounded-xl bg-charcoal-900 text-white text-xs font-bold tracking-wide active:scale-[0.97] transition-transform"
        >
          <FiShoppingBag className="w-3.5 h-3.5" /> Add to Cart
        </Link>
      </div>
    </motion.div>
  );
};

export default ProductCard;
