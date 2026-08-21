import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMapPin, FiTruck, FiCreditCard, FiCheckCircle, FiShield, FiPlus, FiLock, FiDollarSign, FiWifiOff } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import api from '../../config/api';
import { clearCart } from '../../redux/cart/cartSlice';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatImageUrl } from '../../utils/formatImageUrl';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { toast } from 'react-toastify';
import useRazorpay from '../../hooks/useRazorpay';

const DEFAULT_CHECKOUT_FIELDS = {
  fullName: { enabled: true, required: true, label: 'Full Name', type: 'text', placeholder: 'Your Full Name' },
  phone: { enabled: true, required: true, label: 'Phone Number', type: 'tel', placeholder: '+91 98765 43210' },
  street: { enabled: true, required: true, label: 'Street Address', type: 'text', placeholder: 'Flat, House no., Building, Street' },
  city: { enabled: true, required: true, label: 'City', type: 'text', placeholder: 'City' },
  state: { enabled: true, required: true, label: 'State', type: 'text', placeholder: 'State' },
  postalCode: { enabled: true, required: true, label: 'Pincode', type: 'text', placeholder: 'Pincode' },
};

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { items, appliedCoupon, discountAmount, shippingFee: cartShippingFee, freeShippingThreshold: cartFreeThreshold } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth || {});

  const [searchParams] = useSearchParams();
  const isBuyNow = searchParams.get('buyNow') === 'true';

  // Buy Now mode: use the single item from sessionStorage instead of cart
  const buyNowItem = React.useMemo(() => {
    if (!isBuyNow) return null;
    try {
      const stored = sessionStorage.getItem('__KVLR_BUY_NOW_ITEM__');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  }, [isBuyNow]);

  // Effective items: either Buy Now single item or cart items
  const effectiveItems = isBuyNow && buyNowItem ? [buyNowItem] : items;

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [selectedShippingTierId, setSelectedShippingTierId] = useState('standard');
  const [loading, setLoading] = useState(false);
  const { initiatePayment, loading: paymentLoading } = useRazorpay();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const orderDebounceRef = useRef(false); // Prevent double-click

  // Dynamic Store Settings
  const [storeSettings, setStoreSettings] = useState(null);
  const [checkoutFields, setCheckoutFields] = useState(DEFAULT_CHECKOUT_FIELDS);
  const [customPaymentMethods, setCustomPaymentMethods] = useState([]);
  const [customShippingTiers, setCustomShippingTiers] = useState([]);

  // Add Address Modal & Dynamic Form State
  const [addressModal, setAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    addressType: 'HOME',
    isDefault: true,
  });

  const subtotal = effectiveItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Per-product shipping: sum each product's shippingFee × quantity (freeShipping items = ₹0)
  const hasPerProductShipping = effectiveItems.some(i => i.shippingFee > 0 || i.freeShipping);
  const perProductShippingTotal = effectiveItems.reduce((sum, i) => {
    if (i.freeShipping) return sum;
    return sum + (parseFloat(i.shippingFee) || 0) * i.quantity;
  }, 0);

  // Calculate dynamic shipping cost — prefer per-product fees, fallback to global settings
  let activeShippingFee;
  if (hasPerProductShipping) {
    activeShippingFee = perProductShippingTotal;
  } else {
    activeShippingFee = subtotal > (storeSettings?.freeShippingThreshold || cartFreeThreshold || 999)
      ? 0
      : (parseFloat(storeSettings?.shippingCharge || storeSettings?.shippingFee || cartShippingFee) || 0);
  }

  let activeDeliveryEstimate = storeSettings?.estimatedDeliveryDays || '3-5 Business Days';

  if (selectedShippingTierId !== 'standard' && customShippingTiers.length > 0) {
    const selectedTier = customShippingTiers.find(t => t.id === selectedShippingTierId && t.enabled);
    if (selectedTier) {
      if (selectedTier.freeThreshold > 0 && subtotal >= selectedTier.freeThreshold) {
        activeShippingFee = 0;
      } else {
        activeShippingFee = parseFloat(selectedTier.price) || 0;
      }
      activeDeliveryEstimate = selectedTier.deliveryDays || activeDeliveryEstimate;
    }
  }

  const grandTotal = Math.max(0, subtotal - discountAmount + activeShippingFee);

  const fetchAddresses = async () => {
    try {
      const { data } = await api.get('/users/addresses');
      if (data?.data?.length > 0) {
        setAddresses(data.data);
        const defaultAddr = data.data.find(a => a.isDefault) || data.data[0];
        setSelectedAddressId(prev => prev || defaultAddr.id);
        setAddressModal(false); // Ensure saved addresses tab is active
      } else {
        setAddresses([]);
        setAddressModal(true); // Switch to "Add New Address" tab when no saved addresses
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStoreConfig = async () => {
    try {
      const { data } = await api.get('/cms/settings');
      if (data?.data) {
        setStoreSettings(data.data);
        if (data.data.checkoutFields) {
          try {
            const fields = typeof data.data.checkoutFields === 'string'
              ? JSON.parse(data.data.checkoutFields)
              : data.data.checkoutFields;
            if (fields && typeof fields === 'object') {
              setCheckoutFields(fields);
            }
          } catch (e) {}
        }
        if (data.data.customPaymentMethods) {
          try {
            const pm = typeof data.data.customPaymentMethods === 'string'
              ? JSON.parse(data.data.customPaymentMethods)
              : data.data.customPaymentMethods;
            if (Array.isArray(pm)) setCustomPaymentMethods(pm);
          } catch (e) {}
        }
        if (data.data.customShippingTiers) {
          try {
            const tiers = typeof data.data.customShippingTiers === 'string'
              ? JSON.parse(data.data.customShippingTiers)
              : data.data.customShippingTiers;
            if (Array.isArray(tiers)) setCustomShippingTiers(tiers);
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAddresses();
    fetchStoreConfig();

    const handleSync = () => fetchAddresses();
    const handleSettingsSync = () => fetchStoreConfig();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleNetworkStatus = (e) => setIsOnline(e.detail?.isOnline ?? navigator.onLine);

    window.addEventListener('addresses_updated', handleSync);
    window.addEventListener('settings_updated', handleSettingsSync);
    window.addEventListener('kvlr:content-updated', handleSettingsSync);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('kvlr:network-status', handleNetworkStatus);

    return () => {
      window.removeEventListener('addresses_updated', handleSync);
      window.removeEventListener('settings_updated', handleSettingsSync);
      window.removeEventListener('kvlr:content-updated', handleSettingsSync);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('kvlr:network-status', handleNetworkStatus);
    };
  }, []);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    // Validate all enabled and required checkout fields
    for (const [key, field] of Object.entries(checkoutFields)) {
      if (field.enabled && field.required) {
        if (!addressForm[key] || String(addressForm[key]).trim() === '') {
          return toast.error(`Please enter ${field.label || key}`);
        }
      }
    }

    try {
      const { data } = await api.post('/users/addresses', addressForm);
      toast.success('Address added!');
      setAddressModal(false);
      setAddressForm({ fullName: '', phone: '', street: '', city: '', state: '', postalCode: '', addressType: 'HOME', isDefault: true });
      fetchAddresses();
      window.dispatchEvent(new CustomEvent('addresses_updated'));
      if (data?.data?.id) setSelectedAddressId(data.data.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address');
    }
  };

  const handlePlaceOrder = async () => {
    // Prevent double-click
    if (orderDebounceRef.current) return;

    // Network check
    if (!navigator.onLine) {
      toast.error('You\'re offline. Please check your internet connection and try again.');
      return;
    }

    if (!selectedAddressId) {
      toast.error('Please select or add a shipping address');
      return;
    }

    if (effectiveItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    orderDebounceRef.current = true;
    setTimeout(() => { orderDebounceRef.current = false; }, 3000); // 3s debounce

    const isRazorpay = paymentMethod === 'UPI' || paymentMethod === 'CARD' || paymentMethod === 'NET_BANKING' || paymentMethod === 'RAZORPAY';

    if (isRazorpay) {
      // Pay-first flow: Pay via Razorpay FIRST, then create order only after payment is verified
      try {
        setLoading(true);
        const lastPage = sessionStorage.getItem('__KVLR_LAST_PRODUCT_PAGE__') || '/';

        // Step 1: Open Razorpay payment modal (no DB order created yet)
        setLoading(false);
        initiatePayment({
          amount: grandTotal,
          receipt: `order_${Date.now()}`,
          notes: { userId: user?.id },
          prefill: {
            name: user?.fullName,
            email: user?.email,
            contact: user?.phone,
          },
          onSuccess: async (paymentData) => {
            // Step 2: Payment verified — NOW create the order with payment proof
            try {
              setLoading(true);
              const payload = {
                items: effectiveItems,
                addressId: selectedAddressId,
                paymentMethod: 'RAZORPAY',
                couponCode: appliedCoupon,
                discountAmount,
                shippingFee: activeShippingFee,
                deliveryEstimate: activeDeliveryEstimate,
                shippingTier: selectedShippingTierId,
                razorpayPaymentId: paymentData.razorpay_payment_id,
                razorpayOrderId: paymentData.razorpay_order_id,
                razorpaySignature: paymentData.razorpay_signature,
              };

              const { data: orderData } = await api.post('/orders', payload);
              if (orderData?.success) {
                if (isBuyNow) {
                  sessionStorage.removeItem('__KVLR_BUY_NOW_ITEM__');
                } else {
                  dispatch(clearCart());
                }
                toast.success('🎉 Payment successful! Order confirmed.');
                sessionStorage.removeItem('__KVLR_LAST_PRODUCT_PAGE__');
                navigate(lastPage);
              }
            } catch (orderErr) {
              console.error('[Order creation after payment]', orderErr);
              toast.error(orderErr.response?.data?.message || 'Payment succeeded but order creation failed. Contact support.');
              navigate('/orders');
            } finally {
              setLoading(false);
            }
          },
          onFailure: () => {
            // Payment cancelled/failed — NO order created, no stock touched
            toast.info('Payment cancelled. No order was created.');
          },
        });
      } catch (err) {
        console.error(err);
        if (err.code === 'ECONNABORTED') {
          toast.error('Connection timed out. Your internet may be slow — please try again.');
        } else if (!err.response) {
          toast.error('Network error. Please check your internet connection and try again.');
        } else {
          toast.error(err.response?.data?.message || 'Failed to initiate payment. Try again.');
        }
        setLoading(false);
      }
    } else {
      // COD / other methods: create order directly
      try {
        setLoading(true);
        const payload = {
          items: effectiveItems,
          addressId: selectedAddressId,
          paymentMethod,
          couponCode: appliedCoupon,
          discountAmount,
          shippingFee: activeShippingFee,
          deliveryEstimate: activeDeliveryEstimate,
          shippingTier: selectedShippingTierId,
        };

        const { data } = await api.post('/orders', payload);
        if (data?.success) {
          if (isBuyNow) {
            sessionStorage.removeItem('__KVLR_BUY_NOW_ITEM__');
          } else {
            dispatch(clearCart());
          }
          toast.success('🎉 Order placed successfully!');
          // Redirect back to the product page the customer was viewing
          const lastPage = sessionStorage.getItem('__KVLR_LAST_PRODUCT_PAGE__') || '/';
          sessionStorage.removeItem('__KVLR_LAST_PRODUCT_PAGE__');
          navigate(lastPage);
        }
      } catch (err) {
        console.error(err);
        if (err.code === 'ECONNABORTED') {
          toast.error('Connection timed out. Your internet may be slow — please try again.');
        } else if (!err.response) {
          toast.error('Network error. Please check your internet connection and try again.');
        } else {
          toast.error(err.response?.data?.message || 'Failed to place order. Try again.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900 mb-8">Express Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: ADDRESS & PAYMENT SELECTION */}
          <div className="lg:col-span-2 space-y-8">
            {/* STEP 1: SHIPPING ADDRESS — Saved Addresses + Add New */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <FiMapPin className="w-5 h-5 text-gold-600" />
                <h2 className="font-serif font-bold text-lg text-charcoal-900">1. Select Shipping Address</h2>
              </div>

              {/* Two option buttons: Saved Addresses vs Add New */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAddressModal(false)}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition border-2 ${
                    !addressModal
                      ? 'border-gold-500 bg-gold-50 text-charcoal-900'
                      : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  📍 Saved Addresses {addresses.length > 0 && `(${addresses.length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setAddressModal(true)}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition border-2 ${
                    addressModal
                      ? 'border-gold-500 bg-gold-50 text-charcoal-900'
                      : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <FiPlus className="inline w-4 h-4 mr-1" /> Add New Address
                </button>
              </div>

              {/* Tab Content: Saved Addresses */}
              {!addressModal && (
                <>
                  {addresses.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                      No saved addresses found. Click &apos;Add New Address&apos; to add your delivery location.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <label
                          key={addr.id}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                            selectedAddressId === addr.id
                              ? 'border-gold-500 bg-gold-50/50 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="shippingAddress"
                              checked={selectedAddressId === addr.id}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="mt-1 text-gold-500 focus:ring-gold-500 cursor-pointer"
                            />
                            <div className="space-y-1">
                              <strong className="block text-sm text-charcoal-900">{addr.fullName}</strong>
                              <p className="text-xs text-gray-600">{addr.street}</p>
                              {addr.apartment && <p className="text-xs text-gray-500">Apt/Suite: {addr.apartment}</p>}
                              {addr.landmark && <p className="text-xs text-gray-500">Landmark: {addr.landmark}</p>}
                              {addr.village && <p className="text-xs text-gray-500">{addr.village}</p>}
                              <p className="text-xs text-gray-600">{addr.city}, {addr.state} - {addr.postalCode}</p>
                              <p className="text-xs text-gray-400 mt-2 font-mono">Phone: {addr.phone}</p>
                              {addr.isDefault && (
                                <span className="inline-block mt-1 text-[10px] font-bold bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full">DEFAULT</span>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Tab Content: Add New Address (Inline Form) */}
              {addressModal && (
                <form onSubmit={handleAddAddress} className="space-y-4 bg-gray-50 rounded-2xl p-5 border border-gray-200">
                  {Object.entries(checkoutFields).filter(([_, f]) => f.enabled).map(([key, field]) => {
                    if (field.type === 'textarea') {
                      return (
                        <div key={key}>
                          <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                            {field.label || key} {field.required ? '*' : ''}
                          </label>
                          <textarea
                            rows={2}
                            required={field.required}
                            placeholder={field.placeholder || ''}
                            value={addressForm[key] || ''}
                            onChange={(e) => setAddressForm({ ...addressForm, [key]: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500 bg-white"
                          />
                        </div>
                      );
                    }
                    return (
                      <div key={key}>
                        <Input
                          label={`${field.label || key}${field.required ? ' *' : ''}`}
                          type={field.type || 'text'}
                          placeholder={field.placeholder || ''}
                          value={addressForm[key] || ''}
                          onChange={(e) => setAddressForm({ ...addressForm, [key]: e.target.value })}
                          required={field.required}
                        />
                      </div>
                    );
                  })}
                  <div className="flex justify-end gap-3 pt-3 border-t">
                    {addresses.length > 0 && (
                      <Button type="button" variant="outline" onClick={() => setAddressModal(false)}>Cancel</Button>
                    )}
                    <Button type="submit">Save Address</Button>
                  </div>
                </form>
              )}
            </div>

            {/* STEP 2: DELIVERY METHOD / SHIPPING TIER */}
            {customShippingTiers.filter(t => t.enabled).length > 0 && (
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b pb-3">
                  <FiTruck className="w-5 h-5 text-gold-600" />
                  <h2 className="font-serif font-bold text-lg text-charcoal-900">2. Select Delivery Speed</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                      selectedShippingTierId === 'standard'
                        ? 'border-gold-500 bg-gold-50/50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shippingTier"
                        value="standard"
                        checked={selectedShippingTierId === 'standard'}
                        onChange={(e) => setSelectedShippingTierId(e.target.value)}
                        className="text-gold-500 focus:ring-gold-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-sm text-charcoal-900 block">Standard Delivery</span>
                        <span className="text-xs text-gray-500">{storeSettings?.estimatedDeliveryDays || '3-5 Business Days'}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-charcoal-900">
                      {subtotal > (storeSettings?.freeShippingThreshold || 999) ? 'FREE' : formatCurrency(storeSettings?.shippingCharge || 99)}
                    </span>
                  </label>

                  {customShippingTiers.filter(t => t.enabled).map((tier) => (
                    <label
                      key={tier.id}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                        selectedShippingTierId === tier.id
                          ? 'border-gold-500 bg-gold-50/50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shippingTier"
                          value={tier.id}
                          checked={selectedShippingTierId === tier.id}
                          onChange={(e) => setSelectedShippingTierId(e.target.value)}
                          className="text-gold-500 focus:ring-gold-500 cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-sm text-charcoal-900 block">{tier.name}</span>
                          <span className="text-xs text-gray-500">{tier.deliveryDays}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-charcoal-900">
                        {tier.freeThreshold > 0 && subtotal >= tier.freeThreshold ? 'FREE' : formatCurrency(tier.price)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: PAYMENT METHOD */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <FiCreditCard className="w-5 h-5 text-gold-600" />
                <h2 className="font-serif font-bold text-lg text-charcoal-900">3. Select Payment Method</h2>
              </div>

              <div className="space-y-3">
                {/* Standard COD */}
                {storeSettings?.isCODEnabled !== false && (
                  <label className={`flex items-center gap-3 p-4 border-2 rounded-2xl cursor-pointer transition ${paymentMethod === 'COD' ? 'border-gold-500 bg-gold-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-gold-500 focus:ring-gold-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-sm text-charcoal-900 block">Cash On Delivery (COD)</span>
                      <span className="text-xs text-gray-500">Pay cash upon delivery at your doorstep</span>
                    </div>
                  </label>
                )}

                {/* Standard Razorpay */}
                {storeSettings?.isRazorpayEnabled !== false && (
                  <label className={`flex items-center gap-3 p-4 border-2 rounded-2xl cursor-pointer transition ${paymentMethod === 'UPI' ? 'border-gold-500 bg-gold-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="UPI"
                      checked={paymentMethod === 'UPI'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-gold-500 focus:ring-gold-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-sm text-charcoal-900 block">Razorpay UPI & Cards</span>
                      <span className="text-xs text-gray-500">Instant online payments via UPI (PhonePe, GPay), NetBanking & Cards</span>
                    </div>
                  </label>
                )}

                {/* Stripe International */}
                {storeSettings?.isStripeEnabled && (
                  <label className={`flex items-center gap-3 p-4 border-2 rounded-2xl cursor-pointer transition ${paymentMethod === 'STRIPE' ? 'border-gold-500 bg-gold-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="STRIPE"
                      checked={paymentMethod === 'STRIPE'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-gold-500 focus:ring-gold-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-sm text-charcoal-900 block">Stripe International</span>
                      <span className="text-xs text-gray-500">Accept global credit and debit cards worldwide</span>
                    </div>
                  </label>
                )}

                {/* Custom Payment Methods */}
                {customPaymentMethods.filter(p => p.enabled).map((pm) => (
                  <label key={pm.id} className={`flex items-center gap-3 p-4 border-2 rounded-2xl cursor-pointer transition ${paymentMethod === pm.id ? 'border-gold-500 bg-gold-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="payment"
                      value={pm.id}
                      checked={paymentMethod === pm.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-gold-500 focus:ring-gold-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-sm text-charcoal-900 block">{pm.name}</span>
                      <span className="text-xs text-gray-500">{pm.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY SIDEBAR */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm h-fit space-y-6">
            <h3 className="font-serif font-bold text-lg text-charcoal-900 border-b pb-3">Order Items ({effectiveItems.length})</h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {effectiveItems.map((item, idx) => (
                <div key={idx} className="flex gap-3 text-xs">
                  <img src={formatImageUrl(item.image, item.name)} alt={item.name || ''} className="w-12 h-16 object-cover rounded-xl shrink-0 bg-gray-50 border border-gray-100" />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-charcoal-900 block truncate">{item.name}</span>
                    <span className="text-gray-400">Qty: {item.quantity}</span>
                    {item.freeShipping ? (
                      <span className="block text-[10px] text-emerald-600 font-semibold">🚚 Free Delivery</span>
                    ) : item.shippingFee > 0 ? (
                      <span className="block text-[10px] text-gray-400">Delivery: {formatCurrency(item.shippingFee)}/pc</span>
                    ) : null}
                  </div>
                  <span className="font-bold text-charcoal-900">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs text-gray-600 border-t pt-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-charcoal-900">{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount ({appliedCoupon})</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span className="font-semibold text-charcoal-900">
                  {activeShippingFee === 0 ? <strong className="text-emerald-600">FREE</strong> : formatCurrency(activeShippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-gray-400">
                <span>Estimated Delivery</span>
                <span>{activeDeliveryEstimate}</span>
              </div>
            </div>

            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-serif font-bold text-base text-charcoal-900">Grand Total</span>
              <span className="font-bold text-xl text-charcoal-900">{formatCurrency(grandTotal)}</span>
            </div>

            {user?.status === 'BLOCKED' || user?.canPlaceOrders === false || user?.canCheckout === false ? (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center space-y-1">
                <p className="font-bold text-sm text-red-800 flex items-center justify-center gap-1.5">
                  <FiLock className="w-4 h-4" /> Account Order Restricted
                </p>
                <p className="text-gray-600">
                  Your account has been restricted from placing orders by store administration. You may browse and view products, but checkout is disabled.
                </p>
              </div>
            ) : !isOnline ? (
              <button
                disabled
                className="w-full py-4 rounded-full bg-gray-400 text-white font-semibold text-sm flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
              >
                <FiWifiOff className="w-4 h-4 animate-pulse" />
                Waiting for connection...
              </button>
            ) : (
              <button
                onClick={handlePlaceOrder}
                disabled={loading || paymentLoading}
                className="w-full py-4 rounded-full bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading || paymentLoading
                  ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                  : (paymentMethod === 'UPI' || paymentMethod === 'CARD' || paymentMethod === 'NET_BANKING' || paymentMethod === 'RAZORPAY')
                    ? `Pay ${formatCurrency(grandTotal)} — Razorpay`
                    : 'Confirm & Place Order'
                }
                {!(loading || paymentLoading) && <FiLock />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
