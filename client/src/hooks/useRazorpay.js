/**
 * useRazorpay — Custom hook for Razorpay Standard Checkout.
 * Handles: create order → open modal → verify signature.
 * Used by both Checkout page and BuyNowModal.
 */

import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../config/api';

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

const useRazorpay = () => {
  const [loading, setLoading] = useState(false);
  const user = useSelector(s => s.auth?.user);
  const storeSettings = useSelector(s => s.settings?.storeSettings);

  /**
   * initiatePayment — Full Razorpay checkout flow.
   *
   * @param {Object} options
   * @param {number} options.amount      — Total in rupees (will be converted to paise)
   * @param {string} options.currency    — Currency code (default: 'INR')
   * @param {string} options.receipt     — Receipt ID
   * @param {Object} options.notes       — Metadata
   * @param {Function} options.onSuccess — Called with { razorpay_payment_id, razorpay_order_id, razorpay_signature }
   * @param {Function} options.onFailure — Called on payment failure or cancellation
   * @param {string} options.orderId     — Our internal order ID (for server-side status update)
   * @param {Object} options.prefill     — Prefill info { name, email, contact }
   */
  const initiatePayment = useCallback(async ({
    amount,
    currency = 'INR',
    receipt,
    notes = {},
    onSuccess,
    onFailure,
    orderId,
    prefill = {},
  }) => {
    // Validate Razorpay script is loaded
    if (typeof window.Razorpay === 'undefined') {
      toast.error('Payment service not loaded. Please refresh and try again.');
      onFailure?.({ error: 'Razorpay script not loaded' });
      return;
    }

    // Validate amount
    const amountInPaise = Math.round(amount * 100);
    if (amountInPaise < 100) {
      toast.error('Minimum payable amount is ₹1');
      onFailure?.({ error: 'Amount too low' });
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create Razorpay order on backend
      const { data } = await api.post('/payments/create-order', {
        amount: amountInPaise,
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        notes: { ...notes, userId: user?.id },
      });

      if (!data?.success || !data?.data?.orderId) {
        throw new Error('Failed to create payment order');
      }

      const { orderId: razorpayOrderId, keyId } = data.data;

      // Step 2: Open Razorpay checkout modal
      const options = {
        key: keyId || RAZORPAY_KEY_ID,
        amount: amountInPaise,
        currency,
        name: storeSettings?.storeName || 'KVLR Styles',
        description: receipt || 'Order Payment',
        order_id: razorpayOrderId,
        prefill: {
          name: prefill.name || user?.fullName || '',
          email: prefill.email || user?.email || '',
          contact: prefill.contact || user?.phone || '',
        },
        theme: {
          color: storeSettings?.primaryColor || '#D4AF37',
        },
        handler: async function (response) {
          // Step 3: Verify payment signature on backend
          try {
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderId || undefined,
            });

            if (verifyRes.data?.success) {
              toast.success('💰 Payment successful!');
              onSuccess?.({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              });
            } else {
              toast.error('Payment verification failed. Contact support.');
              onFailure?.({ error: 'Verification failed' });
            }
          } catch (verifyErr) {
            console.error('[Razorpay Verify Error]:', verifyErr);
            toast.error('Payment verification failed. Please contact support.');
            onFailure?.({ error: verifyErr.message });
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast.info('Payment cancelled');
            onFailure?.({ error: 'User cancelled payment' });
          },
          confirm_close: true,
          escape: true,
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', function (response) {
        setLoading(false);
        console.error('[Razorpay Payment Failed]:', response.error);
        toast.error(`Payment failed: ${response.error.description || 'Unknown error'}`);
        onFailure?.({
          error: response.error.description,
          code: response.error.code,
          reason: response.error.reason,
        });
      });

      razorpayInstance.open();
    } catch (err) {
      setLoading(false);
      console.error('[Razorpay Init Error]:', err);
      toast.error(err.response?.data?.message || 'Failed to initiate payment. Try again.');
      onFailure?.({ error: err.message });
    }
  }, [user, storeSettings]);

  return { initiatePayment, loading };
};

export default useRazorpay;
