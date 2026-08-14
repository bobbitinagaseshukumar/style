import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';

const AuthLayout = () => {
  const { storeSettings } = useSelector((state) => state.settings || {});
  const storeName = storeSettings?.storeName || 'StyleVerse';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-charcoal-900 overflow-hidden -z-10">
        <div className="absolute w-96 h-96 bg-gold-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 top-0 -left-10 animate-blob"></div>
        <div className="absolute w-96 h-96 bg-gold-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 top-20 -right-10 animate-blob animation-delay-2000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/20"
      >
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-white font-playfair">
            {storeName}
          </h2>
        </div>
        <Outlet />
      </motion.div>
    </div>
  );
};

export default AuthLayout;
