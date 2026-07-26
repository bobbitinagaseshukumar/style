import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiLock, FiMail, FiUser, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, registerUser, clearError } from '../../redux/auth/authSlice';
import { toast } from 'react-toastify';

/**
 * Premium Luxury Auth Drawer — Sign In & Register Overlay
 * Smooth slide-in, ESC key listener, backdrop click close, single drawer guarantee.
 */
const AuthDrawer = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '', phone: '' });

  const dispatch = useDispatch();
  const { isLoading, error, isAuthenticated, user } = useSelector((state) => state.auth);

  // Auto close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Auto close on successful authentication
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      toast.success(`Welcome back, ${user?.fullName || user?.name || 'Valued Customer'}! ✨`);
      onClose();
    }
  }, [isAuthenticated, isOpen, onClose, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());

    if (mode === 'login') {
      if (!formData.email || !formData.password) {
        return toast.error('Please enter your email and password');
      }
      dispatch(loginUser({ email: formData.email, password: formData.password }));
    } else {
      if (!formData.fullName || !formData.email || !formData.password) {
        return toast.error('Please fill in all required fields');
      }
      dispatch(registerUser({ name: formData.fullName, email: formData.email, password: formData.password, phone: formData.phone }));
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop Overlay - Clicking outside closes drawer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        />

        {/* Drawer Content */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between"
          >
            {/* Header */}
            <div>
              <div className="p-6 bg-charcoal-900 border-b border-gold-500/20 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gold-400">STYLEVERSE LUXURY</span>
                  <h2 className="text-xl font-serif font-bold mt-0.5">
                    {mode === 'login' ? 'Customer Sign In' : 'Create Account'}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition cursor-pointer"
                  aria-label="Close Sign In"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="flex border-b border-gray-100 bg-gray-50/80">
                <button
                  onClick={() => { setMode('login'); dispatch(clearError()); }}
                  className={`flex-1 py-3 text-xs font-bold transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white text-gold-600 border-b-2 border-gold-500 shadow-sm'
                      : 'text-gray-500 hover:text-charcoal-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setMode('register'); dispatch(clearError()); }}
                  className={`flex-1 py-3 text-xs font-bold transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-white text-gold-600 border-b-2 border-gold-500 shadow-sm'
                      : 'text-gray-500 hover:text-charcoal-900'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-600">
                  {error}
                </div>
              )}

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        required
                        placeholder="Your Full Name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500 allow-select"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500 allow-select"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500 allow-select"
                    />
                  </div>
                </div>

                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-bold text-charcoal-900 uppercase tracking-wide mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-500 allow-select"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-charcoal-900 hover:bg-black text-gold-400 font-extrabold text-sm tracking-wide shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-4"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' ? 'Sign In' : 'Create Account'} <FiArrowRight />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Footer Trust Badges */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-gray-500">
                <FiCheckCircle className="text-emerald-500" /> 100% Encrypted & Safe Login
              </div>
              <p className="text-[10px] text-gray-400">
                By continuing, you agree to StyleVerse Privacy Policy and Terms of Service.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default AuthDrawer;
