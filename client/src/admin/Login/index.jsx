import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/auth/authSlice';
import {
  FiLock, FiMail, FiEye, FiEyeOff, FiShield, FiCheckCircle,
  FiAlertCircle, FiArrowRight, FiCheck
} from 'react-icons/fi';
import api from '../../config/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('nagaseshukumarbobbiti@gmail.com');
  const [password, setPassword] = useState('seshu@2409');
  const [showPassword, setShowPassword] = useState(false);
  const [trustDevice, setTrustDevice] = useState(true);
  const [loading, setLoading] = useState(false);
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

      // STEP A: If trusted device, authenticated immediately
      if (step === 'AUTHENTICATED') {
        dispatch(setCredentials({ user: data.user, token: data.token }));
        localStorage.setItem('adminToken', data.token);
        toast.success(message || 'Welcome to Admin Portal!');
        navigate('/admin/dashboard');
        return;
      }

      // STEP B: Requires 6-Digit Email OTP
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
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Background Glow Spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6"
      >
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
            <FiShield className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">StyleVerse Admin Portal</h1>
          <p className="text-xs text-slate-400">Independent Security & Administration Gateway</p>
        </div>

        {/* Security Warning Notice */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-2.5 text-xs text-amber-300">
          <FiShield className="shrink-0 text-amber-400" size={16} />
          <span>Super Admin Auto-Bootstrap active. Authorized personnel only.</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Email Address Input */}
          <div>
            <label className="block font-bold text-slate-300 mb-1.5">Admin Email Address</label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@styleverse.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block font-bold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:border-amber-400 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* 30-Day Trusted Device Checkbox */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-800 bg-slate-950/50 cursor-pointer hover:bg-slate-950">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={e => setTrustDevice(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-400"
            />
            <div>
              <p className="font-bold text-slate-200">Trust this device for 30 days</p>
              <p className="text-[10px] text-slate-400">Skip email OTP on this browser for 30 days</p>
            </div>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : 'Sign In To Admin Portal'}
            <FiArrowRight size={16} />
          </button>
        </form>

        <div className="pt-2 text-center">
          <Link to="/" className="text-[11px] text-slate-500 hover:text-slate-300 transition">
            ← Return to Customer Storefront
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
