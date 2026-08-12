import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/auth/authSlice';
import {
  FiLock, FiMail, FiEye, FiEyeOff, FiShield, FiCheckCircle,
  FiAlertCircle, FiArrowRight, FiCpu, FiKey
} from 'react-icons/fi';
import api from '../../config/api';

/**
 * KVLR STYLES - Luxury Admin Authentication Portal
 */
const AdminLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Pre-fill default Super Admin credentials for instant access & native autofill compatibility
  const [email, setEmail] = useState('nagaseshukumarbobbiti@gmail.com');
  const [password, setPassword] = useState('seshu@2409');
  const [showPassword, setShowPassword] = useState(false);
  const [trustDevice, setTrustDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [failedCount, setFailedCount] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter admin email and password');
      return;
    }

    try {
      setLoading(true);
      const deviceFingerprint = `browser-${window.navigator.userAgent.replace(/[^a-zA-Z0-9]/g, '').substring(0, 30)}`;
      const deviceName = `${window.navigator.platform} (${window.navigator.appName})`;

      const res = await api.post('/admin/auth/login', {
        email,
        password,
        trustDevice,
        deviceFingerprint,
        deviceName
      });

      const { step, message, data } = res.data;

      if (step === 'AUTHENTICATED') {
        setVerified(true);
        dispatch(setCredentials({ user: data.user, token: data.token }));
        localStorage.setItem('adminToken', data.token);
        toast.success(message || '🛡️ Security clearance verified! Entering Admin Portal...');
        setTimeout(() => navigate('/admin/dashboard'), 1200);
        return;
      }

      if (step === 'OTP_REQUIRED') {
        toast.info(message || '6-digit OTP code sent to your registered email!');
        navigate('/admin/verify-otp', {
          state: {
            adminId: data.adminId,
            email: data.email,
            otpCode: data.otpCode,
            trustDevice,
            deviceFingerprint,
            deviceName
          }
        });
      }
    } catch (err) {
      setFailedCount(prev => prev + 1);
      toast.error(err.response?.data?.message || 'Security clearance rejected. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-stone-200 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-amber-500/30">
      {/* Luxury Gradient Background & Shimmer */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1f1c18,transparent_50%),radial-gradient(ellipse_at_bottom,#0f1115,transparent_50%)] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent opacity-60" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/10 to-transparent opacity-60" />

      {/* Decorative Gold Accents */}
      <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-amber-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-[#111113]/80 border border-white/5 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl relative z-10"
      >
        {/* Left Side: Brand Panel */}
        <div className="relative hidden md:flex flex-col items-center justify-center p-12 bg-gradient-to-br from-[#16161a] to-[#0a0a0c] border-r border-white/5">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:20px_20px]" />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="relative z-10 text-center space-y-6"
          >
            <div className="w-24 h-24 mx-auto border border-amber-500/30 rounded-full flex items-center justify-center p-1 relative">
               <div className="absolute inset-0 border border-amber-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
               <div className="w-full h-full bg-[#1a1a1c] rounded-full flex items-center justify-center border border-amber-500/10">
                 <span className="text-3xl font-serif text-amber-500 tracking-wider">KV</span>
               </div>
            </div>
            <div>
              <h1 className="text-3xl font-serif tracking-[0.2em] text-white font-light uppercase">KVLR Styles</h1>
              <p className="mt-2 text-[10px] tracking-[0.3em] text-amber-500/70 uppercase">Luxury Ethnic Fashion</p>
            </div>
            <div className="pt-8 w-16 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent mx-auto" />
            <p className="text-xs text-stone-400 font-light max-w-[200px] mx-auto leading-relaxed">
              Exclusive management portal. Access restricted to authorized personnel only.
            </p>
          </motion.div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 md:p-14 flex flex-col justify-center relative bg-[#0d0d0f]/50">
          <div className="md:hidden text-center mb-10">
            <div className="w-16 h-16 mx-auto border border-amber-500/30 rounded-full flex items-center justify-center mb-4">
              <span className="text-xl font-serif text-amber-500 tracking-wider">KV</span>
            </div>
            <h1 className="text-2xl font-serif tracking-[0.2em] text-white font-light uppercase">KVLR Styles</h1>
            <p className="mt-1 text-[10px] tracking-[0.3em] text-amber-500/70 uppercase">Admin Portal</p>
          </div>

          <div className="mb-10 text-center md:text-left">
            <h2 className="text-2xl font-light text-white tracking-wide">Sign In</h2>
            <p className="text-xs text-stone-500 mt-2 font-light">Enter your credentials to access the dashboard</p>
          </div>

          <AnimatePresence>
            {verified && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-3 text-sm text-amber-200/90 font-medium"
              >
                <FiCheckCircle className="shrink-0 text-amber-400 w-5 h-5" />
                <span>Authentication successful. Redirecting...</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1 group">
              <label className="text-[10px] uppercase tracking-widest text-stone-500 font-medium group-focus-within:text-amber-500 transition-colors">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-amber-500 transition-colors" size={16} />
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@kvlrstyles.com"
                  className="w-full pl-8 pr-4 py-2.5 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-stone-700 font-light text-sm"
                />
              </div>
            </div>

            <div className="space-y-1 group">
              <label className="text-[10px] uppercase tracking-widest text-stone-500 font-medium group-focus-within:text-amber-500 transition-colors">Password</label>
              <div className="relative">
                <FiLock className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-amber-500 transition-colors" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-8 pr-10 py-2.5 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-stone-700 font-light text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-500 hover:text-amber-500 transition-colors"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={trustDevice}
                    onChange={e => setTrustDevice(e.target.checked)}
                    className="peer appearance-none w-3.5 h-3.5 border border-stone-600 rounded-sm bg-transparent checked:bg-amber-500/20 checked:border-amber-500 transition-all cursor-pointer"
                  />
                  <FiCheckCircle className="absolute w-2.5 h-2.5 text-amber-500 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                </div>
                <span className="text-[11px] text-stone-400 group-hover:text-stone-300 transition-colors tracking-wide">Keep me signed in</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || verified}
              className="w-full mt-6 py-3.5 rounded bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-medium text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(217,119,6,0.15)] hover:shadow-[0_0_25px_rgba(217,119,6,0.3)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {verified ? (
                'Access Granted'
              ) : loading ? (
                'Authenticating...'
              ) : (
                <>
                  Sign In <FiArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center md:text-left">
            <Link to="/" className="inline-flex items-center gap-2 text-[10px] text-stone-500 hover:text-amber-500 transition-colors uppercase tracking-widest font-medium">
              <FiArrowRight className="rotate-180" size={10} />
              Return to Storefront
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
