import React from 'react';
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-screen max-w-md bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <FiShoppingBag className="w-5 h-5 text-gold-600" />
                <h2 className="font-serif font-bold text-lg text-charcoal-900">Your Shopping Cart ({items.length})</h2>
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-charcoal-900 rounded-full hover:bg-gray-100 transition">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-16 text-gray-400 space-y-3">
                  <FiShoppingBag className="w-12 h-12 mx-auto text-gray-300 stroke-1" />
                  <p className="text-sm font-medium">Your cart is currently empty.</p>
                  <button onClick={onClose} className="text-xs text-gold-600 font-bold hover:underline">
                    Explore Collections →
                  </button>
                </div>
              ) : (
                items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-3 border border-gray-100 rounded-2xl bg-gray-50/50 relative group">
                    <img src={item.image} alt={item.name} className="w-20 h-24 object-cover rounded-xl bg-white shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-charcoal-900 truncate mb-1">{item.name}</h4>
                      <div className="flex gap-2 text-[10px] text-gray-500 mb-2">
                        {item.size && <span className="bg-white px-2 py-0.5 rounded border">{item.size}</span>}
                        {item.color && <span className="bg-white px-2 py-0.5 rounded border">{item.color}</span>}
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Qty: <strong>{item.quantity}</strong></span>
                        <span className="font-bold text-charcoal-900">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => dispatch(removeFromCart(item))}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-600 p-1 transition"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-4">
                <div className="flex justify-between text-sm font-bold text-charcoal-900">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <p className="text-[11px] text-gray-400">Taxes and shipping calculated at checkout.</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/cart');
                    }}
                    className="py-3 rounded-full border border-gray-300 text-xs font-bold text-charcoal-900 hover:bg-gray-100 transition"
                  >
                    View Cart
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/checkout');
                    }}
                    className="py-3 rounded-full bg-gold-500 hover:bg-gold-600 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-lg"
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
