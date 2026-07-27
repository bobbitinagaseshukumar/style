import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHeart, FiShoppingBag, FiStar, FiEye, FiZap,
  FiTruck, FiCheck, FiCheckCircle
} from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/cart/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../redux/wishlist/wishlistSlice';
import { formatCurrency } from '../../utils/formatCurrency';
import { toast } from 'react-toastify';
import QuickViewModal from './QuickViewModal';

const colorHexMap = {
  black: '#121212',
  blue: '#1E40AF',
  navy: '#1E3A8A',
  red: '#DC2626',
  maroon: '#800000',
  white: '#FFFFFF',
  green: '#15803D',
  emerald: '#059669',
  gold: '#D4AF37',
  yellow: '#EAB308',
  pink: '#EC4899',
  purple: '#7E22CE',
  grey: '#6B7280',
  gray: '#6B7280',
};

/**
 * Ultra-Luxury World-Class Product Card (Amazon + Apple + Nike + Zara Inspired)
 * Features 3D cursor tilt, metallic light shine sweep, floating badges (🔥 30% OFF, ⭐ Bestseller, ✨ New Arrival),
 * ratings breakdown, stock indicator (Only 5 Left), express delivery (⚡ Express Delivery Tomorrow),
 * and luxury gold Buy Now + Square Glass Cart buttons.
 */
const ProductCard = ({ product, index = 0 }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selectedColorIdx, setSelectedColorIdx] = useState(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  if (!product) return null;

  const name = product.name || 'StyleVerse Luxury Product';
  const slug = product.slug || product.id || '';
  const brand = product.brand?.name || product.brandName || 'KVLR STYLES';

  const rawImages = product.images?.length > 0
    ? product.images.map(img => (typeof img === 'string' ? img : img.url))
    : [`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=600&background=0D0D0D&color=D4AF37&bold=true`];
  
  const displayImages = rawImages.length > 0 ? rawImages : [rawImages[0]];
  const primaryImage = activeImageIdx < displayImages.length ? displayImages[activeImageIdx] : displayImages[0];
  const hoverPreviewImage = displayImages.length > 1 ? displayImages[1] : primaryImage;

  const price = product.price || 0;
  const discountPrice = product.discountPrice || 0;
  const discountPercent = product.discountPercent || 0;
  const finalPrice = discountPrice > 0 ? discountPrice : price;
  const savingsAmount = price > finalPrice ? price - finalPrice : 0;

  const rating = product.rating || product.averageRating || 4.9;
  const reviewCount = product.reviewCount || product.totalReviews || 1245;

  const colors = (() => {
    try {
      if (typeof product.colors === 'string') return JSON.parse(product.colors);
      return Array.isArray(product.colors) ? product.colors : [];
    } catch {
      return [];
    }
  })();

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
    setActiveImageIdx(0);
  };

  const toggleWishlist = (e) => {
    e.stopPropagation();
    if (isWishlisted) {
      dispatch(removeFromWishlist(product.id));
      setIsWishlisted(false);
      toast.info('Removed from Wishlist');
    } else {
      dispatch(addToWishlist({ id: product.id, name, price: finalPrice, image: primaryImage, slug }));
      setIsWishlisted(true);
      toast.success('Added to Wishlist ✨');
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    dispatch(addToCart({
      id: product.id,
      name,
      price: finalPrice,
      image: primaryImage,
      quantity: 1,
    }));
    setAddedToCart(true);
    toast.success(`✓ "${name}" added to cart!`);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = (e) => {
    e.stopPropagation();
    dispatch(addToCart({
      id: product.id,
      name,
      price: finalPrice,
      image: primaryImage,
      quantity: 1,
    }));
    navigate('/checkout');
  };

  const handleColorClick = (e, colorName, idx) => {
    e.stopPropagation();
    setSelectedColorIdx(idx);
    if (displayImages[idx]) {
      setActiveImageIdx(idx);
    }
  };

  return (
    <>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.4, delay: (index % 6) * 0.05 }}
        style={{
          transformStyle: 'preserve-3d',
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onClick={() => navigate(`/product/${slug}`)}
        className="group relative bg-white rounded-2xl sm:rounded-[22px] overflow-hidden border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_45px_rgba(212,175,55,0.18)] transition-all duration-300 flex flex-col h-full cursor-pointer select-none"
      >
        {/* Shine Animation overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-20" />

        {/* HERO PRODUCT IMAGE (70% height aspect ratio) */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50/50">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-100 animate-pulse" />
          )}

          <img
            src={isHovered && displayImages.length > 1 ? hoverPreviewImage : primaryImage}
            alt={name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* FLOATING BADGES */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
            {discountPercent > 0 && (
              <motion.span
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="px-2.5 py-1 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg backdrop-blur-md border border-white/20"
              >
                🔥 {discountPercent}% OFF
              </motion.span>
            )}
            {product.featured && (
              <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-black text-[9px] font-extrabold uppercase tracking-wider shadow">
                ⭐ Bestseller
              </span>
            )}
            {product.newArrival && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-600/90 text-white text-[9px] font-extrabold uppercase tracking-wider shadow backdrop-blur-sm animate-pulse">
                ✨ New Arrival
              </span>
            )}
          </div>

          {/* Wishlist Heart Button */}
          <button
            onClick={toggleWishlist}
            className={`absolute top-3 right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
              isWishlisted
                ? 'bg-red-600 text-white scale-110'
                : 'bg-white/90 backdrop-blur-md text-gray-700 hover:text-red-600 hover:bg-white'
            }`}
            title="Add to Wishlist"
          >
            <motion.div animate={isWishlisted ? { scale: [1, 1.4, 0.9, 1] } : { scale: 1 }}>
              <FiHeart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
            </motion.div>
          </button>

          {/* Quick View Floating Trigger Button */}
          <AnimatePresence>
            {isHovered && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setQuickViewOpen(true);
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 px-4 py-2 rounded-xl bg-charcoal-900/90 text-gold-400 text-xs font-bold backdrop-blur-md border border-gold-500/30 hover:bg-black transition flex items-center gap-1.5 shadow-xl"
              >
                <FiEye className="w-3.5 h-3.5" /> Quick View
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* PRODUCT DETAILS */}
        <div className="p-4 flex flex-col flex-grow space-y-2 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest line-clamp-1">
              {brand}
            </span>
            <span className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
              <FiZap className="w-3 h-3 text-amber-500 fill-amber-500" /> ⚡ Express Delivery Tomorrow
            </span>
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors">
            {name}
          </h3>

          {/* Rating Breakdown */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  className={`w-3 h-3 ${i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                />
              ))}
            </div>
            <span className="text-[11px] font-black text-gray-800 ml-1">{rating.toFixed(1)}</span>
            <span className="text-[10px] text-gray-400">({reviewCount.toLocaleString()} Reviews)</span>
          </div>

          {/* Color Swatches */}
          {colors.length > 0 && (
            <div className="flex items-center gap-1.5 pt-0.5">
              {colors.slice(0, 5).map((color, i) => {
                const hex = colorHexMap[color.toLowerCase()] || '#6B7280';
                const isSelected = selectedColorIdx === i;
                return (
                  <button
                    key={color + i}
                    onClick={(e) => handleColorClick(e, color, i)}
                    className={`w-3.5 h-3.5 rounded-full border transition-all ${
                      isSelected ? 'ring-2 ring-amber-500 scale-125' : 'border-gray-300 hover:scale-110'
                    }`}
                    style={{ backgroundColor: hex }}
                    title={color}
                  />
                );
              })}
            </div>
          )}

          {/* Stock Indicator */}
          <div className="pt-0.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" /> Only 5 Left in Stock
            </span>
          </div>

          {/* Pricing Section */}
          <div className="flex items-baseline flex-wrap gap-1.5 pt-1">
            <span className="text-base sm:text-lg font-black text-gray-900">
              {formatCurrency(finalPrice)}
            </span>
            {discountPercent > 0 && (
              <>
                <span className="text-xs text-gray-400 line-through">
                  {formatCurrency(price)}
                </span>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Save {formatCurrency(savingsAmount)}
                </span>
              </>
            )}
          </div>

          <div className="flex-grow min-h-[4px]" />

          {/* BUY NOW & SQUARE GLASS CART BUTTONS */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            {/* Square Glass Cart Icon Button */}
            <button
              onClick={handleAddToCart}
              className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all active:scale-90 ${
                addedToCart
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white/80 border-gray-200 text-gray-800 hover:bg-gray-100 hover:border-gray-300 shadow-sm'
              }`}
              title="Add to Cart"
            >
              {addedToCart ? <FiCheck className="w-5 h-5" /> : <FiShoppingBag className="w-5 h-5" />}
            </button>

            {/* Luxury Gold Buy Now Button */}
            <button
              onClick={handleBuyNow}
              className="flex-1 py-3 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <FiZap className="w-4 h-4 fill-black" /> Buy Now
            </button>
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
