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
 * Exclusive Cyber-Security Admin Authentication Portal
 * Dark luxury dashboard style, animated security shield, digital matrix grid, trusted device tracking.
 */
const AdminLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen bg-[#050811] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Cyber Grid Background Matrix */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Cyber Glow Orbs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* MAIN ADMIN CARD */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full max-w-md bg-[#0A0E1A]/90 border border-cyan-500/30 rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl relative z-10 space-y-6"
      >
        {/* Holographic Top Border Highlight */}
        <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Header Branding & Security Icon */}
        <div className="text-center space-y-2">
          <div className="relative w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <motion.div animate={verified ? { rotateY: 360 } : {}}>
              <FiShield className="w-8 h-8 text-cyan-400" />
            </motion.div>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-black animate-pulse" />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            Administrator Portal <FiCpu className="text-cyan-400 w-4 h-4" />
          </h1>
          <p className="text-xs text-cyan-400/80 font-mono tracking-widest uppercase">
            [ Authorized Personnel Only ]
          </p>
        </div>

        {/* Verified Notice Animation */}
        <AnimatePresence>
          {verified ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300 font-bold"
            >
              <FiCheckCircle className="shrink-0 text-emerald-400 w-5 h-5" />
              <span>Security Clearance Granted. Launching Dashboard...</span>
            </motion.div>
          ) : (
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center gap-2.5 text-[11px] text-cyan-300 font-medium">
              <FiShield className="shrink-0 text-cyan-400" size={16} />
              <span>256-Bit Encrypted Admin Handshake Active</span>
            </div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-xs">
          {/* Fake inputs to prevent browser forced autofill */}
          <input type="text" name="prevent_autofill_email" style={{ display: 'none' }} tabIndex={-1} readOnly />
          <input type="password" name="prevent_autofill_password" style={{ display: 'none' }} tabIndex={-1} readOnly />

          {/* Email */}
          <div>
            <label className="block font-bold text-gray-300 mb-1.5 font-mono">ADMIN_EMAIL</label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-500" size={16} />
              <input
                type="email"
                name="admin_auth_user_email"
                autoComplete="off"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@styleverse.com"
                className="w-full pl-10 pr-4 py-3 bg-black/60 border border-cyan-500/30 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-400 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block font-bold text-gray-300 mb-1.5 font-mono">SECURITY_PASSPHRASE</label>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-500" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="admin_auth_user_password"
                autoComplete="new-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-3 bg-black/60 border border-cyan-500/30 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-400 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-500 hover:text-white"
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* Trust Device Checkbox */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-white/10 bg-black/40 cursor-pointer hover:bg-black/60 transition">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={e => setTrustDevice(e.target.checked)}
              className="rounded text-cyan-500 focus:ring-cyan-400"
            />
            <div>
              <p className="font-bold text-gray-200 text-xs">Trust this device for 30 days</p>
              <p className="text-[10px] text-gray-400">Skip email OTP verification on this browser</p>
            </div>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || verified}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            {verified ? (
              <>
                <FiCheckCircle className="w-4 h-4 text-black" /> Clearance Approved
              </>
            ) : loading ? (
              'Verifying Security Tokens...'
            ) : (
              <>
                Authenticate Admin Access <FiArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center border-t border-white/10">
          <Link to="/" className="text-[11px] text-gray-400 hover:text-cyan-400 transition">
            ← Return to Storefront
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
