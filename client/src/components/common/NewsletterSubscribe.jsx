import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { FiMail, FiCheck, FiArrowRight, FiRefreshCw, FiAlertCircle, FiLock, FiX } from 'react-icons/fi';
import api from '../../config/api';

// Strict email regex validation
const isValidEmailFormat = (email) => {
  if (!email) return false;
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email.trim());
};

const NewsletterSubscribe = ({ variant = 'section' }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('INPUT'); // 'INPUT' | 'OTP' | 'SUCCESS'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const otpInputRef = useRef(null);

  // Resend countdown timer
  useEffect(() => {
    let interval;
    if (step === 'OTP' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Focus OTP input when step changes
  useEffect(() => {
    if (step === 'OTP' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address');
      return;
    }

    if (!isValidEmailFormat(cleanEmail)) {
      setErrorMsg('Invalid email format. Please enter a valid email (e.g. name@gmail.com)');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/cms/newsletter/send-otp', { email: cleanEmail });

      if (res.data?.alreadySubscribed) {
        toast.info(res.data.message || 'You are already a verified subscriber!');
        setStep('SUCCESS');
        return;
      }

      toast.success(res.data?.message || `6-digit verification code sent to ${cleanEmail}`);
      setStep('OTP');
      setResendTimer(30);
      setCanResend(false);
      setOtp('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send verification code. Please check your email.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/cms/newsletter/verify-otp', {
        email: email.trim(),
        otp: cleanOtp
      });

      toast.success(res.data?.message || '🎉 Subscribed & verified successfully!');
      setStep('SUCCESS');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP. Please try again.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || loading) return;
    setErrorMsg('');
    try {
      setLoading(true);
      await api.post('/cms/newsletter/send-otp', { email: email.trim() });
      toast.success(`New 6-digit code sent to ${email.trim()}`);
      setResendTimer(30);
      setCanResend(false);
      setOtp('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('INPUT');
    setEmail('');
    setOtp('');
    setErrorMsg('');
  };

  // ── FOOTER COMPACT VARIANT ────────────────────────────────────
  if (variant === 'footer') {
    return (
      <div className="w-full">
        {step === 'INPUT' && (
          <form onSubmit={handleSendOTP} className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Enter your email address"
                className={`w-full bg-charcoal-900 border ${errorMsg ? 'border-red-500' : 'border-charcoal-800 focus:border-gold-500'} text-white px-4 py-2 rounded focus:outline-none text-xs sm:text-sm`}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto whitespace-nowrap bg-gold-500 hover:bg-gold-600 text-black font-bold px-4 py-2 rounded text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Subscribe'}
              </button>
            </div>
            {errorMsg && (
              <p className="text-[11px] text-red-400 flex items-center gap-1 mt-1 text-left">
                <FiAlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </p>
            )}
          </form>
        )}

        {step === 'OTP' && (
          <form onSubmit={handleVerifyOTP} className="space-y-2.5 p-3 rounded-xl bg-white/5 border border-gold-500/30 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gold-400 flex items-center gap-1">
                <FiLock size={12} /> Enter 6-Digit OTP
              </span>
              <button type="button" onClick={handleReset} className="text-[10px] text-gray-400 hover:text-white underline cursor-pointer">
                Change Email
              </button>
            </div>
            <p className="text-[10px] text-gray-300">Sent code to: <strong className="text-white">{email}</strong></p>
            <div className="flex gap-2">
              <input
                ref={otpInputRef}
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit OTP"
                className="w-full bg-black/60 border border-gold-500/40 text-center tracking-widest text-gold-300 font-bold px-3 py-1.5 rounded text-sm focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="px-3 py-1.5 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded text-xs shrink-0 cursor-pointer disabled:opacity-50"
              >
                {loading ? <FiRefreshCw className="w-3 h-3 animate-spin" /> : 'Verify'}
              </button>
            </div>
            {errorMsg && <p className="text-[10px] text-red-400">{errorMsg}</p>}
            <div className="text-[10px] text-gray-400 flex justify-between items-center">
              <span>Expires in 10m</span>
              {canResend ? (
                <button type="button" onClick={handleResend} className="text-gold-400 font-bold hover:underline cursor-pointer">Resend OTP</button>
              ) : (
                <span>Resend in {resendTimer}s</span>
              )}
            </div>
          </form>
        )}

        {step === 'SUCCESS' && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <FiCheck className="w-4 h-4" /> Subscribed & Verified!
            </span>
            <button onClick={handleReset} className="text-[10px] text-gray-400 hover:text-white underline cursor-pointer">
              Add Another
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── HOMEPAGE HERO / SECTION VARIANT ──────────────────────────
  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {step === 'INPUT' && (
          <motion.form
            key="input-form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleSendOTP}
            className="space-y-3"
          >
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="Enter your email address"
                  className={`w-full pl-11 pr-4 py-3 rounded-full bg-white/10 border ${errorMsg ? 'border-red-500 ring-2 ring-red-500/20' : 'border-white/20 focus:border-amber-400'} text-white placeholder-gray-400 focus:outline-none transition-all text-sm`}
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-7 py-3 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-black font-extrabold text-sm transition-all shadow-lg hover:shadow-amber-500/20 shrink-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <FiArrowRight size={14} />
                  </>
                )}
              </button>
            </div>

            {errorMsg && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400 font-semibold flex items-center justify-center gap-1.5"
              >
                <FiAlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </motion.p>
            )}
          </motion.form>
        )}

        {step === 'OTP' && (
          <motion.form
            key="otp-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onSubmit={handleVerifyOTP}
            className="p-5 rounded-2xl bg-white/5 border border-amber-400/30 backdrop-blur-xl shadow-2xl space-y-3.5 text-left"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <FiLock size={14} />
                <span>Verify Your Subscription Email</span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-gray-400 hover:text-white text-xs flex items-center gap-1 cursor-pointer"
              >
                <FiX size={13} /> Change
              </button>
            </div>

            <p className="text-xs text-gray-300">
              We sent a 6-digit OTP code to: <strong className="text-amber-300 font-mono">{email}</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                ref={otpInputRef}
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ''));
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="• • • • • •"
                className="flex-1 bg-black/60 border border-amber-400/40 text-center tracking-[0.4em] text-lg font-mono font-black text-amber-300 px-4 py-2.5 rounded-xl focus:outline-none focus:border-amber-400 transition"
              />
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-extrabold text-xs shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                {loading ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiCheck size={14} />}
                <span>{loading ? 'Verifying...' : 'Verify & Subscribe'}</span>
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-400 font-semibold flex items-center gap-1.5">
                <FiAlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
              <span>Code expires in 10 minutes</span>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  Resend Code
                </button>
              ) : (
                <span>Resend in <strong>{resendTimer}s</strong></span>
              )}
            </div>
          </motion.form>
        )}

        {step === 'SUCCESS' && (
          <motion.div
            key="success-box"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-xl text-center space-y-2"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-lg font-black shadow-lg">
              ✓
            </div>
            <h4 className="text-base font-bold text-white">🎉 You're Officially Subscribed!</h4>
            <p className="text-xs text-gray-300 max-w-sm mx-auto">
              Your email <strong className="text-emerald-300 font-mono">{email}</strong> has been verified. You'll now receive exclusive festive deals, new product alerts, and secret coupons.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="mt-2 text-xs font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
            >
              Subscribe another email address
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewsletterSubscribe;
