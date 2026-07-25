import React, { useState, useRef, useCallback, Suspense, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight,
  FiCheck, FiAlertCircle, FiSmartphone, FiUser, FiPhone
} from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import api from '../../config/api';
import { setCredentials } from '../../redux/auth/authSlice';
import { toast } from 'react-toastify';

const LoginScene = React.lazy(() => import('./LoginScene'));

/* ─── Floating Label Input ───────────────────────────────────── */
const FloatingInput = ({ id, name, type, value, onChange, label, icon: Icon, rightIcon, disabled }) => {
  const [focused, setFocused] = useState(false);
  const isActive = focused || value;
  return (
    <div className="relative">
      <div className={`
        relative flex items-center rounded-xl border transition-all duration-300
        ${focused
          ? 'border-yellow-400 shadow-[0_0_15px_rgba(212,175,55,0.25)] bg-white/10'
          : 'border-white/15 bg-white/5 hover:border-white/30'}
      `}>
        <Icon size={14} className={`absolute left-3.5 transition-colors duration-300 ${focused ? 'text-yellow-400' : 'text-white/40'}`} />
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
          className="w-full pl-10 pr-10 pt-4 pb-1.5 bg-transparent text-white text-sm outline-none placeholder-transparent disabled:opacity-50"
          aria-label={label}
        />
        <label
          htmlFor={id}
          className={`
            absolute left-10 pointer-events-none transition-all duration-200 font-medium
            ${isActive ? 'top-1 text-[9px] text-yellow-400' : 'top-1/2 -translate-y-1/2 text-xs text-white/50'}
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
const LuxuryButton = ({ loading, success, children, ...props }) => (
  <motion.button
    whileHover={{ scale: loading ? 1 : 1.01, y: loading ? 0 : -1 }}
    whileTap={{ scale: 0.98 }}
    {...props}
    className={`
      relative w-full py-3.5 rounded-xl font-bold text-sm overflow-hidden
      flex items-center justify-center gap-2 transition-all duration-300
      disabled:cursor-not-allowed
      ${success
        ? 'bg-emerald-500 text-white'
        : 'bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-600 text-black'}
      shadow-[0_4px_24px_rgba(212,175,55,0.35)]
      hover:shadow-[0_8px_32px_rgba(212,175,55,0.55)]
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
      <>
        <FiCheck className="text-white" />
        <span className="text-white">Success!</span>
      </>
    ) : children}
  </motion.button>
);

/* ─── Aurora Background ──────────────────────────────────────── */
const AuroraBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
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
  </div>
);

/* ─── Main 3D Auth Component ─────────────────────────────────── */
const Login = ({ initialMode = 'login' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Determine starting side from route OR prop — but NEVER navigate on flip
  const startOnRegister = location.pathname === '/register' || initialMode === 'register';
  const [isRegistering, setIsRegistering] = useState(startOnRegister);

  // Only sync on initial mount, not on every re-render
  useEffect(() => {
    setIsRegistering(location.pathname === '/register' || initialMode === 'register');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // LOGIN STATE
  const [loginMode, setLoginMode] = useState('password');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginError, setLoginError] = useState('');

  // REGISTER STATE
  const [regData, setRegData] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '', terms: true
  });
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [regError, setRegError] = useState('');

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

  // Password strength checks
  const hasLength = regData.password.length >= 8;
  const hasUpper = /[A-Z]/.test(regData.password);
  const hasLower = /[a-z]/.test(regData.password);
  const hasNumber = /[0-9]/.test(regData.password);
  const hasSpecial = /[@$!%*?&]/.test(regData.password);

  // ✅ Pure state flip — NO navigate, NO URL change
  const flipToRegister = () => {
    setLoginError('');
    setIsRegistering(true);
  };
  const flipToLogin = () => {
    setRegError('');
    setIsRegistering(false);
  };

  // LOGIN SUBMIT
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
        toast.success(`Welcome back, ${data.data?.user?.fullName || 'Customer'}!`);
        setTimeout(() => navigate('/'), 1000);
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  // REGISTER SUBMIT
  const handleRegChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRegData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    if (!regData.fullName || !regData.email || !regData.password) {
      setRegError('Please fill in all required fields'); return;
    }
    if (!(hasLength && hasUpper && hasLower && hasNumber && hasSpecial)) {
      setRegError('Password does not meet security requirements'); return;
    }
    if (regData.password !== regData.confirmPassword) {
      setRegError('Passwords do not match'); return;
    }
    if (!regData.terms) {
      setRegError('Please accept the Terms & Conditions'); return;
    }
    try {
      setRegLoading(true);
      const { data } = await api.post('/auth/register', regData);
      setRegSuccess(true);
      toast.success(data.message || 'Registration successful! Verification OTP sent.');
      setTimeout(() => navigate('/verify-otp', { state: { email: regData.email, userId: data.data?.userId } }), 1000);
    } catch (err) {
      setRegError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex overflow-x-hidden bg-[#0A0A0A] relative"
      onMouseMove={handleMouseMove}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <AuroraBackground />

      {/* LEFT PANEL — 3D Scene */}
      {!isMobile && (
        <div className="hidden md:flex flex-col w-[50%] lg:w-[55%] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/20 via-transparent to-[#0A0A0A]/70 z-10 pointer-events-none" />
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

          <div className="absolute bottom-12 left-12 z-20">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }}>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 leading-tight">
                {isRegistering ? 'Join the World of' : 'Welcome to'}<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-600">
                  StyleVerse
                </span>
              </h1>
              <p className="text-white/60 text-base font-light">
                {isRegistering ? 'Unlock exclusive luxury perks & custom collections' : 'Luxury Fashion & Fine Jewellery'}
              </p>
            </motion.div>
          </div>

          <div className="absolute top-8 left-8 z-20">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex items-center gap-2">
              <div className="w-8 h-[2px] bg-yellow-400" />
              <span className="text-yellow-400/80 text-xs font-semibold tracking-widest uppercase">
                {isRegistering ? 'Exclusive Membership' : 'Premium Collection'}
              </span>
            </motion.div>
          </div>
        </div>
      )}

      {/* RIGHT PANEL — 3D Flip Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative z-20 min-h-screen">

        {/* ═══ 3D Flip Container ═══════════════════════════════════════ */}
        <div
          className="w-full max-w-md relative"
          style={{ perspective: '1400px', minHeight: isRegistering ? '600px' : '480px' }}
        >
          <motion.div
            animate={{ rotateY: isRegistering ? 180 : 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformStyle: 'preserve-3d', position: 'relative', width: '100%', height: '100%' }}
          >

            {/* ─── FRONT FACE: SIGN IN ─────────────────────────────── */}
            <div
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              className="w-full bg-[#111111] border border-white/10 rounded-3xl p-7 shadow-[0_24px_80px_rgba(0,0,0,0.9)]"
            >
              {/* Logo */}
              <div className="text-center mb-5">
                <motion.span
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 inline-block"
                >
                  StyleVerse
                </motion.span>
                <p className="text-white/40 text-[9px] tracking-widest uppercase mt-1">Luxury Fashion & Jewellery</p>
              </div>

              <div className="mb-5">
                <h2 className="text-2xl font-bold text-white mb-1">Welcome Back</h2>
                <p className="text-white/50 text-xs">Sign in to continue shopping.</p>
              </div>

              {/* Login Mode Toggle */}
              <div className="flex bg-white/5 p-1 rounded-xl mb-4 border border-white/10">
                {['password', 'otp'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setLoginMode(mode)}
                    className={`
                      flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-300
                      ${loginMode === mode
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-md'
                        : 'text-white/50 hover:text-white/80'}
                    `}
                  >
                    {mode === 'password' ? '🔐 Password' : '📱 Email OTP'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <FloatingInput
                  id="login-email" type="email" value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  label="Email Address" icon={FiMail} disabled={loginLoading || loginSuccess}
                />

                {loginMode === 'password' && (
                  <FloatingInput
                    id="login-password" type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                    label="Password" icon={FiLock} disabled={loginLoading || loginSuccess}
                    rightIcon={
                      <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="text-white/40 hover:text-yellow-400 transition-colors p-1">
                        {showLoginPassword ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                      </button>
                    }
                  />
                )}

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-white/30 text-yellow-400 focus:ring-yellow-400" />
                    <span className="text-white/50 text-xs select-none">Remember me</span>
                  </label>
                  {loginMode === 'password' && (
                    <Link to="/forgot-password" className="text-xs text-yellow-400/80 hover:text-yellow-400 transition-colors">
                      Forgot Password?
                    </Link>
                  )}
                </div>

                {loginError && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">
                    <FiAlertCircle className="text-red-400 flex-shrink-0" size={13} />
                    <p className="text-red-400 text-xs">{loginError}</p>
                  </div>
                )}

                <LuxuryButton type="submit" disabled={loginLoading || loginSuccess} loading={loginLoading} success={loginSuccess}>
                  {loginMode === 'otp' ? <><FiSmartphone /> Send Verification OTP</> : <>Sign In <FiArrowRight /></>}
                </LuxuryButton>
              </form>

              <p className="text-center mt-5 text-xs text-white/40">
                Don&apos;t have an account?{' '}
                {/* ✅ NO navigate() — pure state flip only */}
                <button
                  type="button"
                  onClick={flipToRegister}
                  className="text-yellow-400 font-bold hover:text-yellow-300 transition-colors underline underline-offset-4 cursor-pointer"
                >
                  Create Account ✦
                </button>
              </p>
            </div>

            {/* ─── BACK FACE: CREATE ACCOUNT ───────────────────────── */}
            <div
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                position: 'absolute',
                top: 0, left: 0, right: 0,
              }}
              className="w-full bg-[#111111] border border-white/10 rounded-3xl p-6 shadow-[0_24px_80px_rgba(0,0,0,0.9)]"
            >
              {/* Logo */}
              <div className="text-center mb-4">
                <span className="text-2xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500">
                  StyleVerse
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">Create Your Account</h2>
                <p className="text-white/40 text-[11px]">Join StyleVerse for luxury shopping perks</p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <FloatingInput id="reg-fullName" name="fullName" type="text"
                  value={regData.fullName} onChange={handleRegChange}
                  label="Full Name *" icon={FiUser} disabled={regLoading || regSuccess} />

                <FloatingInput id="reg-email" name="email" type="email"
                  value={regData.email} onChange={handleRegChange}
                  label="Email Address *" icon={FiMail} disabled={regLoading || regSuccess} />

                <FloatingInput id="reg-phone" name="phone" type="tel"
                  value={regData.phone} onChange={handleRegChange}
                  label="Phone Number" icon={FiPhone} disabled={regLoading || regSuccess} />

                <div>
                  <FloatingInput id="reg-password" name="password"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regData.password} onChange={handleRegChange}
                    label="Password *" icon={FiLock} disabled={regLoading || regSuccess}
                    rightIcon={
                      <button type="button" onClick={() => setShowRegPassword(!showRegPassword)}
                        className="text-white/40 hover:text-yellow-400 transition-colors p-1">
                        {showRegPassword ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                      </button>
                    }
                  />
                  {regData.password.length > 0 && (
                    <div className="mt-1 grid grid-cols-2 gap-0.5 text-[9px] text-white/35 px-1">
                      {[
                        [hasLength, 'Min 8 chars'],
                        [hasUpper, 'Uppercase'],
                        [hasLower, 'Lowercase'],
                        [hasNumber, 'Number'],
                        [hasSpecial, 'Special (@$!%*?&)'],
                      ].map(([ok, label]) => (
                        <span key={label} className={ok ? 'text-emerald-400 font-semibold' : ''}>
                          {ok ? '✓' : '•'} {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <FloatingInput id="reg-confirmPassword" name="confirmPassword" type="password"
                  value={regData.confirmPassword} onChange={handleRegChange}
                  label="Confirm Password *" icon={FiLock} disabled={regLoading || regSuccess} />

                <label className="flex items-start gap-2 text-[11px] text-white/50 cursor-pointer">
                  <input type="checkbox" name="terms" checked={regData.terms} onChange={handleRegChange}
                    className="mt-0.5 rounded border-white/30 text-yellow-400 focus:ring-yellow-400 shrink-0" />
                  <span>
                    I agree to the{' '}
                    <Link to="/terms" className="text-yellow-400 font-semibold hover:underline">Terms</Link>
                    {' '}and{' '}
                    <Link to="/privacy-policy" className="text-yellow-400 font-semibold hover:underline">Privacy Policy</Link>
                  </span>
                </label>

                {regError && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3.5 py-2">
                    <FiAlertCircle className="text-red-400 flex-shrink-0" size={12} />
                    <p className="text-red-400 text-[11px]">{regError}</p>
                  </div>
                )}

                <LuxuryButton type="submit" disabled={regLoading || regSuccess} loading={regLoading} success={regSuccess}>
                  Create Account <FiArrowRight />
                </LuxuryButton>
              </form>

              <p className="text-center mt-3 text-xs text-white/40">
                Already have an account?{' '}
                {/* ✅ NO navigate() — pure state flip only */}
                <button
                  type="button"
                  onClick={flipToLogin}
                  className="text-yellow-400 font-bold hover:text-yellow-300 transition-colors underline underline-offset-4 cursor-pointer"
                >
                  Sign In ✦
                </button>
              </p>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
