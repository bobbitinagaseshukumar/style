import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingBag, FiStar } from 'react-icons/fi';
import { addToWishlist, removeFromWishlist } from '../../redux/wishlist/wishlistSlice';
import { formatCurrency } from '../../utils/formatCurrency';
import Badge from '../common/Badge';
import { toast } from 'react-toastify';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const wishlistItems = useSelector(state => state.wishlist.items);
  const isWishlisted = wishlistItems.some(item => item._id === product._id);

  const handleWishlist = (e) => {
    e.preventDefault();
    if (isWishlisted) {
      dispatch(removeFromWishlist(product._id));
      toast.info('Removed from wishlist');
    } else {
      dispatch(addToWishlist(product));
      toast.success('Added to wishlist');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-gray-100"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <Link to={`/product/${product.slug}`}>
          <img 
            src={product.images?.[0]?.url || 'https://via.placeholder.com/400x533'} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {product.images?.[1] && (
            <img 
              src={product.images[1].url} 
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
          )}
        </Link>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isNew && <Badge variant="gold">New</Badge>}
          {product.salePrice && <Badge variant="error">Sale</Badge>}
        </div>

        {/* Wishlist Button */}
        <button 
          onClick={handleWishlist}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm text-gray-500 hover:text-red-500 hover:bg-white transition-all shadow-sm z-10"
        >
          <FiHeart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {/* Quick Actions (Hover) */}
        <div className="absolute bottom-0 inset-x-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/50 to-transparent">
          <Link 
            to={`/product/${product.slug}`}
            className="w-full bg-white/90 backdrop-blur-sm hover:bg-white text-charcoal-900 flex items-center justify-center py-2 rounded font-medium text-sm transition-colors"
          >
            <FiShoppingBag className="mr-2" /> Quick View
          </Link>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-1 text-xs text-gray-500 uppercase tracking-wider">{product.category?.name}</div>
        <Link to={`/product/${product.slug}`} className="flex-grow">
          <h3 className="font-medium text-charcoal-900 hover:text-gold-500 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {product.salePrice ? (
              <>
                <span className="font-semibold text-charcoal-900">{formatCurrency(product.salePrice)}</span>
                <span className="text-sm text-gray-400 line-through">{formatCurrency(product.price)}</span>
              </>
            ) : (
              <span className="font-semibold text-charcoal-900">{formatCurrency(product.price)}</span>
            )}
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <FiStar className="text-gold-400 fill-gold-400 mr-1" />
            <span>{product.ratings?.toFixed(1) || '0.0'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
