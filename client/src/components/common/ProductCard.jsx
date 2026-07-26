import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingBag, FiStar } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/cart/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../redux/wishlist/wishlistSlice';
import { formatCurrency } from '../../utils/formatCurrency';
import { toast } from 'react-toastify';

const fadeInUp = { initial: { opacity: 0, y: 15 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

/**
 * Ultra-Clean Minimal Luxury Product Card
 * Fully clickable across the entire card area on Mobile & Desktop
 */
const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!product) return null;

  const name = product.name || 'StyleVerse Product';
  const slug = product.slug || product.id || '';
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

  const handleCardClick = () => {
    navigate(`/product/${slug}`);
  };

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      dispatch(removeFromWishlist(product.id));
      setIsWishlisted(false);
      toast.info('Removed from wishlist');
    } else {
      dispatch(addToWishlist({ id: product.id, name, price: finalPrice, image: primaryImage, slug }));
      setIsWishlisted(true);
      toast.success('Added to wishlist!');
    }
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({
      id: product.id,
      name,
      price: finalPrice,
      image: primaryImage,
      quantity: 1,
    }));
    toast.success(`"${name}" added to cart!`);
  };

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 flex flex-col h-full cursor-pointer select-none"
    >
      {/* HERO PRODUCT IMAGE */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse" />
        )}

        <img
          src={primaryImage}
          alt={name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black shadow-md">
              -{discountPercent}%
            </span>
          </div>
        )}

        {/* Wishlist Heart Icon Button */}
        <button
          onClick={toggleWishlist}
          aria-label="Add to Wishlist"
          className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${
            isWishlisted
              ? 'bg-red-600 text-white'
              : 'bg-white/90 backdrop-blur-sm text-gray-500 hover:text-red-600 hover:bg-white'
          }`}
        >
          <FiHeart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-white' : ''}`} />
        </button>

        {/* Hover / Touch Quick Add Button */}
        <button
          onClick={handleQuickAdd}
          aria-label="Add to Cart"
          className="absolute bottom-2.5 right-2.5 z-10 p-2.5 rounded-xl bg-gray-900/90 text-white shadow-lg backdrop-blur-sm hover:bg-black active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <FiShoppingBag className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {/* MINIMAL PRODUCT INFO */}
      <div className="flex flex-col flex-grow p-3 space-y-1.5">
        {category && (
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider line-clamp-1">
            {category}
          </p>
        )}

        <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-amber-600 transition-colors">
          {name}
        </h3>

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
            <span className="text-[10px] font-bold text-gray-700 ml-0.5">{rating.toFixed(1)}</span>
            {reviewCount > 0 && (
              <span className="text-[10px] text-gray-400">({reviewCount})</span>
            )}
          </div>
        )}

        <div className="flex-grow min-h-[2px]" />

        <div className="flex items-baseline gap-1.5 pt-0.5">
          <span className="text-sm sm:text-base font-black text-gray-900">
            {formatCurrency(finalPrice)}
          </span>
          {discountPercent > 0 && (
            <span className="text-[11px] text-gray-400 line-through">
              {formatCurrency(price)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
