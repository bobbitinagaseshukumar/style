import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingBag, FiTrash2, FiMinus, FiPlus, FiTag, FiArrowRight, FiShield, FiTruck } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { updateQuantity, removeFromCart, applyCoupon, removeCoupon } from '../../redux/cart/cartSlice';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatImageUrl } from '../../utils/formatImageUrl';
import { toast } from 'react-toastify';

import api from '../../config/api';

const Cart = () => {
  const { items, appliedCoupon, discountAmount, shippingFee, freeShippingThreshold } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState('');
  const [validating, setValidating] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const calculatedShipping = subtotal > freeShippingThreshold ? 0 : (items.length > 0 ? shippingFee : 0);
  const grandTotal = Math.max(0, subtotal - discountAmount + calculatedShipping);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    try {
      setValidating(true);
      const { data } = await api.post('/coupons/validate', { code, cartTotal: subtotal });
      if (data?.success && data?.data) {
        const result = data.data;
        dispatch(applyCoupon({
          code: result.code,
          discountPercent: result.discountPercent || 0,
          discountFixed: result.discountAmount || 0
        }));
        toast.success(`🎉 ${data.message || 'Coupon applied!'} You save ${formatCurrency(result.amountSaved)}`);
        setCouponInput('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setValidating(false);
    }
  };


  return (
    <div className="min-h-screen bg-white py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900 mb-8">Shopping Cart ({items.length})</h1>

        {items.length === 0 ? (
          <div className="p-16 text-center bg-gray-50 rounded-3xl border border-gray-100 max-w-lg mx-auto space-y-4">
            <FiShoppingBag className="w-16 h-16 text-gray-300 mx-auto stroke-1" />
            <h2 className="text-xl font-serif font-bold text-charcoal-900">Your Cart is Empty</h2>
            <p className="text-xs text-gray-500">Explore our luxury sarees, jewellery, and festive wear.</p>
            <Link to="/categories" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold-500 text-white text-xs font-bold shadow-lg hover:bg-gold-600 transition">
              Explore Collections <FiArrowRight />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ITEMS LIST */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center">
                  <div className="flex gap-4 items-start w-full sm:w-auto">
                    <img src={formatImageUrl(item.image, item.name)} alt={item.name} className="w-24 h-32 object-cover rounded-2xl bg-gray-50 shrink-0 border border-gray-100" />
                    <button onClick={() => dispatch(removeFromCart({ ...item, index: idx }))} className="sm:hidden text-gray-400 hover:text-red-600 p-2 rounded-lg transition ml-auto">
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0 w-full">
                    <h3 className="font-semibold text-sm sm:text-base text-charcoal-900 line-clamp-1 mb-1">{item.name}</h3>
                    <div className="flex gap-2 text-xs text-gray-500 mb-3">
                      {item.size && <span className="bg-gray-100 px-2 py-0.5 rounded font-medium">Size: {item.size}</span>}
                      {item.color && <span className="bg-gray-100 px-2 py-0.5 rounded font-medium">Color: {typeof item.color === 'object' ? item.color.name : item.color}</span>}
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity counter */}
                      <div className="flex items-center border border-gray-200 rounded-full px-2 py-1 bg-gray-50">
                        <button
                          onClick={() => dispatch(updateQuantity({ ...item, quantity: Math.max(1, item.quantity - 1) }))}
                          className="p-2 sm:p-1 text-gray-500 hover:text-charcoal-900"
                        >
                          <FiMinus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-charcoal-900">{item.quantity}</span>
                        <button
                          onClick={() => dispatch(updateQuantity({ ...item, quantity: item.quantity + 1 }))}
                          className="p-2 sm:p-1 text-gray-500 hover:text-charcoal-900"
                        >
                          <FiPlus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="font-bold text-base text-charcoal-900">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  </div>

                  <button onClick={() => dispatch(removeFromCart({ ...item, index: idx }))} className="hidden sm:block text-gray-400 hover:text-red-600 p-2 rounded-lg transition">
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* SUMMARY & COUPON */}
            <div className="space-y-6">
              {/* Coupon Box */}
              <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 shadow-sm space-y-3">
                <label className="text-xs font-bold text-charcoal-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FiTag className="text-gold-600" /> Apply Discount Coupon
                </label>

                {appliedCoupon ? (
                  <div className="flex justify-between items-center bg-gold-50 border border-gold-300 p-3 rounded-2xl text-xs">
                    <span className="font-bold text-gold-800">COUPON: {appliedCoupon} (-{formatCurrency(discountAmount)})</span>
                    <button onClick={() => dispatch(removeCoupon())} className="text-red-600 font-bold hover:underline">Remove</button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. FESTIVE15"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-mono uppercase focus:ring-2 focus:ring-gold-500 focus:outline-none"
                    />
                    <button type="submit" className="px-4 py-2.5 bg-charcoal-900 text-gold-400 text-xs font-bold rounded-xl hover:bg-charcoal-800">
                      Apply
                    </button>
                  </form>
                )}
              </div>

              {/* Summary Box */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-serif font-bold text-lg text-charcoal-900 border-b pb-3">Order Summary</h3>

                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Bag Total ({items.length} items)</span>
                    <span className="font-semibold text-charcoal-900">{formatCurrency(subtotal)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Coupon Discount</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Shipping Charge</span>
                    <span className="font-semibold text-charcoal-900">
                      {calculatedShipping === 0 ? <strong className="text-emerald-600">FREE</strong> : formatCurrency(calculatedShipping)}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="font-serif font-bold text-base text-charcoal-900">Grand Total</span>
                  <span className="font-bold text-xl text-charcoal-900">{formatCurrency(grandTotal)}</span>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full py-4 rounded-full bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  Proceed to Checkout <FiArrowRight />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
