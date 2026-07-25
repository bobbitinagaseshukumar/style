import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiShoppingBag, FiPrinter, FiArrowRight } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatCurrency';

const PaymentSuccess = () => {
  const location = useLocation();
  const order = location.state?.order || {};

  return (
    <div className="min-h-screen bg-white py-16 flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-white border border-gray-200 rounded-3xl p-8 shadow-2xl text-center space-y-6"
      >
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <FiCheckCircle className="w-10 h-10" />
        </div>

        <div>
          <h1 className="text-2xl font-serif font-bold text-charcoal-900">Payment & Order Confirmed!</h1>
          <p className="text-xs text-gray-500 mt-1">Thank you for your purchase from StyleVerse.</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs space-y-2 text-left">
          <div className="flex justify-between">
            <span className="text-gray-500">Order Number:</span>
            <strong className="text-charcoal-900 font-mono">{order.orderNumber || 'SV-782910'}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Payment Status:</span>
            <span className="font-bold text-emerald-600">PAID / CONFIRMED</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-bold text-charcoal-900">
            <span>Total Paid:</span>
            <span>{formatCurrency(order.totalAmount || 0)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link
            to="/orders"
            className="py-3 rounded-full border border-gray-300 text-xs font-bold text-charcoal-900 hover:bg-gray-50 transition"
          >
            Track Order
          </Link>
          <Link
            to="/categories"
            className="py-3 rounded-full bg-gold-500 hover:bg-gold-600 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-md"
          >
            Continue <FiArrowRight />
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
