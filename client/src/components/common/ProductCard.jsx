import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHeart, FiShoppingBag, FiStar, FiEye,
  FiCheck, FiTruck
} from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../redux/cart/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../redux/wishlist/wishlistSlice';
import { formatCurrency } from '../../utils/formatCurrency';
import { toast } from 'react-toastify';
import QuickViewModal from './QuickViewModal';
import StarRating from '../reviews/StarRating';

/* ─── Color Map ─────────────────────────────────────────────── */
const colorHexMap = {
  black: '#121212', blue: '#1E40AF', navy: '#1E3A8A', red: '#DC2626',
  maroon: '#800000', white: '#FFFFFF', green: '#15803D', emerald: '#059669',
  gold: '#D4AF37', yellow: '#EAB308', pink: '#EC4899', purple: '#7E22CE',
  grey: '#6B7280', gray: '#6B7280', brown: '#92400E', beige: '#D2B48C',
  cream: '#FFFDD0', orange: '#EA580C', coral: '#FF7F50', olive: '#808000',
};

/* ─── Inline Keyframes (injected once) ──────────────────────── */
const styleId = 'sv-product-card-styles';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes sv-shine {
      0% { transform: translateX(-100%) skewX(-15deg); }
      100% { transform: translateX(200%) skewX(-15deg); }
    }
    @keyframes sv-btn-shine {
      0% { left: -30%; }
      100% { left: 130%; }
    }
    @keyframes sv-pulse-ring {
      0% { transform: scale(1); opacity: 0.6; }
      100% { transform: scale(2.2); opacity: 0; }
    }
    .sv-card-shine:hover .sv-shine-bar {
      animation: sv-shine 0.8s ease-in-out forwards;
    }
    .sv-buy-btn::after {
      content: '';
      position: absolute;
      top: 0;
      left: -30%;
      width: 30%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
      pointer-events: none;
    }
    .sv-buy-btn:hover::after {
      animation: sv-btn-shine 0.6s ease-in-out forwards;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Premium Luxury Product Card — Apple/Zara/Nike Inspired
 * 
 * Design Principles:
 * - Product image is the hero (70-75% of card, NO badges on image)
 * - Only a glass heart (wishlist) button floats on image
 * - Clean typography below with brand, name, rating, colors, price
 * - Discount shown elegantly near price (green accent)
 * - Premium gold Buy Now + glass Add to Cart buttons
 * - 3D tilt on hover, shine sweep, smooth transitions
 */
const ProductCard = ({ product, index = 0 }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth?.user);
  const wishlistItems = useSelector(state => state.wishlist?.items || []);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selectedColorIdx, setSelectedColorIdx] = useState(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const cardRef = useRef(null);

  if (!product) return null;

  /* ── Derived Data ────────────────────────────────────────── */
  const name = product.name || 'StyleVerse Product';
  const slug = product.slug || product._id || product.id || '';
  const brand = product.brand?.name || product.brandName || product.category?.name || '';

  const rawImages = product.images?.length > 0
    ? product.images.map(img => (typeof img === 'string' ? img : img.url))
    : [`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=600&background=F5F5F5&color=333&bold=true`];

  const displayImages = rawImages.length > 0 ? rawImages : [rawImages[0]];
  const primaryImage = activeImageIdx < displayImages.length ? displayImages[activeImageIdx] : displayImages[0];
  const hoverImage = displayImages.length > 1 ? displayImages[1] : null;

  const price = product.price || 0;
  const salePrice = product.salePrice || product.discountPrice || 0;
  const discountPercent = product.discountPercent || (salePrice > 0 && price > salePrice ? Math.round(((price - salePrice) / price) * 100) : 0);
  const finalPrice = salePrice > 0 ? salePrice : price;
  const savingsAmount = price > finalPrice ? price - finalPrice : 0;

  const rating = product.rating || product.ratings || product.averageRating || 0;
  const reviewCount = product.reviewCount || product.totalReviews || product.numReviews || 0;

  const isWishlisted = wishlistItems.some(item => (item._id || item.id) === (product._id || product.id));

  const colors = (() => {
    try {
      if (typeof product.colors === 'string') return JSON.parse(product.colors);
      return Array.isArray(product.colors) ? product.colors : [];
    } catch { return []; }
  })();

  /* ── Handlers ────────────────────────────────────────────── */
  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current || window.innerWidth < 768) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * -4;
    const y = ((e.clientX - rect.left) / rect.width - 0.5) * 4;
    setTilt({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
    if (!selectedColorIdx) setActiveImageIdx(0);
  }, [selectedColorIdx]);

  const toggleWishlist = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      toast.info('Please sign in to add items to your wishlist');
      navigate('/login');
      return;
    }
    const pid = product._id || product.id;
    if (isWishlisted) {
      dispatch(removeFromWishlist(pid));
      toast.info('Removed from wishlist');
    } else {
      dispatch(addToWishlist(product));
      toast.success('Added to wishlist ♥');
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      toast.info('Please sign in to add items to your cart');
      navigate('/login');
      return;
    }
    dispatch(addToCart({
      id: product._id || product.id,
      name,
      price: finalPrice,
      image: primaryImage,
      quantity: 1,
    }));
    setAddedToCart(true);
    toast.success(`Added to cart`);
    setTimeout(() => setAddedToCart(false), 2200);
  };

  const handleBuyNow = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      toast.info('Please sign in to purchase items');
      navigate('/login');
      return;
    }
    setBuyingNow(true);
    dispatch(addToCart({
      id: product._id || product.id,
      name,
      price: finalPrice,
      image: primaryImage,
      quantity: 1,
    }));
    setTimeout(() => {
      setBuyingNow(false);
      navigate('/checkout');
    }, 400);
  };

  const handleColorClick = (e, color, idx) => {
    e.stopPropagation();
    setSelectedColorIdx(idx);
    if (displayImages[idx]) setActiveImageIdx(idx);
  };

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-30px' }}
        transition={{ duration: 0.45, delay: (index % 8) * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          transformStyle: 'preserve-3d',
          transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          willChange: 'transform',
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onClick={() => navigate(`/product/${slug}`)}
        className="sv-card-shine group relative bg-white rounded-[20px] overflow-hidden border border-gray-100/80 shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.10)] transition-shadow duration-500 flex flex-col h-full cursor-pointer select-none"
      >
        {/* ── Shine Sweep Overlay ─────────────────────────────── */}
        <div className="sv-shine-bar absolute inset-0 w-[40%] bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full pointer-events-none z-30" style={{ willChange: 'transform' }} />

        {/* ═══════════════════════════════════════════════════════
            HERO PRODUCT IMAGE — 70-75% of card, NO badges
            ═══════════════════════════════════════════════════════ */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#FAFAFA]">
          {/* Skeleton Loading */}
          <AnimatePresence>
            {!imageLoaded && (
              <motion.div
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 animate-pulse"
              />
            )}
          </AnimatePresence>

          {/* Primary Image */}
          <motion.img
            src={primaryImage}
            alt={name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            animate={{ scale: isHovered ? 1.06 : 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ willChange: 'transform' }}
          />

          {/* Hover Secondary Image */}
          {hoverImage && (
            <motion.img
              src={hoverImage}
              alt={`${name} alternate`}
              loading="lazy"
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* ── Wishlist Glass Button (ONLY element on image) ──── */}
          <motion.button
            onClick={toggleWishlist}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.88 }}
            className={`absolute top-3 right-3 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all duration-300 shadow-lg ${
              isWishlisted
                ? 'bg-red-500 border-red-400 text-white shadow-red-500/30'
                : 'bg-white/70 border-white/40 text-gray-600 hover:text-red-500 hover:bg-white/90 shadow-black/5'
            }`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <FiHeart className={`w-4 h-4 sm:w-[18px] sm:h-[18px] ${isWishlisted ? 'fill-white' : ''}`} />
            {/* Pulse ring on wishlisted */}
            {isWishlisted && (
              <span className="absolute inset-0 rounded-full border-2 border-red-400" style={{ animation: 'sv-pulse-ring 1s ease-out forwards' }} />
            )}
          </motion.button>

          {/* ── Quick View (appears on hover, centered) ────────── */}
          <AnimatePresence>
            {isHovered && (
              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25 }}
                onClick={(e) => { e.stopPropagation(); setQuickViewOpen(true); }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-5 py-2.5 rounded-full bg-white/90 backdrop-blur-md text-gray-900 text-[11px] sm:text-xs font-semibold border border-gray-200/60 hover:bg-white transition-all shadow-lg flex items-center gap-1.5"
              >
                <FiEye className="w-3.5 h-3.5" /> Quick View
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* ═══════════════════════════════════════════════════════
            PRODUCT INFO — Clean, elegant, no clutter
            ═══════════════════════════════════════════════════════ */}
        <div className="p-3.5 sm:p-4 flex flex-col flex-grow bg-white">

          {/* Brand Name */}
          {brand && (
            <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-[0.12em] mb-1 line-clamp-1">
              {brand}
            </span>
          )}

          {/* Product Name (max 2 lines) */}
          <h3 className="text-[13px] sm:text-sm font-medium text-gray-900 line-clamp-2 leading-[1.4] mb-1.5 group-hover:text-gray-700 transition-colors">
            {name}
          </h3>

          {/* Rating */}
          {rating > 0 && (
            <div className="mb-2">
              <StarRating rating={rating} count={reviewCount} showNumber size="sm" />
            </div>
          )}

          {/* Color Swatches */}
          {colors.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              {colors.slice(0, 6).map((color, i) => {
                const hex = colorHexMap[color.toLowerCase()] || '#6B7280';
                const isSelected = selectedColorIdx === i;
                const isWhite = ['white', 'cream', 'beige'].includes(color.toLowerCase());
                return (
                  <button
                    key={color + i}
                    onClick={(e) => handleColorClick(e, color, i)}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      isSelected
                        ? 'ring-[2px] ring-offset-1 ring-amber-400 scale-110'
                        : `hover:scale-110 ${isWhite ? 'border border-gray-200' : 'border border-transparent'}`
                    }`}
                    style={{ backgroundColor: hex }}
                    title={color}
                    aria-label={`Color: ${color}`}
                  />
                );
              })}
              {colors.length > 6 && (
                <span className="text-[10px] text-gray-400 font-medium">+{colors.length - 6}</span>
              )}
            </div>
          )}

          {/* ── Price Section (elegant, with discount near price) ── */}
          <div className="mt-auto pt-1.5">
            <div className="flex items-baseline flex-wrap gap-1.5">
              <span className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                {formatCurrency(finalPrice)}
              </span>
              {discountPercent > 0 && (
                <>
                  <span className="text-xs text-gray-400 line-through font-normal">
                    {formatCurrency(price)}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600">
                    {discountPercent}% off
                  </span>
                </>
              )}
            </div>

            {/* Savings Callout */}
            {savingsAmount > 0 && (
              <p className="text-[10px] sm:text-[11px] text-emerald-600 font-medium mt-0.5">
                You save {formatCurrency(savingsAmount)}
              </p>
            )}

            {/* Delivery hint */}
            {product.freeDelivery !== false && (
              <div className="flex items-center gap-1 mt-1.5 text-[10px] sm:text-[11px] text-gray-400">
                <FiTruck className="w-3 h-3" />
                <span>Free delivery</span>
              </div>
            )}
          </div>

          {/* ── Action Buttons ────────────────────────────────── */}
          <div className="flex items-center gap-2 pt-3 mt-2 border-t border-gray-100/80">

            {/* Add to Cart — Glass Button */}
            <motion.button
              onClick={handleAddToCart}
              whileTap={{ scale: 0.9 }}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                addedToCart
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 shadow-sm'
              }`}
              title={addedToCart ? 'Added!' : 'Add to Cart'}
              aria-label={addedToCart ? 'Added to cart' : 'Add to cart'}
            >
              <AnimatePresence mode="wait">
                {addedToCart ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    <FiCheck className="w-5 h-5" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="bag"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <FiShoppingBag className="w-[18px] h-[18px]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Buy Now — Luxury Gold Button with shine */}
            <motion.button
              onClick={handleBuyNow}
              whileTap={{ scale: 0.95 }}
              className={`sv-buy-btn relative flex-1 py-2.5 sm:py-3 px-4 rounded-xl font-semibold text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 overflow-hidden ${
                buyingNow
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-gray-900 shadow-md shadow-amber-500/15 hover:shadow-lg hover:shadow-amber-500/25 hover:-translate-y-[1px]'
              }`}
            >
              {buyingNow ? (
                <>
                  <FiCheck className="w-4 h-4" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <FiShoppingBag className="w-3.5 h-3.5" />
                  <span>Buy Now</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Quick View Modal */}
      <QuickViewModal
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        product={product}
      />
    </>
  );
};

export default ProductCard;
