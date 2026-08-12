import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiMinus, FiPlus, FiHeart, FiShare2, FiStar } from 'react-icons/fi';
import { addToCart } from '../../redux/cart/cartSlice';
import { addToWishlist } from '../../redux/wishlist/wishlistSlice';
import { formatCurrency } from '../../utils/formatCurrency';
import { toast } from 'react-toastify';
import Button from '../common/Button';

const ProductInfo = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(state => state.auth?.user);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    if (!user) {
      toast.info('Please sign in to add items to your cart');
      navigate('/login');
      return;
    }
    if (product.sizes?.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (product.colors?.length > 0 && !selectedColor) {
      toast.error('Please select a color');
      return;
    }
    
    dispatch(addToCart({
      id: `${product._id}-${selectedSize}-${selectedColor}`,
      product: product._id,
      name: product.name,
      price: product.salePrice || product.price,
      image: product.images?.[0]?.url,
      size: selectedSize,
      color: selectedColor,
      quantity,
      stock: product.stock
    }));
    toast.success('Added to cart');
  };

  const handleWishlist = () => {
    if (!user) {
      toast.info('Please sign in to add items to your wishlist');
      navigate('/login');
      return;
    }
    dispatch(addToWishlist(product));
    toast.success('Added to wishlist');
  };

  return (
    <div className="flex flex-col h-full pt-4 md:pt-0">
      <h1 className="text-3xl font-playfair font-bold text-charcoal-900 mb-2">{product.name}</h1>
      
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center text-gold-500">
          <FiStar className="fill-current" />
          <span className="ml-1 text-sm text-gray-600 font-medium">{product.ratings?.toFixed(1) || '0.0'} ({product.numOfReviews || 0} Reviews)</span>
        </div>
        <span className="text-sm text-gray-500 uppercase tracking-wider">{product.category?.name}</span>
      </div>

      <div className="mb-6 flex items-end gap-3">
        {product.salePrice ? (
          <>
            <span className="text-3xl font-semibold text-charcoal-900">{formatCurrency(product.salePrice)}</span>
            <span className="text-xl text-gray-400 line-through mb-1">{formatCurrency(product.price)}</span>
            <span className="text-red-600 font-medium mb-1">
              {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
            </span>
          </>
        ) : (
          <span className="text-3xl font-semibold text-charcoal-900">{formatCurrency(product.price)}</span>
        )}
      </div>

      <div className="prose prose-sm text-gray-600 mb-8 max-w-none">
        <p>{product.description}</p>
      </div>

      <hr className="border-gray-200 mb-6" />

      {/* Colors */}
      {product.colors?.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-charcoal-900">Color: <span className="text-gray-500 font-normal">{selectedColor || 'Select'}</span></span>
          </div>
          <div className="flex gap-3">
            {product.colors.map((color, i) => {
              const cStr = typeof color === 'object' ? (color?.name || color?.hex || '') : String(color || '');
              const hex = (typeof color === 'object' && color?.hex) ? color.hex : (cStr.startsWith('#') ? cStr : cStr.toLowerCase());
              return (
                <button
                  key={cStr + i}
                  onClick={() => setSelectedColor(cStr)}
                  className={`w-10 h-10 rounded-full border-2 focus:outline-none transition-all ${
                    selectedColor === cStr ? 'border-gold-500 p-1' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <span className="block w-full h-full rounded-full border border-gray-200" style={{ backgroundColor: hex }} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sizes */}
      {product.sizes?.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-charcoal-900">Size: <span className="text-gray-500 font-normal">{selectedSize || 'Select'}</span></span>
            <button className="text-sm text-gray-500 underline hover:text-gold-500">Size Guide</button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`py-2 px-4 border rounded-md text-sm font-medium transition-all focus:outline-none
                  ${selectedSize === size 
                    ? 'border-gold-500 bg-gold-50 text-gold-700' 
                    : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
                  }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex items-center border border-gray-300 rounded-md h-12 w-full sm:w-32">
          <button 
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="flex-1 flex justify-center items-center text-gray-500 hover:text-gold-500"
          >
            <FiMinus />
          </button>
          <input 
            type="number" 
            className="w-12 text-center font-medium border-0 focus:ring-0 p-0 text-charcoal-900" 
            value={quantity}
            readOnly
          />
          <button 
            type="button"
            onClick={() => setQuantity(Math.min(product.stock || 10, quantity + 1))}
            className="flex-1 flex justify-center items-center text-gray-500 hover:text-gold-500"
          >
            <FiPlus />
          </button>
        </div>
        
        <Button 
          variant="primary"
          size="lg"
          className="flex-1 font-semibold tracking-wide uppercase"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          icon={FiShoppingBag}
        >
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </div>

      <div className="flex gap-6 mt-auto">
        <button onClick={handleWishlist} className="flex items-center text-sm font-medium text-gray-500 hover:text-gold-500 transition-colors">
          <FiHeart className="mr-2" /> Add to Wishlist
        </button>
        <button className="flex items-center text-sm font-medium text-gray-500 hover:text-gold-500 transition-colors">
          <FiShare2 className="mr-2" /> Share
        </button>
      </div>
    </div>
  );
};

export default ProductInfo;
