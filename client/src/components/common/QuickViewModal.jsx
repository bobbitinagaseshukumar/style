import React, { useState } from 'react';
import Modal from './Modal';
import { FiShoppingBag, FiStar, FiHeart } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/cart/cartSlice';
import { formatCurrency } from '../../utils/formatCurrency';
import { toast } from 'react-toastify';

const QuickViewModal = ({ isOpen, onClose, product }) => {
  const dispatch = useDispatch();
  const [selectedImg, setSelectedImg] = useState(product?.images?.[0]?.url || 'https://via.placeholder.com/400');
  const [selectedSize, setSelectedSize] = useState('');

  if (!product) return null;

  const sizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes || '[]') : product.sizes || [];

  const handleAddToCart = () => {
    dispatch(addToCart({
      id: product.id,
      name: product.name,
      price: product.discountPrice || product.price,
      image: selectedImg,
      size: selectedSize || (sizes[0] || ''),
      quantity: 1,
    }));
    toast.success(`Added '${product.name}' to cart!`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick View">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div className="space-y-2">
          <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50 border">
            <img src={selectedImg} alt={product.name} className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-[10px] font-bold text-gold-600 uppercase tracking-widest block">{product.category?.name || 'Heritage Collection'}</span>
            <h2 className="text-xl font-serif font-bold text-charcoal-900">{product.name}</h2>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-charcoal-900">{formatCurrency(product.discountPrice || product.price)}</span>
            {product.discountPercent > 0 && <span className="text-sm text-gray-400 line-through">{formatCurrency(product.price)}</span>}
          </div>

          <p className="text-gray-600 line-clamp-3 leading-relaxed">{product.description || product.shortDesc}</p>

          {sizes.length > 0 && (
            <div>
              <span className="font-bold text-gray-700 block mb-1.5 uppercase">Size</span>
              <div className="flex gap-2">
                {sizes.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-3 py-1.5 rounded-lg border font-semibold ${selectedSize === s ? 'border-gold-500 bg-gold-50 text-gold-800' : 'border-gray-200'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t flex gap-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 py-3 rounded-full bg-gold-500 hover:bg-gold-600 text-white font-bold flex items-center justify-center gap-2 shadow"
            >
              <FiShoppingBag /> Add to Cart
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default QuickViewModal;
