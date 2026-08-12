import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiClock, FiRefreshCw, FiArrowRight, FiArrowLeft, FiShield } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import api from '../../config/api';
import { setCredentials } from '../../redux/auth/authSlice';
import { toast } from 'react-toastify';

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Retrieve stateData from location.state OR fallback to sessionStorage on page refresh
  const getInitialStateData = () => {
    if (location.state && location.state.userId) {
      sessionStorage.setItem('pendingCustomerOTPAuth', JSON.stringify(location.state));
      return location.state;
    }
    const saved = sessionStorage.getItem('pendingCustomerOTPAuth');
    if (saved) {
      try { return JSON.parse(saved); } catch { return {}; }
    }
    return {};
  };

  const stateData = getInitialStateData();
  const email = stateData.email;
  const userId = stateData.userId;

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  // Redirect only if NO userId exists in both location.state AND sessionStorage
  useEffect(() => {
    if (!userId || !email) {
      toast.error('Session expired. Please log in again.');
      navigate('/login', { replace: true });
    }
  }, [userId, email, navigate]);

  // 60-second countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (userId) {
      setTimeout(() => inputRefs[0].current?.focus(), 300);
    }
  }, [userId]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otpDigits];
    newOtp[index] = value.slice(-1);
    setOtpDigits(newOtp);

    // Auto focus next box
    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtpDigits(digits);
      inputRefs[5].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 6) {
      toast.error('Please enter complete 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post('/auth/verify-otp', {
        userId,
        email,
        otp: fullOtp,
      });

      if (data?.success) {
        dispatch(setCredentials(data.data));
        sessionStorage.removeItem('pendingCustomerOTPAuth');
        toast.success('Email verified successfully! Welcome to StyleVerse.');
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
      // CRITICAL FIX: Clear OTP inputs on failed verification so user can re-enter fresh
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs[0].current?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setResending(true);
      await api.post('/auth/resend-otp', { userId, email });
      toast.success(`Fresh 6-digit OTP sent to ${email}`);

      // CRITICAL FIX: Clear old OTP digits and reset timer so user enters the NEW code
      setOtpDigits(['', '', '', '', '', '']);
      setTimer(60);

      // Focus back on first input for easy entry
      setTimeout(() => inputRefs[0].current?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP. Try again.');
    } finally {
      setResending(false);
    }
  };

  // Don't render if no session data
  if (!userId || !email) return null;

  return (
    <div className="max-w-md w-full mx-auto bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-100 my-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gold-50 text-gold-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-inner">
        <FiCheckCircle className="w-8 h-8" />
      </div>

      <h2 className="text-2xl font-serif font-bold text-charcoal-900">Email OTP Verification</h2>
      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
        We have sent a 6-digit verification code to <strong className="text-charcoal-900">{email}</strong>. Code is valid for 5 minutes.
      </p>

      {/* Security info */}
      <div className="mt-4 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-700 flex items-center gap-2 justify-center">
        <FiShield className="shrink-0" size={13} />
        <span>Check your email inbox for the verification code.</span>
      </div>

      {/* 6 OTP Input Boxes */}
      <form onSubmit={handleVerify} className="mt-8 space-y-6">
        <div className="flex justify-center gap-2 sm:gap-3">
          {otpDigits.map((digit, index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-11 h-13 text-center text-xl font-bold rounded-xl border-2 border-gray-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 focus:outline-none bg-white shadow-sm"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || otpDigits.join('').length !== 6}
          className="w-full py-3.5 rounded-full bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <FiRefreshCw className="animate-spin" size={14} /> Verifying OTP...
            </>
          ) : (
            <>
              Verify & Continue <FiArrowRight />
            </>
          )}
        </button>
      </form>

      {/* Resend Timer */}
      <div className="mt-6 text-xs text-gray-500 flex flex-col items-center gap-2">
        {timer > 0 ? (
          <span className="flex items-center gap-1.5 text-gray-600">
            <FiClock className="w-4 h-4 text-gold-600" /> Resend OTP in <strong className="text-gold-600 font-mono">{timer}s</strong>
          </span>
        ) : (
          <button
            onClick={handleResendOTP}
            disabled={resending}
            className="inline-flex items-center gap-1.5 text-gold-600 font-bold hover:underline disabled:opacity-50"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            {resending ? 'Sending...' : 'Resend Verification Code'}
          </button>
        )}
      </div>

      {/* Back to login link */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={() => navigate('/login', { replace: true })}
          className="text-[11px] text-gray-400 hover:text-gold-600 transition flex items-center gap-1 justify-center mx-auto cursor-pointer"
        >
          <FiArrowLeft size={11} /> Back to Login
        </button>
      </div>
    </div>
  );
};

export default VerifyOTP;
