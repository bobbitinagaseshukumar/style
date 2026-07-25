import React, { useState, useRef, useCallback, Suspense, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight,
  FiCheck, FiAlertCircle, FiSmartphone
} from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import api from '../../config/api';
import { setCredentials } from '../../redux/auth/authSlice';
import { toast } from 'react-toastify';

const LoginScene = React.lazy(() => import('./LoginScene'));

/* ─── Floating Label Input ───────────────────────────────────── */
const FloatingInput = ({ id, type, value, onChange, label, icon: Icon, rightIcon, disabled }) => {
  const [focused, setFocused] = useState(false);
  const isActive = focused || value;
  return (
    <div className="relative">
      <div className={`
        relative flex items-center rounded-xl border transition-all duration-300
        ${focused
          ? 'border-yellow-400 shadow-[0_0_15px_rgba(212,175,55,0.3)] bg-white/10'
          : 'border-white/20 bg-white/5 hover:border-white/40'}
      `}>
        <Icon className={`absolute left-4 text-sm transition-colors duration-300 ${focused ? 'text-yellow-400' : 'text-white/40'}`} />
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          placeholder=" "
          className="w-full pl-11 pr-11 pt-5 pb-2 bg-transparent text-white text-sm outline-none placeholder-transparent disabled:opacity-50"
          aria-label={label}
        />
        <label
          htmlFor={id}
          className={`
            absolute left-11 pointer-events-none transition-all duration-200 font-medium
            ${isActive ? 'top-1.5 text-[10px] text-yellow-400' : 'top-1/2 -translate-y-1/2 text-sm text-white/50'}
          `}
        >
          {label}
        </label>
        {rightIcon && (
          <div className="absolute right-3">{rightIcon}</div>
        )}
      </div>
    </div>
  );
};

/* ─── Luxury Button ──────────────────────────────────────────── */
const LuxuryButton = ({ loading, success, children, ...props }) => {
  return (
    <motion.button
      whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }}
      whileTap={{ scale: 0.97 }}
      {...props}
      className={`
        relative w-full py-4 rounded-xl font-bold text-sm overflow-hidden
        flex items-center justify-center gap-2
        transition-all duration-300 disabled:cursor-not-allowed
        ${success
          ? 'bg-emerald-500 text-white'
          : 'bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-600 text-black'}
        shadow-[0_4px_24px_rgba(212,175,55,0.4)]
        hover:shadow-[0_8px_32px_rgba(212,175,55,0.6)]
      `}
    >
      {/* Light sweep */}
      {!loading && !success && (
        <motion.div
          className="absolute inset-0 bg-white/20 skew-x-12"
          initial={{ x: '-150%' }}
          whileHover={{ x: '200%' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      )}
      {loading ? (
        <>
          <motion.div
            className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
          />
          <span>Authenticating...</span>
        </>
      ) : success ? (
        <>
          <FiCheck className="text-white" />
          <span className="text-white">Welcome Back!</span>
        </>
      ) : children}
    </motion.button>
  );
};

/* ─── Aurora Background ──────────────────────────────────────── */
const AuroraBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
      style={{ background: 'radial-gradient(circle, #D4AF37, transparent)', top: '-20%', left: '-10%' }}
      animate={{ x: [0, 80, 0], y: [0, 40, 0] }}
      transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
      style={{ background: 'radial-gradient(circle, #C8A951, transparent)', bottom: '-20%', right: '-10%' }}
      animate={{ x: [0, -60, 0], y: [0, -50, 0] }}
      transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
    />
    <motion.div
      className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-3xl"
      style={{ background: 'radial-gradient(circle, #8B6914, transparent)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
    />
  </div>
);

/* ─── Main Login Page ────────────────────────────────────────── */
const Login = () => {
  const [loginMode, setLoginMode] = useState('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseMove = useCallback((e) => {
    mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email address'); return; }
    try {
      setLoading(true);
      if (loginMode === 'otp') {
        const { data } = await api.post('/auth/login', { email, loginType: 'OTP' });
        toast.info(data.message || 'OTP sent to your email!');
        navigate('/verify-otp', { state: { email, userId: data.data?.userId } });
      } else {
        if (!password) { setError('Please enter your password'); setLoading(false); return; }
        const { data } = await api.post('/auth/login', { email, password });
        dispatch(setCredentials(data.data));
        setSuccess(true);
        toast.success(`Welcome back, ${data.data?.user?.fullName || 'Customer'}!`);
        setTimeout(() => navigate('/'), 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Card shake on error
  const cardVariants = {
    idle: { x: 0 },
    shake: { x: [0, -8, 8, -6, 6, 0], transition: { duration: 0.5 } },
  };

  return (
    <div
      className="min-h-screen w-full flex overflow-hidden bg-[#0A0A0A] relative"
      onMouseMove={handleMouseMove}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Aurora Background */}
      <AuroraBackground />

      {/* LEFT PANEL — 3D Scene */}
      {!isMobile && (
        <div className="hidden md:flex flex-col w-[60%] relative overflow-hidden">
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/20 via-transparent to-[#0A0A0A]/60 z-10 pointer-events-none" />

          {/* Three.js Canvas */}
          <div className="absolute inset-0">
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center">
                <motion.div
                  className="w-16 h-16 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                />
              </div>
            }>
              <LoginScene mouse={mouse} />
            </Suspense>
          </div>

          {/* Left Panel Text */}
          <div className="absolute bottom-16 left-16 z-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <h1 className="text-5xl font-bold text-white mb-3 leading-tight">
                Welcome to<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                  StyleVerse
                </span>
              </h1>
              <p className="text-white/60 text-lg font-light">
                Luxury Fashion & Fine Jewellery
              </p>
            </motion.div>
          </div>

          {/* Corner decoration */}
          <div className="absolute top-8 left-8 z-20">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-[2px] bg-yellow-400" />
              <span className="text-yellow-400/80 text-xs font-semibold tracking-widest uppercase">Premium Collection</span>
            </motion.div>
          </div>
        </div>
      )}

      {/* RIGHT PANEL — Login Card */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-20">
        <motion.div
          variants={cardVariants}
          animate={error ? 'shake' : 'idle'}
          key={error}
          className="w-full max-w-md"
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.6)]"
          >
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-8"
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500">
                  StyleVerse
                </span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-white/40 text-xs tracking-widest uppercase mt-1">Luxury Fashion & Jewellery</p>
              </motion.div>
            </motion.div>

            {/* Welcome Text */}
            <div className="mb-8">
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-white mb-1"
              >
                Welcome Back
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="text-white/50 text-sm"
              >
                Sign in to continue shopping.
              </motion.p>
            </div>

            {/* Login Mode Toggle */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="flex bg-white/5 p-1 rounded-xl mb-6 border border-white/10"
            >
              {['password', 'otp'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setLoginMode(mode)}
                  className={`
                    flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all duration-300
                    ${loginMode === mode
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-lg'
                      : 'text-white/50 hover:text-white/80'}
                  `}
                >
                  {mode === 'password' ? '🔐 Password' : '📱 Email OTP'}
                </button>
              ))}
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <FloatingInput
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  label="Email Address"
                  icon={FiMail}
                  disabled={loading || success}
                />
              </motion.div>

              <AnimatePresence mode="wait">
                {loginMode === 'password' && (
                  <motion.div
                    key="password-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FloatingInput
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      label="Password"
                      icon={FiLock}
                      disabled={loading || success}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-white/40 hover:text-yellow-400 transition-colors p-1"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          <motion.div
                            key={showPassword ? 'eye-off' : 'eye'}
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                          </motion.div>
                        </button>
                      }
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Remember + Forgot */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex items-center justify-between"
              >
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`
                      w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0
                      ${rememberMe
                        ? 'bg-yellow-400 border-yellow-400'
                        : 'border-white/30 group-hover:border-yellow-400/50'}
                    `}
                  >
                    <AnimatePresence>
                      {rememberMe && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <FiCheck size={10} className="text-black font-bold" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <span className="text-white/50 text-xs select-none">Remember me</span>
                </label>

                {loginMode === 'password' && (
                  <Link to="/forgot-password" className="group flex items-center gap-1 text-xs text-yellow-400/70 hover:text-yellow-400 transition-colors">
                    Forgot Password?
                    <motion.span
                      initial={{ x: 0 }}
                      whileHover={{ x: 3 }}
                      className="inline-block"
                    >
                      <FiArrowRight size={11} />
                    </motion.span>
                  </Link>
                )}
              </motion.div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3"
                  >
                    <FiAlertCircle className="text-red-400 flex-shrink-0" size={14} />
                    <p className="text-red-400 text-xs">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <LuxuryButton
                  type="submit"
                  disabled={loading || success}
                  loading={loading}
                  success={success}
                >
                  {loginMode === 'otp' ? (
                    <>
                      <FiSmartphone /> Send Verification OTP
                    </>
                  ) : (
                    <>
                      Sign In <FiArrowRight />
                    </>
                  )}
                </LuxuryButton>
              </motion.div>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6 gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/30 text-xs font-medium">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Social Buttons (Future Ready) */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Google', icon: '🇬', color: '#4285F4' },
                { label: 'Apple', icon: '🍎', color: '#ffffff' },
              ].map((s) => (
                <motion.button
                  key={s.label}
                  whileHover={{ y: -2, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  whileTap={{ scale: 0.97 }}
                  disabled
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-white/40 text-xs font-medium bg-white/3 cursor-not-allowed opacity-50 transition-colors"
                >
                  <span>{s.icon}</span> Continue with {s.label}
                </motion.button>
              ))}
            </div>

            {/* Register Link */}
            <p className="text-center mt-8 text-xs text-white/40">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-yellow-400 font-bold hover:text-yellow-300 transition-colors underline underline-offset-4">
                Create Account
              </Link>
            </p>

            {/* Footer Links */}
            <div className="flex items-center justify-center gap-4 mt-6">
              {['Privacy Policy', 'Terms', 'Help'].map((item, i) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase().replace(' ', '-')}`}
                  className="text-[10px] text-white/25 hover:text-white/50 transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
