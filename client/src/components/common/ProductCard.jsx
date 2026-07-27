import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHeart, FiShoppingBag, FiStar, FiEye, FiZap,
  FiTruck, FiShield, FiCheck, FiArrowRight
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
 * Luxury 3D Interactive Product Card (Amazon + Apple + Nike + Adidas Inspired)
 * Features 3D cursor tilt, reflective light shine, multi-image hover preview, color swatches,
 * wishlist heart particle pop, quick view modal, Buy Now & Add to Cart.
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

  // 3D Tilt State
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  if (!product) return null;

  const name = product.name || 'StyleVerse Luxury Product';
  const slug = product.slug || product.id || '';
  const brand = product.brand?.name || product.brandName || 'KVLR STYLES';

  // Process Images
  const rawImages = product.images?.length > 0
    ? product.images.map(img => (typeof img === 'string' ? img : img.url))
    : [`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=600&background=0D0D0D&color=D4AF37&bold=true`];
  
  const displayImages = rawImages.length > 0 ? rawImages : [rawImages[0]];
  const primaryImage = activeImageIdx < displayImages.length ? displayImages[activeImageIdx] : displayImages[0];
  const hoverPreviewImage = displayImages.length > 1 ? displayImages[1] : primaryImage;

  // Pricing
  const price = product.price || 0;
  const discountPrice = product.discountPrice || 0;
  const discountPercent = product.discountPercent || 0;
  const finalPrice = discountPrice > 0 ? discountPrice : price;

  const rating = product.rating || product.averageRating || 4.8;
  const reviewCount = product.reviewCount || product.totalReviews || 128;
  const category = product.category?.name || product.categoryName || '';

  // Process Colors & Sizes
  const colors = (() => {
    try {
      if (typeof product.colors === 'string') return JSON.parse(product.colors);
      return Array.isArray(product.colors) ? product.colors : [];
    } catch {
      return [];
    }
  })();

  const sizes = (() => {
    try {
      if (typeof product.sizes === 'string') return JSON.parse(product.sizes);
      return Array.isArray(product.sizes) ? product.sizes : [];
    } catch {
      return [];
    }
  })();

  // 3D Motion Handlers
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;

    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
    setActiveImageIdx(0);
  };

  const handleCardClick = () => {
    navigate(`/product/${slug}`);
  };

  const toggleWishlist = (e) => {
    e.stopPropagation();
    if (isWishlisted) {
      dispatch(removeFromWishlist(product.id));
      setIsWishlisted(false);
      toast.info('Removed from wishlist');
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
    toast.success(`"${name}" added to cart! 🛍️`);
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
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.4, delay: (index % 6) * 0.06 }}
        style={{
          transformStyle: 'preserve-3d',
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onClick={handleCardClick}
        className="group relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(212,175,55,0.15)] transition-all duration-300 flex flex-col h-full cursor-pointer select-none"
      >
        {/* Shine Animation overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-20" />

        {/* HERO IMAGE CONTAINER */}
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

          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
            {discountPercent > 0 && (
              <motion.span
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="px-2.5 py-1 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg"
              >
                -{discountPercent}% OFF
              </motion.span>
            )}
            {product.featured && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500 text-black text-[9px] font-extrabold uppercase tracking-wider shadow">
                ⭐ Featured
              </span>
            )}
            {product.newArrival && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[9px] font-extrabold uppercase tracking-wider shadow">
                NEW
              </span>
            )}
          </div>

          {/* Wishlist Heart Button */}
          <button
            onClick={toggleWishlist}
            className={`absolute top-3 right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
              isWishlisted
                ? 'bg-red-600 text-white scale-110'
                : 'bg-white/80 backdrop-blur-md text-gray-700 hover:text-red-600 hover:bg-white'
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

        {/* DETAILS CONTAINER */}
        <div className="p-4 flex flex-col flex-grow space-y-2 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest line-clamp-1">
              {brand}
            </span>
            <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1">
              <FiTruck className="w-3 h-3 text-emerald-600" /> Express
            </span>
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-amber-600 transition-colors">
            {name}
          </h3>

          {/* Star Ratings */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  className={`w-3 h-3 ${i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                />
              ))}
            </div>
            <span className="text-[11px] font-black text-gray-800 ml-0.5">{rating.toFixed(1)}</span>
            <span className="text-[10px] text-gray-400">({reviewCount})</span>
          </div>

          {/* Color Swatch Circles */}
          {colors.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1">
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
              {colors.length > 5 && (
                <span className="text-[9px] font-bold text-gray-400">+{colors.length - 5}</span>
              )}
            </div>
          )}

          {/* Pricing */}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-base sm:text-lg font-black text-gray-900">
              {formatCurrency(finalPrice)}
            </span>
            {discountPercent > 0 && (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(price)}
              </span>
            )}
          </div>

          <div className="flex-grow min-h-[4px]" />

          {/* DUAL ACTION BUTTONS (Buy Now & Add to Cart) */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={handleAddToCart}
              className="py-2.5 px-2 rounded-xl bg-gray-100 text-gray-900 hover:bg-gray-200 text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95"
            >
              <FiShoppingBag className="w-3.5 h-3.5" /> Cart
            </button>
            <button
              onClick={handleBuyNow}
              className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold text-xs hover:from-amber-400 transition flex items-center justify-center gap-1 shadow-sm active:scale-95"
            >
              <FiZap className="w-3.5 h-3.5" /> Buy Now
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
