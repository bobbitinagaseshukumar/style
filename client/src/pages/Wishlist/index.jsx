import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiHeart, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { removeFromWishlist } from '../../redux/wishlist/wishlistSlice';
import { addToCart } from '../../redux/cart/cartSlice';
import EmptyState from '../../components/common/EmptyState';
import { formatCurrency } from '../../utils/formatCurrency';
import { toast } from 'react-toastify';

const Wishlist = () => {
  const { items } = useSelector((state) => state.wishlist);
  const dispatch = useDispatch();

  const handleRemove = (id) => {
    dispatch(removeFromWishlist(id));
    toast.info('Removed from wishlist');
  };

  const handleAddToCart = (product) => {
    if (product.sizes?.length > 0 || product.colors?.length > 0) {
      toast.info('Please select size/color on product page');
      return;
    }
    dispatch(addToCart({
      id: product._id,
      product: product._id,
      name: product.name,
      price: product.salePrice || product.price,
      image: product.images?.[0]?.url,
      quantity: 1,
      stock: product.stock
    }));
    toast.success('Added to cart');
    dispatch(removeFromWishlist(product._id));
  };

  if (items.length === 0) {
    return (
      <EmptyState 
        icon={FiHeart}
        title="Your Wishlist is Empty"
        message="Save items you love here to easily find them later."
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900 mb-8">My Wishlist</h1>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {items.map((item) => (
          <div key={item._id} className="bg-white border border-gray-100 rounded-lg overflow-hidden group">
            <div className="relative aspect-[3/4] bg-gray-100">
              <Link to={`/product/${item.slug}`}>
                <img src={item.images?.[0]?.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </Link>
              <button 
                onClick={() => handleRemove(item._id)}
                className="absolute top-2 right-2 p-2 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm transition-colors"
                title="Remove"
              >
                <FiTrash2 />
              </button>
            </div>
            <div className="p-4">
              <Link to={`/product/${item.slug}`} className="block font-medium text-charcoal-900 mb-2 truncate">
                {item.name}
              </Link>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-charcoal-900">{formatCurrency(item.salePrice || item.price)}</span>
                <button 
                  onClick={() => handleAddToCart(item)}
                  className="text-gold-500 hover:text-gold-600 transition-colors"
                  title="Add to Cart"
                >
                  <FiShoppingBag className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
