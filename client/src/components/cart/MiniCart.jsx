import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiX, FiShoppingBag, FiTrash2, FiArrowRight } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart } from '../../redux/cart/cartSlice';
import { formatCurrency } from '../../utils/formatCurrency';

const MiniCart = ({ isOpen, onClose }) => {
  const { items } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Lock body scroll and handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop Overlay - Clicking outside closes drawer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer"
        />

        {/* Right-Side Drawer */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <FiShoppingBag className="w-5 h-5 text-gold-600" />
                <h2 className="font-serif font-bold text-lg text-charcoal-900">Your Shopping Cart ({items.length})</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-charcoal-900 rounded-full hover:bg-gray-100 transition cursor-pointer"
                aria-label="Close Cart"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-16 text-gray-400 space-y-3">
                  <FiShoppingBag className="w-12 h-12 mx-auto text-gray-300 stroke-1" />
                  <p className="text-sm font-medium">Your cart is currently empty.</p>
                  <button
                    onClick={onClose}
                    className="text-xs text-gold-600 font-bold hover:underline cursor-pointer"
                  >
                    Explore Collections →
                  </button>
                </div>
              ) : (
                items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-3 border border-gray-100 rounded-2xl bg-gray-50/50 relative group">
                    <img
                      src={item.image || 'https://via.placeholder.com/80'}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-xl shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-charcoal-900 truncate">{item.name}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                      <p className="text-sm font-extrabold text-charcoal-900 mt-1">{formatCurrency(item.price)}</p>
                    </div>
                    <button
                      onClick={() => dispatch(removeFromCart(item.id || item._id))}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition cursor-pointer"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary */}
            {items.length > 0 && (
              <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 font-medium">Subtotal</span>
                  <span className="font-extrabold text-charcoal-900 text-base">{formatCurrency(subtotal)}</span>
                </div>
                <p className="text-[10px] text-gray-400 text-center">Shipping and taxes calculated at checkout.</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { onClose(); navigate('/cart'); }}
                    className="py-3 rounded-xl border border-charcoal-900 text-charcoal-900 font-bold text-xs hover:bg-gray-100 transition cursor-pointer"
                  >
                    View Cart
                  </button>
                  <button
                    onClick={() => { onClose(); navigate('/checkout'); }}
                    className="py-3 rounded-xl bg-charcoal-900 text-gold-400 font-extrabold text-xs hover:bg-black transition shadow-lg cursor-pointer flex items-center justify-center gap-1"
                  >
                    Checkout <FiArrowRight />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default MiniCart;
