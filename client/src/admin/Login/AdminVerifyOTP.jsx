import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/auth/authSlice';
import { FiShield, FiKey, FiRefreshCw, FiArrowRight, FiCheck } from 'react-icons/fi';
import api from '../../config/api';

const AdminVerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const stateData = location.state || {};
  const { adminId, email, otpCode: demoOtpCode, trustDevice, deviceFingerprint, deviceName } = stateData;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [currentOtpHint, setCurrentOtpHint] = useState(demoOtpCode || '');

  const inputsRef = useRef([]);

  useEffect(() => {
    if (!adminId) {
      toast.error('Session expired. Please log in again.');
      navigate('/admin/login');
    }
  }, [adminId, navigate]);

  // 60-second countdown timer
  useEffect(() => {
    if (timer > 0) {
      const countdown = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(countdown);
    }
  }, [timer]);

  // Handle box input
  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  // Submit OTP Verification
  const handleVerify = async (e) => {
    e?.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      toast.error('Please enter complete 6-digit OTP code');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/admin/auth/verify-otp', {
        adminId,
        otpCode: fullOtp,
        trustDevice,
        deviceFingerprint,
        deviceName
      });

      const { user, token } = res.data.data;
      dispatch(setCredentials({ user, token }));
      localStorage.setItem('adminToken', token);
      toast.success('OTP verified! Authenticated as Administrator 🎉');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Code
  const handleResend = async () => {
    try {
      setResending(true);
      const res = await api.post('/admin/auth/resend-otp', { adminId });
      toast.success(`New 6-digit OTP code sent to ${email}`);
      setTimer(60);
      if (res.data.data?.otpCode) {
        setCurrentOtpHint(res.data.data.otpCode);
      }
    } catch (err) {
      toast.error('Resend OTP failed');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-2">
          <FiKey className="w-8 h-8 text-amber-400" />
        </div>

        <div>
          <h1 className="text-xl font-black text-white">Enter 6-Digit Verification OTP</h1>
          <p className="text-xs text-slate-400 mt-1">
            Verification code sent to <strong>{email}</strong>
          </p>
        </div>

        {/* Demo OTP Banner for Instant Testing */}
        {currentOtpHint && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300">
            <span>Your OTP Code: <strong className="font-mono text-base text-amber-400">{currentOtpHint}</strong></span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          {/* 6-Digit Box Inputs */}
          <div className="flex justify-center gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => inputsRef.current[i] = el}
                type="text"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-11 h-13 text-center text-xl font-black font-mono bg-slate-950 border border-slate-800 rounded-xl focus:border-amber-400 focus:outline-none transition"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || otp.join('').length !== 6}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Verifying OTP...' : 'Verify Code & Access Dashboard'}
            <FiCheck size={16} />
          </button>
        </form>

        {/* Resend Timer Controls */}
        <div className="pt-2 text-xs text-slate-400 flex items-center justify-center gap-2">
          <span>Didn&apos;t receive code?</span>
          {timer > 0 ? (
            <span className="font-mono text-amber-400">Resend in {timer}s</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <FiRefreshCw size={12} className={resending ? 'animate-spin' : ''} /> Resend OTP
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminVerifyOTP;
