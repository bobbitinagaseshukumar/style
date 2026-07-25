import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiXCircle, FiRotateCcw, FiHelpCircle } from 'react-icons/fi';

const PaymentFailure = () => {
  return (
    <div className="min-h-screen bg-white py-16 flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-white border border-gray-200 rounded-3xl p-8 shadow-2xl text-center space-y-6"
      >
        <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
          <FiXCircle className="w-10 h-10" />
        </div>

        <div>
          <h1 className="text-2xl font-serif font-bold text-charcoal-900">Payment Unsuccessful</h1>
          <p className="text-xs text-gray-500 mt-1">Your payment could not be processed. No funds were debited from your account.</p>
        </div>

        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-xs text-red-700 text-left space-y-1">
          <strong>Possible Reasons:</strong>
          <ul className="list-disc list-inside space-y-0.5 text-gray-600">
            <li>Bank network timeout during UPI authorization</li>
            <li>Insufficient account balance or card limit</li>
            <li>Incorrect OTP or CVV entered</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link
            to="/contact"
            className="py-3 rounded-full border border-gray-300 text-xs font-bold text-charcoal-900 hover:bg-gray-50 transition flex items-center justify-center gap-1"
          >
            <FiHelpCircle /> Help
          </Link>
          <Link
            to="/checkout"
            className="py-3 rounded-full bg-charcoal-900 hover:bg-charcoal-800 text-gold-400 text-xs font-bold transition flex items-center justify-center gap-1 shadow-md"
          >
            <FiRotateCcw /> Retry Checkout
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentFailure;
