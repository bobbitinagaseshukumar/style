import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import { formatCurrency } from '../../utils/formatCurrency';

const CartSummary = ({ total, onCheckout }) => {
  const navigate = useNavigate();
  // In a real app, these would come from the store or props
  const shipping = total > 5000 ? 0 : 150;
  const tax = total * 0.18; // 18% GST example
  const finalTotal = total + shipping + tax;

  return (
    <div className="bg-gray-50 rounded-lg p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-playfair font-medium text-gray-900 mb-6">Order Summary</h2>
      
      <div className="flow-root">
        <dl className="-my-4 divide-y divide-gray-200 text-sm">
          <div className="flex items-center justify-between py-4">
            <dt className="text-gray-600">Subtotal</dt>
            <dd className="font-medium text-gray-900">{formatCurrency(total)}</dd>
          </div>
          <div className="flex items-center justify-between py-4">
            <dt className="text-gray-600">Shipping</dt>
            <dd className="font-medium text-gray-900">
              {shipping === 0 ? <span className="text-green-600">Free</span> : formatCurrency(shipping)}
            </dd>
          </div>
          <div className="flex items-center justify-between py-4">
            <dt className="text-gray-600">Estimated Tax</dt>
            <dd className="font-medium text-gray-900">{formatCurrency(tax)}</dd>
          </div>
          <div className="flex items-center justify-between py-4">
            <dt className="text-base font-medium text-gray-900">Order Total</dt>
            <dd className="text-xl font-bold text-charcoal-900">{formatCurrency(finalTotal)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-8">
        <Button 
          onClick={onCheckout || (() => navigate('/checkout'))}
          className="w-full text-base font-medium py-3"
          size="lg"
        >
          Proceed to Checkout
        </Button>
      </div>
      
      <div className="mt-4 flex justify-center text-center text-sm text-gray-500">
        <p>
          or{' '}
          <button
            type="button"
            className="font-medium text-gold-600 hover:text-gold-500"
            onClick={() => navigate('/categories')}
          >
            Continue Shopping <span aria-hidden="true"> &rarr;</span>
          </button>
        </p>
      </div>
    </div>
  );
};

export default CartSummary;
