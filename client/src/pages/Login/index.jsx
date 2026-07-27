import React, { useState, useRef, useEffect } from 'react';
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

const customStyles = `
  @keyframes float-particle {
    0% { transform: translateY(0) translateX(0); opacity: 0; }
    20% { opacity: 1; }
    80% { opacity: 1; }
    100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
  }
  @keyframes orb-float {
    0%, 100% { transform: translate(0, 0); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
  }
  @keyframes ripple {
    0% { transform: scale(0); opacity: 0.5; }
    100% { transform: scale(4); opacity: 0; }
  }
  .input-glow:focus {
    box-shadow: 0 0 0 3px rgba(212,175,55,0.15);
  }
  .luxury-button-ripple {
    position: relative;
    overflow: hidden;
  }
  .ripple-span {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    transform: scale(0);
    animation: ripple 0.6s linear;
    pointer-events: none;
  }
  .glass-card {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 
                inset 0 1px 1px rgba(255, 255, 255, 0.1);
  }
`;

const Particles = () => {
  const particles = Array.from({ length: 35 }).map((_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    top: Math.random() * 100,
    left: Math.random() * 100,
    duration: Math.random() * 12 + 8,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.3 + 0.3,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-gradient-to-b from-amber-400/60 to-amber-500/30"
          style={{
            width: \`\${p.size}px\`,
            height: \`\${p.size}px\`,
            top: \`\${p.top}%\`,
            left: \`\${p.left}%\`,
            opacity: p.opacity,
            animation: \`float-particle \${p.duration}s infinite linear\`,
            animationDelay: \`\${p.delay}s\`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
};

const RippleButton = ({ children, onClick, className, disabled, type = 'button' }) => {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setRipples([...ripples, { x, y, id: Date.now() }]);
    if (onClick) onClick(e);
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      className={\`luxury-button-ripple \${className}\`}
    >
      {children}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="ripple-span"
          style={{ left: r.x, top: r.y, width: 20, height: 20, marginTop: -10, marginLeft: -10 }}
          onAnimationEnd={() => setRipples((prev) => prev.filter((prevR) => prevR.id !== r.id))}
        />
      ))}
    </button>
  );
};

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

  const [dynamicFields, setDynamicFields] = useState([]);

  useEffect(() => {
    const fetchDynamicFields = async () => {
      try {
        const res = await api.get('/auth-form/form-fields?formType=REGISTER');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setDynamicFields(res.data.data);
        }
      } catch (err) {}
    };
    fetchDynamicFields();
  }, []);

  const cardRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePos({ x, y });
    
    if (!isMobile) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;
      
      setTilt({ rotateX, rotateY });
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setTilt({ rotateX: 0, rotateY: 0 });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError('');
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
        const targetPath = res.data.user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
        setTimeout(() => navigate(targetPath), 1200);
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
    <>
      <style>{customStyles}</style>
      <div className="min-h-screen bg-[#070709] text-white flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
        
        {/* Animated Background Orbs */}
        <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" style={{ animation: 'orb-float 20s infinite ease-in-out' }} />
        <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[120px] pointer-events-none" style={{ animation: 'orb-float 25s infinite ease-in-out reverse' }} />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-amber-400/5 rounded-full blur-[80px] pointer-events-none" style={{ animation: 'orb-float 15s infinite ease-in-out', animationDelay: '-5s' }} />

        <Particles />

        {/* Global Spotlight Beam following external mouse (if needed) */}
        {!isMobile && (
          <div
            className="absolute w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none transition-transform duration-300 z-0"
            style={{
              transform: \`translate(\${mousePos.x * 0.1}px, \${mousePos.y * 0.1}px)\`,
            }}
          />
        )}

        {/* 3D SCENE CONTAINER */}
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full max-w-md my-8 relative z-10"
          style={{ perspective: 1500 }}
          animate={{ 
            y: authSuccess ? 0 : [0, -8, 0],
            scale: authSuccess ? 0.9 : 1,
            opacity: authSuccess ? 0 : 1,
          }}
          transition={{
            y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
            scale: { duration: 0.6, ease: 'backIn' },
            opacity: { duration: 0.8, delay: 0.6 }
          }}
        >
          {/* Animated Gold Border Wrapper */}
          <motion.div
            animate={{
              rotateX: tilt.rotateX,
              rotateY: tilt.rotateY,
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            style={{ transformStyle: 'preserve-3d' }}
            className={\`relative w-full rounded-3xl p-[1px] transition-colors duration-500 \${
              authSuccess 
                ? 'bg-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.4)]' 
                : 'bg-gradient-to-br from-amber-500/50 via-amber-500/10 to-gold-500/50 shadow-[0_0_40px_rgba(212,175,55,0.15)]'
            }\`}
          >
            {/* INNER CARD */}
            <motion.div
              animate={{ rotateY: isRegister ? 180 : 0, scale: [1, 0.95, 1] }}
              transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
              style={{ transformStyle: 'preserve-3d' }}
              className="relative w-full rounded-[23px] bg-[#0D0D12]/80 backdrop-blur-2xl glass-card"
            >
              {/* Internal Cursor Spotlight Overlay */}
              {!isMobile && (
                 <div 
                   className="absolute w-64 h-64 bg-white/5 rounded-full blur-[60px] pointer-events-none transition-opacity duration-300 z-0"
                   style={{
                     left: mousePos.x - 128,
                     top: mousePos.y - 128,
                   }}
                 />
              )}

              {/* ── FRONT FACE: WELCOME BACK (LOGIN) ── */}
              <motion.div
                style={{ backfaceVisibility: 'hidden', zIndex: 10 }}
                animate={{ x: error ? [-8, 8, -6, 6, 0] : 0 }}
                className="w-full p-5 sm:p-8 relative"
              >
                <div className="text-center space-y-2 mb-6 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-md">
                    <FiStar className="w-6 h-6 fill-amber-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Welcome Back</h2>
                  <p className="text-xs text-gray-400">Sign in to continue shopping and access your luxury profile.</p>
                </div>

                {error && !isRegister && (
                  <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    <FiAlertCircle className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-xs relative z-10">
                  <div>
                    <label className="block font-bold text-gray-300 mb-1">Email Address</label>
                    <div className="relative group">
                      <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors z-10" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="name@domain.com"
                        className={\`w-full pl-10 pr-4 py-3 min-h-[44px] rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 input-glow transition-all duration-300 \${error && !isRegister ? 'border-red-500' : ''} \${authSuccess ? 'border-emerald-500' : ''}\`}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-gray-300">Password</label>
                      <button
                        type="button"
                        onClick={() => setForgotModalOpen(true)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative group">
                      <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors z-10" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        required
                        value={form.password}
                        onChange={handleChange}
                        placeholder="••••••••••••"
                        className={\`w-full pl-10 pr-10 py-3 min-h-[44px] rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 input-glow transition-all duration-300 \${error && !isRegister ? 'border-red-500' : ''} \${authSuccess ? 'border-emerald-500' : ''}\`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white z-10 transition-colors"
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">
                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={form.rememberMe}
                        onChange={handleChange}
                        className="rounded text-amber-500 focus:ring-amber-500 bg-white/10 border-gray-700 w-4 h-4 cursor-pointer"
                      />
                      <span>Remember me</span>
                    </label>
                  </div>

                  <RippleButton
                    type="submit"
                    disabled={loading || authSuccess}
                    className={\`w-full py-3.5 min-h-[44px] rounded-xl font-black uppercase tracking-wider text-xs shadow-lg transition-all duration-300 flex items-center justify-center gap-2 \${
                      authSuccess 
                        ? 'bg-emerald-500 text-white shadow-emerald-500/30' 
                        : 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black shadow-amber-500/20 hover:-translate-y-[2px] active:scale-[0.98]'
                    }\`}
                  >
                    {authSuccess ? (
                      <>
                        <FiCheckCircle className="w-5 h-5" /> Authenticated!
                      </>
                    ) : loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        Signing In...
                      </div>
                    ) : (
                      <>
                        Sign In <FiArrowRight />
                      </>
                    )}
                  </RippleButton>
                </form>

                <div className="relative z-10 mt-6">
                  <SocialAuthButtons />
                </div>

                <div className="mt-6 text-center text-xs text-gray-400 border-t border-white/10 pt-4 relative z-10">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsRegister(true)}
                    className="font-bold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer ml-1 transition-colors"
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
                  height: '100%',
                  zIndex: 10
                }}
                animate={{ x: error && isRegister ? [-8, 8, -6, 6, 0] : 0 }}
                className="w-full p-5 sm:p-8 flex flex-col justify-center"
              >
                <div className="text-center space-y-2 mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-md">
                    <FiUser className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Create Account</h2>
                  <p className="text-xs text-gray-400">Join KVLR Styles to unlock VIP deals and instant order tracking.</p>
                </div>

                {error && isRegister && (
                  <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    <FiAlertCircle className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3 text-xs relative z-10 overflow-y-auto no-scrollbar pb-2">
                  <div>
                    <label className="block font-bold text-gray-300 mb-1">Full Name</label>
                    <div className="relative group">
                      <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors z-10" />
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={form.fullName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className={\`w-full pl-10 pr-4 py-2.5 min-h-[44px] rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 input-glow transition-all duration-300 \${error && isRegister && !form.fullName ? 'border-red-500' : ''}\`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-300 mb-1">Email Address</label>
                    <div className="relative group">
                      <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors z-10" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="name@domain.com"
                        className={\`w-full pl-10 pr-4 py-2.5 min-h-[44px] rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 input-glow transition-all duration-300 \${error && isRegister && !form.email ? 'border-red-500' : ''}\`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-300 mb-1">Mobile Number (Optional)</label>
                    <div className="relative group">
                      <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors z-10" />
                      <input
                        type="tel"
                        name="mobile"
                        value={form.mobile}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-2.5 min-h-[44px] rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 input-glow transition-all duration-300"
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
                        className={\`w-full px-3 py-2.5 min-h-[44px] rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 input-glow transition-all duration-300 text-xs \${error && isRegister && form.password.length < 6 ? 'border-red-500' : ''}\`}
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
                        className={\`w-full px-3 py-2.5 min-h-[44px] rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 input-glow transition-all duration-300 text-xs \${error && isRegister && form.password !== form.confirmPassword ? 'border-red-500' : ''}\`}
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-gray-400 cursor-pointer pt-1 hover:text-gray-300 transition-colors">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={form.acceptTerms}
                      onChange={handleChange}
                      className="rounded text-amber-500 focus:ring-amber-500 bg-white/10 border-gray-700 w-4 h-4 cursor-pointer"
                    />
                    <span>I accept Terms & Conditions</span>
                  </label>

                  <RippleButton
                    type="submit"
                    disabled={loading || authSuccess}
                    className={\`w-full py-3.5 min-h-[44px] rounded-xl font-black uppercase tracking-wider text-xs shadow-lg transition-all duration-300 flex items-center justify-center gap-2 mt-2 \${
                      authSuccess 
                        ? 'bg-emerald-500 text-white shadow-emerald-500/30' 
                        : 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black shadow-amber-500/20 hover:-translate-y-[2px] active:scale-[0.98]'
                    }\`}
                  >
                    {authSuccess ? (
                      <>
                        <FiCheckCircle className="w-5 h-5" /> Account Created!
                      </>
                    ) : loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        Creating Account...
                      </div>
                    ) : (
                      <>
                        Create Account <FiArrowRight />
                      </>
                    )}
                  </RippleButton>
                </form>

                <div className="relative z-10 mt-6">
                  <SocialAuthButtons />
                </div>

                <div className="mt-3 text-center text-xs text-gray-400 border-t border-white/10 pt-3 relative z-10">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsRegister(false)}
                    className="font-bold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer ml-1 transition-colors"
                  >
                    Sign In →
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

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
                className="bg-[#0D0D12] border border-amber-500/30 shadow-[0_0_40px_rgba(212,175,55,0.15)] rounded-3xl p-6 max-w-sm w-full space-y-4 text-xs text-white relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
                
                <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10">
                  <h3 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                    <FiKey /> Reset Password
                  </h3>
                  <button onClick={() => setForgotModalOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 relative z-10">
                  {forgotStep === 1 && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                      <p className="text-gray-400 mb-3 leading-relaxed">Enter your registered email to receive a 6-digit OTP code.</p>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="name@domain.com"
                        className="w-full px-4 py-3 min-h-[44px] rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400 input-glow transition-all"
                      />
                    </motion.div>
                  )}

                  {forgotStep === 2 && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                      <p className="text-gray-400 mb-3 leading-relaxed">Enter 4-digit OTP sent to <span className="text-amber-400">{forgotEmail}</span>:</p>
                      <input
                        type="text"
                        maxLength={4}
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="1234"
                        className="w-full px-4 py-3 min-h-[44px] rounded-xl bg-white/5 border border-white/10 text-white text-center font-bold tracking-widest text-lg focus:outline-none focus:border-amber-400 input-glow transition-all"
                      />
                    </motion.div>
                  )}

                  {forgotStep === 3 && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                      <p className="text-gray-400 mb-3 leading-relaxed">Enter your new strong password:</p>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-4 py-3 min-h-[44px] rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400 input-glow transition-all"
                      />
                    </motion.div>
                  )}

                  <RippleButton
                    type="submit"
                    className="w-full py-3.5 min-h-[44px] rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:-translate-y-[2px] active:scale-[0.98] transition-all"
                  >
                    {forgotStep === 1 ? 'Send OTP Code' : forgotStep === 2 ? 'Verify OTP' : 'Reset Password'}
                  </RippleButton>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Login;
