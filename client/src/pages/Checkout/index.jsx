import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMapPin, FiTruck, FiCreditCard, FiCheckCircle, FiShield, FiPlus, FiLock } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import api from '../../config/api';
import { clearCart } from '../../redux/cart/cartSlice';
import { formatCurrency } from '../../utils/formatCurrency';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { toast } from 'react-toastify';

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { items, appliedCoupon, discountAmount, shippingFee, freeShippingThreshold } = useSelector((state) => state.cart);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);

  // Add Address Modal
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

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const calculatedShipping = subtotal > freeShippingThreshold ? 0 : shippingFee;
  const grandTotal = Math.max(0, subtotal - discountAmount + calculatedShipping);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const { data } = await api.get('/users/addresses');
        if (data?.data?.length > 0) {
          setAddresses(data.data);
          const defaultAddr = data.data.find(a => a.isDefault) || data.data[0];
          setSelectedAddressId(defaultAddr.id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAddresses();
  }, []);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/users/addresses', addressForm);
      toast.success('Address added!');
      setAddressModal(false);
      setAddressForm({ fullName: '', phone: '', street: '', city: '', state: '', postalCode: '', addressType: 'HOME', isDefault: true });
      const addrRes = await api.get('/users/addresses');
      setAddresses(addrRes.data?.data || []);
      if (data?.data?.id) setSelectedAddressId(data.data.id);
    } catch (err) {
      toast.error('Failed to add address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Please select or add a shipping address');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        items,
        addressId: selectedAddressId,
        paymentMethod,
        couponCode: appliedCoupon,
        discountAmount,
        shippingFee: calculatedShipping,
      };

      const { data } = await api.post('/orders', payload);
      if (data?.success) {
        dispatch(clearCart());
        toast.success('Order placed successfully!');
        navigate('/orders', { state: { newOrder: data.data } });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to place order. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900 mb-8">Express Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: ADDRESS & PAYMENT SELECTION */}
          <div className="lg:col-span-2 space-y-8">
            {/* STEP 1: SHIPPING ADDRESS */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                  <FiMapPin className="w-5 h-5 text-gold-600" />
                  <h2 className="font-serif font-bold text-lg text-charcoal-900">1. Select Shipping Address</h2>
                </div>
                <Button variant="outline" icon={FiPlus} onClick={() => setAddressModal(true)}>Add Address</Button>
              </div>

              {addresses.length === 0 ? (
                <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                  No saved addresses found. Click &apos;Add Address&apos; to specify delivery location.
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
                          className="mt-1 text-gold-500 focus:ring-gold-500"
                        />
                        <div>
                          <strong className="block text-sm text-charcoal-900">{addr.fullName}</strong>
                          <p className="text-xs text-gray-600 mt-1">{addr.street}</p>
                          <p className="text-xs text-gray-600">{addr.city}, {addr.state} - {addr.postalCode}</p>
                          <p className="text-xs text-gray-400 mt-2">Phone: {addr.phone}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* STEP 2: PAYMENT METHOD */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <FiCreditCard className="w-5 h-5 text-gold-600" />
                <h2 className="font-serif font-bold text-lg text-charcoal-900">2. Select Payment Method</h2>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border rounded-2xl cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-gold-500 focus:ring-gold-500"
                  />
                  <div>
                    <span className="font-bold text-sm text-charcoal-900 block">Cash On Delivery (COD)</span>
                    <span className="text-xs text-gray-500">Pay cash when your order is delivered to your doorstep</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border rounded-2xl cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="UPI"
                    checked={paymentMethod === 'UPI'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-gold-500 focus:ring-gold-500"
                  />
                  <div>
                    <span className="font-bold text-sm text-charcoal-900 block">Instant UPI / NetBanking / Cards</span>
                    <span className="text-xs text-gray-500">Pay via PhonePe, Google Pay, Paytm, or Credit/Debit Card</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY SIDEBAR */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm h-fit space-y-6">
            <h3 className="font-serif font-bold text-lg text-charcoal-900 border-b pb-3">Order Items ({items.length})</h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-3 text-xs">
                  <img src={item.image} alt="" className="w-12 h-16 object-cover rounded-xl shrink-0 bg-gray-50" />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-charcoal-900 block truncate">{item.name}</span>
                    <span className="text-gray-400">Qty: {item.quantity}</span>
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
                  {calculatedShipping === 0 ? <strong className="text-emerald-600">FREE</strong> : formatCurrency(calculatedShipping)}
                </span>
              </div>
            </div>

            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-serif font-bold text-base text-charcoal-900">Grand Total</span>
              <span className="font-bold text-xl text-charcoal-900">{formatCurrency(grandTotal)}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full py-4 rounded-full bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Processing Order...' : 'Confirm & Place Order'}
              <FiLock />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Add Address */}
      <Modal isOpen={addressModal} onClose={() => setAddressModal(false)} title="Add Shipping Address">
        <form onSubmit={handleAddAddress} className="space-y-4">
          <Input label="Full Name" value={addressForm.fullName} onChange={e => setAddressForm({ ...addressForm, fullName: e.target.value })} required />
          <Input label="Phone Number" value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} required />
          <Input label="Flat, House no., Building, Street" value={addressForm.street} onChange={e => setAddressForm({ ...addressForm, street: e.target.value })} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="City" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} required />
            <Input label="State" value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} required />
          </div>
          <Input label="Pincode / Postal Code" value={addressForm.postalCode} onChange={e => setAddressForm({ ...addressForm, postalCode: e.target.value })} required />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setAddressModal(false)}>Cancel</Button>
            <Button type="submit">Save Address</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Checkout;
