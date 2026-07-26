import React, { useState, useRef, useCallback, Suspense, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight,
  FiCheck, FiAlertCircle, FiSmartphone, FiUser, FiPhone, FiGift
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import api from '../../config/api';
import { setCredentials } from '../../redux/auth/authSlice';
import { toast } from 'react-toastify';

const LoginScene = React.lazy(() => import('./LoginScene'));

/* ═══════════════════════════════════════════════════════════════
   FLOATING LABEL INPUT
   ═══════════════════════════════════════════════════════════════ */
const FloatingInput = ({ id, name, type, value, onChange, label, icon: Icon, rightIcon, disabled }) => {
  const [focused, setFocused] = useState(false);
  const isActive = focused || (value && value.length > 0);
  return (
    <div className="relative group">
      <div className={`
        relative flex items-center rounded-xl border transition-all duration-300
        ${focused
          ? 'border-yellow-400/70 shadow-[0_0_20px_rgba(212,175,55,0.15)] bg-white/[0.08]'
          : 'border-white/[0.12] bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.06]'}
      `}>
        <Icon size={14} className={`absolute left-3.5 transition-colors duration-300 z-10 ${focused ? 'text-yellow-400' : 'text-white/40'}`} />
        <input
          id={id}
          name={name || id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          placeholder=" "
          autoComplete="off"
          className="w-full pl-10 pr-10 pt-4 pb-1.5 bg-transparent text-white text-[13px] outline-none placeholder-transparent disabled:opacity-50 transition-colors"
          aria-label={label}
        />
        <label
          htmlFor={id}
          className={`
            absolute left-10 pointer-events-none transition-all duration-200 font-medium
            ${isActive ? 'top-0.5 text-[9px] text-yellow-400/90' : 'top-1/2 -translate-y-1/2 text-[12px] text-white/45'}
          `}
        >
          {label}
        </label>
        {rightIcon && <div className="absolute right-3 z-10">{rightIcon}</div>}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   LUXURY CTA BUTTON
   ═══════════════════════════════════════════════════════════════ */
const LuxuryButton = ({ loading, success, children, ...props }) => (
  <motion.button
    whileHover={{ scale: loading ? 1 : 1.015, y: loading ? 0 : -1 }}
    whileTap={{ scale: 0.98 }}
    {...props}
    className={`
      relative w-full py-3 rounded-xl font-bold text-[13px] overflow-hidden
      flex items-center justify-center gap-2 transition-all duration-300
      disabled:cursor-not-allowed
      ${success
        ? 'bg-emerald-500 text-white shadow-[0_4px_24px_rgba(16,185,129,0.4)]'
        : 'bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-600 text-black shadow-[0_4px_28px_rgba(212,175,55,0.35)] hover:shadow-[0_8px_36px_rgba(212,175,55,0.55)]'}
    `}
  >
    {!loading && !success && (
      <motion.div
        className="absolute inset-0 bg-white/20 skew-x-12"
        initial={{ x: '-150%' }}
        whileHover={{ x: '200%' }}
        transition={{ duration: 0.55, ease: 'easeInOut' }}
      />
    )}
    {loading ? (
      <>
        <motion.div
          className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
        />
        <span>Processing...</span>
      </>
    ) : success ? (
      <><FiCheck className="text-white" /><span className="text-white">Success!</span></>
    ) : children}
  </motion.button>
);

/* ═══════════════════════════════════════════════════════════════
   AURORA BACKGROUND EFFECT
   ═══════════════════════════════════════════════════════════════ */
const AuroraBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <motion.div
      className="absolute w-[700px] h-[700px] rounded-full opacity-[0.18] blur-[100px]"
      style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)', top: '-25%', left: '-15%' }}
      animate={{ x: [0, 60, 0], y: [0, 30, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute w-[500px] h-[500px] rounded-full opacity-[0.12] blur-[80px]"
      style={{ background: 'radial-gradient(circle, #C8A951 0%, transparent 70%)', bottom: '-20%', right: '-12%' }}
      animate={{ x: [0, -40, 0], y: [0, -35, 0] }}
      transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
    />
    <motion.div
      className="absolute w-[300px] h-[300px] rounded-full opacity-[0.08] blur-[60px]"
      style={{ background: 'radial-gradient(circle, #FFD700 0%, transparent 70%)', top: '40%', right: '30%' }}
      animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
      transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
    />
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════ */
const formVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.97,
    filter: 'blur(6px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -15,
    scale: 0.97,
    filter: 'blur(6px)',
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ═══════════════════════════════════════════════════════════════
   MAIN AUTH PAGE COMPONENT
   Single page. No navigation. No route change.
   ═══════════════════════════════════════════════════════════════ */
const AuthPage = ({ initialMode = 'login' }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ── Auth Mode: 'login' or 'register' ──
  const [mode, setMode] = useState(initialMode);

  // ── LOGIN STATE ──
  const [loginMode, setLoginMode] = useState('password');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginError, setLoginError] = useState('');

  // ── REGISTER STATE ──
  const [regData, setRegData] = useState({
    fullName: '',
    email: '',
    phone: '',
    whatsapp: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
    terms: true,
  });
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [regError, setRegError] = useState('');

  // ── 3D Scene & Responsive ──
  const [isMobile, setIsMobile] = useState(false);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleMouseMove = useCallback((e) => {
    mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
  }, []);

  // ── Password Strength ──
  const pw = regData.password;
  const strength = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[@$!%*?&]/.test(pw),
  };
  const allStrong = Object.values(strength).every(Boolean);

  // ── Switch Mode (NO NAVIGATION) ──
  const switchToRegister = () => { setLoginError(''); setMode('register'); };
  const switchToLogin = () => { setRegError(''); setMode('login'); };

  // ── LOGIN HANDLER ──
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail) { setLoginError('Please enter your email address'); return; }

    try {
      setLoginLoading(true);
      if (loginMode === 'otp') {
        const { data } = await api.post('/auth/login', { email: loginEmail, loginType: 'OTP' });
        toast.info(data.message || 'OTP sent to your email!');
        navigate('/verify-otp', { state: { email: loginEmail, userId: data.data?.userId } });
      } else {
        if (!loginPassword) { setLoginError('Please enter your password'); setLoginLoading(false); return; }
        const { data } = await api.post('/auth/login', { email: loginEmail, password: loginPassword });
        dispatch(setCredentials(data.data));
        setLoginSuccess(true);
        const user = data.data?.user;
        const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
        toast.success(isAdmin
          ? `Welcome, Admin ${user?.fullName || ''}! Redirecting to dashboard...`
          : `Welcome back, ${user?.fullName || 'Customer'}!`);
        setTimeout(() => navigate(isAdmin ? '/admin/dashboard' : '/'), 1200);
      }
    } catch (err) {
      console.error('Login submit error:', err);
      setLoginError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  // ── REGISTER HANDLER ──
  const handleRegChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRegData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    if (!regData.fullName) { setRegError('Full Name is required'); return; }
    if (!regData.email) { setRegError('Email is required'); return; }
    if (!regData.phone) { setRegError('Phone number is required'); return; }
    if (!regData.whatsapp) { setRegError('WhatsApp number is mandatory'); return; }
    if (!regData.password) { setRegError('Password is required'); return; }
    if (!allStrong) { setRegError('Password does not meet security requirements'); return; }
    if (regData.password !== regData.confirmPassword) { setRegError('Passwords do not match'); return; }
    if (!regData.terms) { setRegError('Please accept the Terms & Conditions'); return; }

    try {
      setRegLoading(true);
      const { data } = await api.post('/auth/register', regData);
      setRegSuccess(true);
      toast.success(data.message || 'Registration successful!');
      setTimeout(() => {
        navigate('/verify-otp', { state: { email: regData.email, userId: data.data?.userId } });
      }, 1200);
    } catch (err) {
      setRegError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setRegLoading(false);
    }
  };

  /* ═════════════════════════════════════════════════════════════
     RENDER
     ═════════════════════════════════════════════════════════════ */
  return (
    <div
      className="min-h-screen w-full flex overflow-x-hidden bg-[#060606] relative"
      onMouseMove={handleMouseMove}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Fixed Background Layer */}
      <AuroraBackground />

      {/* ─── LEFT: 3D Scene (Desktop) ─────────────────────────── */}
      {!isMobile && (
        <div className="hidden md:flex flex-col w-[50%] lg:w-[55%] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#060606]/10 via-transparent to-[#060606]/80 z-10 pointer-events-none" />

          <div className="absolute inset-0">
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center">
                <motion.div
                  className="w-12 h-12 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                />
              </div>
            }>
              <LoginScene mouse={mouse} />
            </Suspense>
          </div>

          {/* Bottom Branding */}
          <div className="absolute bottom-14 left-14 z-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <AnimatePresence mode="wait">
                <motion.div key={mode} {...formVariants}>
                  <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
                    {mode === 'register' ? 'Join the World of' : 'Welcome to'}<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-600">
                      StyleVerse
                    </span>
                  </h1>
                  <p className="text-white/55 text-base font-light max-w-sm">
                    {mode === 'register'
                      ? 'Unlock exclusive luxury perks & curated collections'
                      : 'Luxury Fashion & Fine Jewellery'}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Top Corner Badge */}
          <div className="absolute top-8 left-8 z-20">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-[2px] bg-yellow-400" />
              <span className="text-yellow-400/75 text-[10px] font-semibold tracking-[0.2em] uppercase">
                {mode === 'register' ? 'Exclusive Membership' : 'Premium Collection'}
              </span>
            </motion.div>
          </div>
        </div>
      )}

      {/* ─── RIGHT: Auth Card ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative z-20 min-h-screen">
        <div className="w-full max-w-[420px]">

          {/* Glass Card */}
          <motion.div
            layout
            transition={{ layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
            className="w-full bg-[#0D0D0D]/95 backdrop-blur-2xl border border-white/[0.08] rounded-[24px] shadow-[0_32px_100px_rgba(0,0,0,0.9),0_0_1px_rgba(255,255,255,0.05)_inset] overflow-hidden"
          >
            {/* Card Inner */}
            <div className="p-6 sm:p-7">

              {/* Logo */}
              <div className="text-center mb-5">
                <motion.span
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-[26px] sm:text-[30px] font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 inline-block"
                >
                  StyleVerse
                </motion.span>
                <p className="text-white/35 text-[9px] tracking-[0.25em] uppercase mt-0.5">
                  Luxury Fashion & Jewellery
                </p>
              </div>

              {/* ═══ Animated Form Container ═══ */}
              <AnimatePresence mode="wait">
                {mode === 'login' ? (
                  /* ────────────────────────────────────────────
                     LOGIN FORM
                     ──────────────────────────────────────────── */
                  <motion.div key="login-form" {...formVariants}>
                    <div className="mb-5">
                      <h2 className="text-[22px] font-bold text-white mb-0.5">Welcome Back</h2>
                      <p className="text-white/45 text-[12px]">Sign in to continue shopping.</p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex bg-white/[0.04] p-1 rounded-xl mb-4 border border-white/[0.06]">
                      {['password', 'otp'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setLoginMode(m)}
                          className={`flex-1 py-[7px] text-[11px] font-semibold rounded-lg transition-all duration-300
                            ${loginMode === m
                              ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-md'
                              : 'text-white/45 hover:text-white/70'}`}
                        >
                          {m === 'password' ? '🔐 Password' : '📱 Email OTP'}
                        </button>
                      ))}
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                      <FloatingInput
                        id="login-email" type="email" value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        label="Email Address *" icon={FiMail}
                        disabled={loginLoading || loginSuccess}
                      />

                      {loginMode === 'password' && (
                        <FloatingInput
                          id="login-password"
                          type={showLoginPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          label="Password *" icon={FiLock}
                          disabled={loginLoading || loginSuccess}
                          rightIcon={
                            <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)}
                              className="text-white/35 hover:text-yellow-400 transition-colors p-1">
                              {showLoginPassword ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                            </button>
                          }
                        />
                      )}

                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="rounded border-white/20 text-yellow-400 focus:ring-yellow-400 w-3.5 h-3.5" />
                          <span className="text-white/45 text-[11px] select-none">Remember me</span>
                        </label>
                        {loginMode === 'password' && (
                          <Link to="/forgot-password" className="text-[11px] text-yellow-400/70 hover:text-yellow-400 transition-colors">
                            Forgot Password?
                          </Link>
                        )}
                      </div>

                      {/* Quick 1-Click Demo Login Presets */}
                      <div className="pt-1 pb-1">
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider text-center mb-1.5">Quick Demo Login</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setLoginEmail('customer@styleverse.com');
                              setLoginPassword('Password123!');
                              setLoginError(null);
                            }}
                            className="py-1.5 px-2 rounded-xl bg-white/[0.05] border border-white/10 hover:border-yellow-400/50 text-white/80 hover:text-yellow-400 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            👑 Demo Customer
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLoginEmail('admin@styleverse.com');
                              setLoginPassword('Password123!');
                              setLoginError(null);
                            }}
                            className="py-1.5 px-2 rounded-xl bg-white/[0.05] border border-white/10 hover:border-yellow-400/50 text-white/80 hover:text-yellow-400 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            🛡️ Demo Admin
                          </button>
                        </div>
                      </div>

                      {loginError && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-2 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-3.5 py-2.5"
                        >
                          <FiAlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={13} />
                          <p className="text-red-400 text-[11px] leading-relaxed">{loginError}</p>
                        </motion.div>
                      )}

                      <LuxuryButton type="submit" disabled={loginLoading || loginSuccess}
                        loading={loginLoading} success={loginSuccess}>
                        {loginMode === 'otp'
                          ? <><FiSmartphone size={14} /> Send Verification OTP</>
                          : <>Sign In <FiArrowRight size={14} /></>}
                      </LuxuryButton>
                    </form>

                    {/* Switch to Register */}
                    <p className="text-center mt-5 text-[12px] text-white/35">
                      Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        onClick={switchToRegister}
                        className="text-yellow-400 font-semibold hover:text-yellow-300 transition-colors cursor-pointer"
                      >
                        Create Account
                      </button>
                    </p>
                  </motion.div>
                ) : (
                  /* ────────────────────────────────────────────
                     REGISTER FORM
                     ──────────────────────────────────────────── */
                  <motion.div key="register-form" {...formVariants}>
                    <div className="mb-4">
                      <h2 className="text-[20px] font-bold text-white mb-0.5">Create Your Account</h2>
                      <p className="text-white/45 text-[12px]">Join StyleVerse and enjoy premium shopping.</p>
                    </div>

                    <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
                      <FloatingInput
                        id="reg-fullName" name="fullName" type="text"
                        value={regData.fullName} onChange={handleRegChange}
                        label="Full Name *" icon={FiUser}
                        disabled={regLoading || regSuccess}
                      />

                      <FloatingInput
                        id="reg-email" name="email" type="email"
                        value={regData.email} onChange={handleRegChange}
                        label="Email Address *" icon={FiMail}
                        disabled={regLoading || regSuccess}
                      />

                      <FloatingInput
                        id="reg-phone" name="phone" type="tel"
                        value={regData.phone} onChange={handleRegChange}
                        label="Mobile Number *" icon={FiPhone}
                        disabled={regLoading || regSuccess}
                      />

                      <FloatingInput
                        id="reg-whatsapp" name="whatsapp" type="tel"
                        value={regData.whatsapp} onChange={handleRegChange}
                        label="WhatsApp Number *" icon={FaWhatsapp}
                        disabled={regLoading || regSuccess}
                      />

                      <div>
                        <FloatingInput
                          id="reg-password" name="password"
                          type={showRegPassword ? 'text' : 'password'}
                          value={regData.password} onChange={handleRegChange}
                          label="Password *" icon={FiLock}
                          disabled={regLoading || regSuccess}
                          rightIcon={
                            <button type="button" onClick={() => setShowRegPassword(!showRegPassword)}
                              className="text-white/35 hover:text-yellow-400 transition-colors p-1">
                              {showRegPassword ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                            </button>
                          }
                        />
                        {pw.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] px-1"
                          >
                            {[
                              [strength.length, 'Min 8 characters'],
                              [strength.upper, 'Uppercase letter'],
                              [strength.lower, 'Lowercase letter'],
                              [strength.number, 'Number (0-9)'],
                              [strength.special, 'Special (@$!%*?&)'],
                            ].map(([ok, label]) => (
                              <span key={label} className={`transition-colors duration-200 ${ok ? 'text-emerald-400 font-semibold' : 'text-white/30'}`}>
                                {ok ? '✓' : '○'} {label}
                              </span>
                            ))}
                          </motion.div>
                        )}
                      </div>

                      <FloatingInput
                        id="reg-confirmPassword" name="confirmPassword" type="password"
                        value={regData.confirmPassword} onChange={handleRegChange}
                        label="Confirm Password *" icon={FiLock}
                        disabled={regLoading || regSuccess}
                      />

                      <FloatingInput
                        id="reg-referralCode" name="referralCode" type="text"
                        value={regData.referralCode} onChange={handleRegChange}
                        label="Referral Code (Optional)" icon={FiGift}
                        disabled={regLoading || regSuccess}
                      />

                      <label className="flex items-start gap-2.5 text-[11px] text-white/45 cursor-pointer pt-1">
                        <input type="checkbox" name="terms" checked={regData.terms} onChange={handleRegChange}
                          className="mt-[3px] rounded border-white/20 text-yellow-400 focus:ring-yellow-400 shrink-0 w-3.5 h-3.5" />
                        <span className="leading-relaxed">
                          I agree to the{' '}
                          <Link to="/terms" className="text-yellow-400/90 font-medium hover:text-yellow-300 hover:underline transition-colors">Terms & Conditions</Link>
                          {' '}and{' '}
                          <Link to="/privacy-policy" className="text-yellow-400/90 font-medium hover:text-yellow-300 hover:underline transition-colors">Privacy Policy</Link>
                        </span>
                      </label>

                      {regError && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-2 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-3.5 py-2.5"
                        >
                          <FiAlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={12} />
                          <p className="text-red-400 text-[11px] leading-relaxed">{regError}</p>
                        </motion.div>
                      )}

                      <LuxuryButton type="submit" disabled={regLoading || regSuccess}
                        loading={regLoading} success={regSuccess}>
                        Create Account <FiArrowRight size={14} />
                      </LuxuryButton>
                    </form>

                    {/* Switch to Login */}
                    <p className="text-center mt-4 text-[12px] text-white/35">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={switchToLogin}
                        className="text-yellow-400 font-semibold hover:text-yellow-300 transition-colors cursor-pointer"
                      >
                        Sign In
                      </button>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;
