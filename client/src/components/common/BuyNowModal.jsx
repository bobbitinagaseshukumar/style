/**
 * BuyNowModal — Premium dual-option checkout modal.
 * Presents: Online Payment vs WhatsApp Order.
 * Connects to Redux cart, settings API, and order API.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FiX, FiShoppingBag, FiCreditCard, FiCheck,
  FiMapPin, FiTag, FiFileText, FiChevronRight
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../config/api';
import { formatCurrency } from '../utils/formatCurrency';
import { buildWhatsAppOrderMessage, whatsappLink } from '../utils/whatsapp';
import useRazorpay from '../hooks/useRazorpay';

/* ─── Step indicator ────────────────────────────────────────── */
const Step = ({ n, label, active, done }) => (
  <div className="flex items-center gap-2">
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition
      ${done ? 'bg-emerald-500 text-white' : active ? 'bg-yellow-400 text-black' : 'bg-gray-100 text-gray-400'}`}>
      {done ? <FiCheck size={12} /> : n}
    </div>
    <span className={`text-xs font-semibold ${active ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
  </div>
);

const PAYMENT_METHODS = [
  { id: 'COD', label: 'Cash on Delivery', icon: '💵' },
  { id: 'UPI', label: 'UPI / GPay / PhonePe', icon: '📱' },
  { id: 'CARD', label: 'Credit / Debit Card', icon: '💳' },
  { id: 'NET_BANKING', label: 'Net Banking', icon: '🏦' },
];

/* ─── Main Component ─────────────────────────────────────────── */
const BuyNowModal = ({ isOpen, onClose, product = null, cartMode = false }) => {
  const navigate = useNavigate();
  const user = useSelector(s => s.auth?.user);
  const reduxSettings = useSelector(s => s.settings?.storeSettings);
  const cartItems = useSelector(s => s.cart?.items || []);

  const [mode, setMode] = useState(null);       // null | 'online' | 'whatsapp'
  const [step, setStep] = useState(1);          // 1=mode, 2=address, 3=payment/confirm
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [couponCode, setCouponCode] = useState('');
  const [notes, setNotes] = useState('');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const { initiatePayment, loading: paymentLoading } = useRazorpay();

  // Order items: either single product or cart
  const orderItems = cartMode
    ? cartItems.map(i => ({ ...i, productId: i.id, image: i.image }))
    : product
      ? [{ productId: product.id, name: product.name, price: product.price, discountPrice: product.discountPrice, quantity: 1, image: product.images?.[0]?.url, color: product.selectedColor, size: product.selectedSize }]
      : [];

  const subtotal = orderItems.reduce((s, i) => s + (i.discountPrice || i.price) * i.quantity, 0);
  const shipping = subtotal > 999 ? 0 : 99;
  const total = subtotal + shipping;

  const currentSettings = { ...(reduxSettings || {}), ...(settings || {}) };
  const isWhatsAppEnabled = currentSettings.whatsappEnabled !== false && Boolean(currentSettings.whatsappNumber || reduxSettings?.whatsappNumber);

  useEffect(() => {
    if (!isOpen) { setMode(null); setStep(1); return; }
    // Load addresses & settings
    Promise.all([
      api.get('/users/addresses').catch(() => ({ data: null })),
      api.get('/cms/settings').catch(() => api.get('/settings').catch(() => ({ data: null }))),
    ]).then(([addrRes, settingsRes]) => {
      const addrs = addrRes.data?.data || [];
      setAddresses(addrs);
      if (addrs.length > 0) setSelectedAddress(addrs[0].id);
      if (settingsRes.data?.data) {
        setSettings(settingsRes.data.data);
      }
    });
  }, [isOpen]);

  const handleModeSelect = (m) => {
    if (!user) { toast.error('Please login to place an order'); onClose(); navigate('/login'); return; }
    setMode(m);
    setStep(2);
  };

  const handlePlaceOnlineOrder = async () => {
    if (!selectedAddress) { toast.error('Please select a delivery address'); return; }

    const isRazorpay = paymentMethod === 'UPI' || paymentMethod === 'CARD' || paymentMethod === 'NET_BANKING' || paymentMethod === 'RAZORPAY';

    if (isRazorpay) {
      // Amazon-style flow: Create order (PENDING) → Pay → Verify → Mark PAID
      try {
        setLoading(true);

        // Step 1: Create order with PENDING payment status
        const payload = {
          items: orderItems.map(i => ({ productId: i.productId || i.id, quantity: i.quantity, size: i.size, color: i.color })),
          addressId: selectedAddress,
          paymentMethod: 'RAZORPAY',
          couponCode: couponCode || undefined,
          notes: notes || undefined,
          shippingFee: shipping,
        };
        const { data: orderData } = await api.post('/orders', payload);

        if (!orderData?.success) {
          toast.error('Failed to create order');
          setLoading(false);
          return;
        }

        const createdOrder = orderData.data;
        setLoading(false);

        // Step 2: Open Razorpay payment modal
        initiatePayment({
          amount: total,
          receipt: `order_${createdOrder.orderNumber}`,
          notes: { orderId: createdOrder.id, orderNumber: createdOrder.orderNumber },
          orderId: createdOrder.id,
          prefill: {
            name: user?.fullName,
            email: user?.email,
            contact: user?.phone,
          },
          onSuccess: () => {
            // Step 3: Payment verified — order is now PAID on backend
            toast.success('🎉 Payment successful! Order confirmed.');
            onClose();
            navigate('/orders');
          },
          onFailure: () => {
            // Payment cancelled/failed — order stays PENDING in DB
            toast.warning('Payment not completed. Complete payment from Orders page.');
            onClose();
            navigate('/orders');
          },
        });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to create order. Try again.');
        setLoading(false);
      }
    } else {
      // COD flow: create order directly
      try {
        setLoading(true);
        const payload = {
          items: orderItems.map(i => ({ productId: i.productId || i.id, quantity: i.quantity, size: i.size, color: i.color })),
          addressId: selectedAddress,
          paymentMethod,
          couponCode: couponCode || undefined,
          notes: notes || undefined,
          shippingFee: shipping,
        };
        const { data } = await api.post('/orders', payload);
        toast.success('🎉 Order placed successfully!');
        onClose();
        navigate('/orders');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to place order');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleWhatsAppOrder = async () => {
    const waNumber = currentSettings.whatsappNumber || reduxSettings?.whatsappNumber || '919876543210';
    if (!waNumber) { toast.error('WhatsApp ordering is not configured by the store.'); return; }

    try {
      setLoading(true);

      // Log order in DB
      const payload = {
        items: orderItems.map(i => ({ productId: i.productId || i.id, quantity: i.quantity, size: i.size, color: i.color })),
        addressId: selectedAddress || undefined,
        paymentMethod,
        notes: notes || undefined,
      };
      const { data } = await api.post('/orders/whatsapp', payload);

      // Get selected address text
      const addr = addresses.find(a => a.id === selectedAddress);
      const addrText = addr
        ? `${addr.street}, ${addr.city}, ${addr.state} - ${addr.postalCode}`
        : '';

      // Build WhatsApp message
      const encodedMsg = buildWhatsAppOrderMessage({
        user: {
          fullName: user.fullName,
          phone: user.phone,
          whatsappNumber: user.whatsappNumber,
          address: addrText,
        },
        items: orderItems.map(i => ({
          name: i.name,
          color: i.color,
          size: i.size,
          quantity: i.quantity,
          price: i.discountPrice || i.price,
          image: i.image,
        })),
        paymentMethod: paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Bank Transfer',
        notes,
      });

      const link = whatsappLink(waNumber, encodedMsg);
      window.open(link, '_blank');
      toast.success('📱 WhatsApp opened! Please send the pre-filled message.');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process WhatsApp order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 60, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
          className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-3xl z-10">
            <div>
              <h2 className="font-black text-gray-900 text-base">
                {step === 1 ? 'Choose Order Method' : step === 2 ? 'Delivery Details' : mode === 'online' ? 'Payment' : 'Confirm & Send'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatCurrency(subtotal)} · {orderItems.length} item{orderItems.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500">
              <FiX size={16} />
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50">
            <Step n={1} label="Method" active={step === 1} done={step > 1} />
            <div className="flex-1 h-px bg-gray-100" />
            <Step n={2} label="Address" active={step === 2} done={step > 2} />
            <div className="flex-1 h-px bg-gray-100" />
            <Step n={3} label="Confirm" active={step === 3} done={false} />
          </div>

          <div className="p-5 space-y-5">

            {/* ── STEP 1: Mode Selection ───────────────────── */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Online */}
                <button
                  onClick={() => handleModeSelect('online')}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 transition group text-left"
                >
                  <div className="w-14 h-14 rounded-2xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <FiCreditCard size={26} className="text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-base">Online Payment</p>
                    <p className="text-xs text-gray-500 mt-0.5">UPI, Card, Net Banking, or Cash on Delivery</p>
                    <p className="text-xs text-emerald-600 font-bold mt-1">✓ Instant confirmation · Secure checkout</p>
                  </div>
                  <FiChevronRight size={18} className="text-gray-300 group-hover:text-yellow-500 transition" />
                </button>

                {/* WhatsApp */}
                {isWhatsAppEnabled && (
                  <button
                    onClick={() => handleModeSelect('whatsapp')}
                    className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition group text-left"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center flex-shrink-0">
                      <FaWhatsapp size={30} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-gray-900 text-base">WhatsApp Order</p>
                      <p className="text-xs text-gray-500 mt-0.5">Message us directly — no online payment required</p>
                      <p className="text-xs text-green-600 font-bold mt-1">✓ Simple · Fast · Pay on delivery</p>
                    </div>
                    <FiChevronRight size={18} className="text-gray-300 group-hover:text-green-500 transition" />
                  </button>
                )}

                {/* Order summary */}
                <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Order Summary</p>
                  {orderItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {item.image && <img src={item.image} className="w-10 h-12 object-cover rounded-lg" alt="" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{item.name}</p>
                        {item.color && <p className="text-[10px] text-gray-400">{item.color}{item.size ? ' · ' + item.size : ''}</p>}
                      </div>
                      <span className="text-xs font-bold text-gray-900">{formatCurrency((item.discountPrice || item.price) * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between text-xs text-gray-500"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : formatCurrency(shipping)}</span></div>
                    <div className="flex justify-between font-black text-sm text-gray-900 mt-1"><span>Total</span><span>{formatCurrency(total)}</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Address ──────────────────────────── */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-3">
                    <FiMapPin size={14} className="text-yellow-500" /> Delivery Address
                  </p>
                  {addresses.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-2xl">
                      <p className="text-sm text-gray-500">No saved addresses</p>
                      <button onClick={() => navigate('/address-book')} className="text-yellow-600 text-sm font-bold hover:underline mt-1">
                        + Add Address
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {addresses.map(addr => (
                        <button key={addr.id} onClick={() => setSelectedAddress(addr.id)}
                          className={`w-full text-left p-4 rounded-2xl border-2 transition
                            ${selectedAddress === addr.id ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <div className="flex items-start gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center
                              ${selectedAddress === addr.id ? 'border-yellow-400 bg-yellow-400' : 'border-gray-300'}`}>
                              {selectedAddress === addr.id && <FiCheck size={9} className="text-black" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800">{addr.fullName || addr.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                {addr.street}, {addr.city}, {addr.state} — {addr.postalCode}
                              </p>
                              {addr.phone && <p className="text-xs text-gray-400 mt-0.5">📞 {addr.phone}</p>}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <FiFileText size={12} /> Order Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Any special instructions..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition">
                    ← Back
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedAddress && addresses.length > 0) { toast.error('Select an address'); return; }
                      setStep(3);
                    }}
                    className="flex-1 py-3 rounded-2xl bg-yellow-400 text-black text-sm font-black hover:bg-yellow-300 transition"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Payment / Confirm ────────────────── */}
            {step === 3 && (
              <div className="space-y-4">
                {mode === 'online' && (
                  <div>
                    <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-3">
                      <FiCreditCard size={13} className="text-yellow-500" /> Payment Method
                    </p>
                    <div className="space-y-2">
                      {PAYMENT_METHODS.map(pm => (
                        <button key={pm.id} onClick={() => setPaymentMethod(pm.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition text-left
                            ${paymentMethod === pm.id ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <span className="text-lg">{pm.icon}</span>
                          <span className="text-sm font-semibold text-gray-800">{pm.label}</span>
                          {paymentMethod === pm.id && <FiCheck size={14} className="ml-auto text-yellow-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {mode === 'whatsapp' && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <FaWhatsapp size={24} className="text-green-600" />
                      <div>
                        <p className="font-bold text-green-800 text-sm">WhatsApp Order Preview</p>
                        <p className="text-xs text-green-600">WhatsApp will open with your order pre-filled</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Your order details, address, and payment preference will be sent as a message. Our team will confirm within minutes.
                    </p>
                  </div>
                )}

                {/* Coupon code for online */}
                {mode === 'online' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <FiTag size={12} /> Coupon Code
                    </label>
                    <div className="flex gap-2">
                      <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none uppercase" />
                      <button className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition">
                        Apply
                      </button>
                    </div>
                  </div>
                )}

                {/* Order total summary */}
                <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between text-sm text-gray-600"><span>Shipping</span><span className={shipping === 0 ? 'text-emerald-600 font-bold' : ''}>{shipping === 0 ? 'FREE 🎁' : formatCurrency(shipping)}</span></div>
                  <div className="flex justify-between font-black text-base text-gray-900 border-t border-gray-200 pt-2 mt-2">
                    <span>Total</span><span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition">
                    ← Back
                  </button>
                  {mode === 'online' ? (
                    <button
                      onClick={handlePlaceOnlineOrder}
                      disabled={loading || paymentLoading}
                      className="flex-1 py-3 rounded-2xl bg-yellow-400 text-black text-sm font-black hover:bg-yellow-300 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading || paymentLoading
                        ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Processing...</>
                        : (paymentMethod === 'UPI' || paymentMethod === 'CARD' || paymentMethod === 'NET_BANKING')
                          ? <><FiCreditCard size={14} /> Pay {formatCurrency(total)}</>
                          : <><FiShoppingBag size={14} /> Place Order</>
                      }
                    </button>
                  ) : (
                    <button
                      onClick={handleWhatsAppOrder}
                      disabled={loading}
                      className="flex-1 py-3 rounded-2xl bg-green-500 text-white text-sm font-black hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Opening...</>
                        : <><FaWhatsapp size={16} /> Send via WhatsApp</>
                      }
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BuyNowModal;
