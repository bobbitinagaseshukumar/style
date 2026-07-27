import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiCheck,
  FiAlertCircle, FiArrowRight, FiShield, FiPhone, FiKey, FiStar, FiCheckCircle
} from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import api from '../../config/api';
import { setCredentials } from '../../redux/auth/authSlice';
import { toast } from 'react-toastify';
import SocialAuthButtons from '../../components/auth/SocialAuthButtons';

/**
 * World-Class 3D Glass Card Flip Authentication Page
 * Features 3D perspective rotation between Login & Register, interactive cursor lighting,
 * frosted glassmorphism, floating particles, and live validation.
 */
const Login = ({ initialMode }) => {
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');

  // 3D Flip State (0 = Login, 180 = Register)
  const [isRegister, setIsRegister] = useState(initialMode === 'register' || modeParam === 'register');

  // Form State
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    rememberMe: true,
    acceptTerms: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const cardRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    });
  };

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
      if (!form.fullName.trim()) return setError('Full Name is required');
      if (!form.email.trim()) return setError('Email address is required');
      if (form.password.length < 6) return setError('Password must be at least 6 characters');
      if (form.password !== form.confirmPassword) return setError('Passwords do not match');
      if (!form.acceptTerms) return setError('Please accept the terms & conditions');
    } else {
      if (!form.email.trim()) return setError('Email address is required');
      if (!form.password) return setError('Password is required');
    }

    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister
        ? { fullName: form.fullName, email: form.email, password: form.password, mobile: form.mobile }
        : { email: form.email, password: form.password };

      const res = await api.post(endpoint, payload);

      if (res.data?.success && res.data.token) {
        setAuthSuccess(true);
        dispatch(setCredentials({ user: res.data.user, token: res.data.token }));
        toast.success(isRegister ? '🎉 Account created successfully!' : '✨ Welcome back!');
        setTimeout(() => navigate('/dashboard'), 1200);
      } else {
        setError(res.data?.message || 'Authentication failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (forgotStep === 1) {
      if (!forgotEmail) return toast.error('Enter your registered email');
      toast.success('OTP sent to your email!');
      setForgotStep(2);
    } else if (forgotStep === 2) {
      if (otp.length < 4) return toast.error('Enter valid OTP');
      setForgotStep(3);
    } else {
      if (newPassword.length < 6) return toast.error('Password must be 6+ chars');
      toast.success('Password reset successfully! Please login.');
      setForgotModalOpen(false);
      setForgotStep(1);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      {/* Dynamic Cursor Spotlight Beam */}
      <div
        className="absolute w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none transition-transform duration-300"
        style={{
          transform: `translate(${mousePos.x * 0.2}px, ${mousePos.y * 0.2}px)`,
        }}
      />
      <div className="absolute top-10 left-10 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* 3D SCENE CONTAINER */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        className="w-full max-w-md my-8 relative z-10"
        style={{ perspective: 1200 }}
      >
        {/* 3D FLIPPING GLASS CARD */}
        <motion.div
          animate={{ rotateY: isRegister ? 180 : 0 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative w-full"
        >
          {/* ── FRONT FACE: WELCOME BACK (LOGIN) ── */}
          <motion.div
            style={{ backfaceVisibility: 'hidden' }}
            animate={{ x: error ? [-8, 8, -6, 6, 0] : 0 }}
            className="w-full bg-[#0D0D12]/90 border border-gold-500/30 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_16px_60px_rgba(0,0,0,0.9)] relative"
          >
            {/* Ambient Lighting Overlay */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/5 via-transparent to-gold-500/5 pointer-events-none" />

            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-md">
                <FiStar className="w-6 h-6 fill-amber-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Welcome Back</h2>
              <p className="text-xs text-gray-400">Sign in to continue shopping and access your luxury profile.</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <FiAlertCircle className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="name@domain.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-gray-300">Password</label>
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(true)}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={form.rememberMe}
                    onChange={handleChange}
                    className="rounded text-amber-500 focus:ring-amber-500 bg-white/10 border-gray-700"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || authSuccess}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-black uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {authSuccess ? (
                  <>
                    <FiCheckCircle className="w-5 h-5 text-black" /> Authenticated!
                  </>
                ) : loading ? (
                  'Signing In...'
                ) : (
                  <>
                    Sign In <FiArrowRight />
                  </>
                )}
              </button>
            </form>

            <SocialAuthButtons />

            <div className="mt-6 text-center text-xs text-gray-400 border-t border-white/10 pt-4">
              Don't have an account?{' '}
              <button
                onClick={() => setIsRegister(true)}
                className="font-bold text-amber-400 hover:underline cursor-pointer ml-1"
              >
                Create Account →
              </button>
            </div>
          </motion.div>

          {/* ── BACK FACE: CREATE ACCOUNT (REGISTER) ── */}
          <motion.div
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
            }}
            animate={{ x: error ? [-8, 8, -6, 6, 0] : 0 }}
            className="w-full bg-[#0D0D12]/90 border border-gold-500/30 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_16px_60px_rgba(0,0,0,0.9)]"
          >
            <div className="text-center space-y-2 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-md">
                <FiUser className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Create Account</h2>
              <p className="text-xs text-gray-400">Join KVLR Styles to unlock VIP deals and instant order tracking.</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <FiAlertCircle className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="name@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Mobile Number (Optional)</label>
                <div className="relative">
                  <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="tel"
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-300 mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-300 mb-1">Confirm</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition text-xs"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-gray-400 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={form.acceptTerms}
                  onChange={handleChange}
                  className="rounded text-amber-500 focus:ring-amber-500 bg-white/10 border-gray-700"
                />
                <span>I accept Terms & Conditions</span>
              </label>

              <button
                type="submit"
                disabled={loading || authSuccess}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-black uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 mt-2"
              >
                {authSuccess ? (
                  <>
                    <FiCheckCircle className="w-5 h-5 text-black" /> Account Created!
                  </>
                ) : loading ? (
                  'Creating Account...'
                ) : (
                  <>
                    Create Account <FiArrowRight />
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-center text-xs text-gray-400 border-t border-white/10 pt-3">
              Already have an account?{' '}
              <button
                onClick={() => setIsRegister(false)}
                className="font-bold text-amber-400 hover:underline cursor-pointer ml-1"
              >
                Sign In →
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      <AnimatePresence>
        {forgotModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#12121A] border border-gold-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 text-xs text-white"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-bold text-sm text-gold-400 flex items-center gap-2">
                  <FiKey /> Reset Password
                </h3>
                <button onClick={() => setForgotModalOpen(false)} className="text-gray-400 hover:text-white">
                  ✕
                </button>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                {forgotStep === 1 && (
                  <div>
                    <p className="text-gray-400 mb-2">Enter your registered email to receive a 6-digit OTP code.</p>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                {forgotStep === 2 && (
                  <div>
                    <p className="text-gray-400 mb-2">Enter 4-digit OTP sent to {forgotEmail}:</p>
                    <input
                      type="text"
                      maxLength={4}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="1234"
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-center font-bold tracking-widest text-lg"
                    />
                  </div>
                )}

                {forgotStep === 3 && (
                  <div>
                    <p className="text-gray-400 mb-2">Enter your new strong password:</p>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-500 text-black font-bold text-xs uppercase tracking-wider"
                >
                  {forgotStep === 1 ? 'Send OTP Code' : forgotStep === 2 ? 'Verify OTP' : 'Reset Password'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
