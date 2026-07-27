import React, { useState } from 'react';
import Modal from './Modal';
import { FiShoppingBag, FiStar, FiZap, FiTruck, FiShield, FiCheck, FiHeart } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/cart/cartSlice';
import { formatCurrency } from '../../utils/formatCurrency';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

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

const QuickViewModal = ({ isOpen, onClose, product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (!product) return null;

  const images = product.images?.length > 0
    ? product.images.map(img => (typeof img === 'string' ? img : img.url))
    : ['https://via.placeholder.com/400'];

  const [selectedImg, setSelectedImg] = useState(images[0]);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const sizes = (() => {
    try {
      if (typeof product.sizes === 'string') return JSON.parse(product.sizes);
      return Array.isArray(product.sizes) ? product.sizes : [];
    } catch {
      return [];
    }
  })();

  const colors = (() => {
    try {
      if (typeof product.colors === 'string') return JSON.parse(product.colors);
      return Array.isArray(product.colors) ? product.colors : [];
    } catch {
      return [];
    }
  })();

  const price = product.price || 0;
  const discountPrice = product.discountPrice || 0;
  const discountPercent = product.discountPercent || 0;
  const finalPrice = discountPrice > 0 ? discountPrice : price;

  const handleAddToCart = () => {
    dispatch(addToCart({
      id: product.id,
      name: product.name,
      price: finalPrice,
      image: selectedImg,
      size: selectedSize || (sizes[0] || ''),
      color: selectedColor || (colors[0] || ''),
      quantity: 1,
    }));
    toast.success(`"${product.name}" added to cart! 🛍️`);
    onClose();
  };

  const handleBuyNow = () => {
    dispatch(addToCart({
      id: product.id,
      name: product.name,
      price: finalPrice,
      image: selectedImg,
      size: selectedSize || (sizes[0] || ''),
      color: selectedColor || (colors[0] || ''),
      quantity: 1,
    }));
    onClose();
    navigate('/checkout');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick View Product Experience">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs p-2">
        {/* Gallery Area */}
        <div className="space-y-3">
          <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50 border border-gray-200 relative">
            <img src={selectedImg} alt={product.name} className="w-full h-full object-cover" />
            {discountPercent > 0 && (
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase">
                -{discountPercent}% OFF
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImg(img)}
                  className={`w-14 h-16 rounded-xl overflow-hidden border-2 transition ${
                    selectedImg === img ? 'border-amber-500 scale-105' : 'border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Area */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest block">
                {product.brand?.name || 'KVLR STYLES'}
              </span>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{product.name}</h2>
            </div>

            {/* Ratings */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <FiStar key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <span className="font-black text-gray-900">4.8</span>
              <span className="text-gray-400">(128 reviews)</span>
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-2xl font-black text-gray-900">{formatCurrency(finalPrice)}</span>
              {discountPercent > 0 && (
                <span className="text-sm text-gray-400 line-through">{formatCurrency(price)}</span>
              )}
            </div>

            {/* Short Description */}
            <p className="text-gray-600 line-clamp-3 leading-relaxed">
              {product.shortDesc || product.description || 'Luxury tailored craftsmanship built for supreme comfort and distinction.'}
            </p>

            {/* Color Selector */}
            {colors.length > 0 && (
              <div>
                <span className="font-bold text-gray-700 block mb-1.5 uppercase text-[10px]">
                  Colors: <span className="text-amber-600">{selectedColor || colors[0]}</span>
                </span>
                <div className="flex gap-2">
                  {colors.map((c) => {
                    const hex = colorHexMap[c.toLowerCase()] || '#6B7280';
                    return (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          selectedColor === c ? 'ring-2 ring-amber-500 scale-110' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: hex }}
                        title={c}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {sizes.length > 0 && (
              <div>
                <span className="font-bold text-gray-700 block mb-1.5 uppercase text-[10px]">
                  Select Size
                </span>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                        selectedSize === s
                          ? 'border-amber-500 bg-amber-50 text-amber-800'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock & Delivery badges */}
            <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-semibold text-gray-600">
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-gray-50 border border-gray-100">
                <FiTruck className="text-emerald-600 w-4 h-4" />
                <span>Free Express Delivery</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-gray-50 border border-gray-100">
                <FiShield className="text-amber-600 w-4 h-4" />
                <span>100% Original Product</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
            <button
              onClick={handleAddToCart}
              className="py-3 rounded-xl bg-gray-100 text-gray-900 font-bold hover:bg-gray-200 transition flex items-center justify-center gap-2"
            >
              <FiShoppingBag className="w-4 h-4" /> Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              className="py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold hover:from-amber-400 transition flex items-center justify-center gap-2 shadow-lg"
            >
              <FiZap className="w-4 h-4" /> Buy Now
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default QuickViewModal;
