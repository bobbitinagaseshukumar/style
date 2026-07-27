import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiCheck,
  FiAlertCircle, FiArrowRight, FiShield
} from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import api from '../../config/api';
import { setCredentials } from '../../redux/auth/authSlice';
import { toast } from 'react-toastify';
import SocialAuthButtons from '../../components/auth/SocialAuthButtons';

/**
 * Modern Luxury Authentication Page (Shopify & Apple Inspired)
 * Replaces old 3D canvas with ultra-clean rounded glassmorphism cards and Google/GitHub Social Auth
 */
const Login = ({ initialMode }) => {
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');
  const [isRegister, setIsRegister] = useState(initialMode === 'register' || modeParam === 'register');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: true,
    acceptTerms: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (!form.fullName.trim()) return setError('Full name is required.');
      if (!form.email.trim()) return setError('Email address is required.');
      if (form.password.length < 6) return setError('Password must be at least 6 characters.');
      if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
      if (!form.acceptTerms) return setError('Please accept the terms and conditions.');
    } else {
      if (!form.email.trim()) return setError('Email address is required.');
      if (!form.password) return setError('Password is required.');
    }

    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister
        ? { fullName: form.fullName, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      const res = await api.post(endpoint, payload);

      if (res.data?.success && res.data.token) {
        dispatch(setCredentials({ user: res.data.user, token: res.data.token }));
        toast.success(isRegister ? 'Account created successfully! Welcome to StyleVerse.' : 'Welcome back!');
        navigate('/dashboard');
      } else {
        setError(res.data?.message || 'Authentication failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Soft Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Container Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-[#0D0D0D]/90 border border-gold-500/20 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.8)] relative z-10 my-8"
      >
        {/* Brand Logo Header */}
        <div className="text-center space-y-2 mb-6">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <span className="font-serif text-2xl font-bold tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-600">Style</span>
              <span className="text-white">Verse</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isRegister ? 'Create Your Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-gray-400">
            {isRegister
              ? 'Join luxury fashion & exclusive member offers'
              : 'Sign in to access your orders, wishlist & recommendations'}
          </p>
        </div>

        {/* Error Alert Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 flex items-center gap-2 text-xs text-red-400"
            >
              <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="fullName"
                  required={isRegister}
                  placeholder="John Doe"
                  value={form.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="email"
                name="email"
                required
                placeholder="name@example.com"
                value={form.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Password
              </label>
              {!isRegister && (
                <Link to="/forgot-password" className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition">
                  Forgot Password?
                </Link>
              )}
            </div>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
              >
                {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  required={isRegister}
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                >
                  {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Checkboxes */}
          {!isRegister ? (
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={form.rememberMe}
                  onChange={handleChange}
                  className="w-3.5 h-3.5 accent-amber-500 rounded"
                />
                <span className="text-xs text-gray-400">Remember Me</span>
              </label>
            </div>
          ) : (
            <label className="flex items-start gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={form.acceptTerms}
                onChange={handleChange}
                className="w-3.5 h-3.5 accent-amber-500 rounded mt-0.5"
              />
              <span className="text-xs text-gray-400">
                I accept the{' '}
                <Link to="/terms" className="text-amber-400 hover:underline">
                  Terms & Conditions
                </Link>{' '}
                and Privacy Policy.
              </span>
            </label>
          )}

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black font-bold text-xs uppercase tracking-wider hover:from-amber-400 transition shadow-[0_4px_24px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                <FiArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Social Authentication (Google & GitHub) */}
        <SocialAuthButtons mode={isRegister ? 'register' : 'login'} />

        {/* Toggle Mode Link */}
        <div className="text-center pt-4 border-t border-white/10 mt-4">
          <p className="text-xs text-gray-400">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-amber-400 font-bold hover:underline cursor-pointer"
            >
              {isRegister ? 'Sign In Here' : 'Create One Now'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
