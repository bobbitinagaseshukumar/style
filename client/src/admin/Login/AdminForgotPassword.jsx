import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiKey, FiArrowLeft, FiCheckCircle, FiRefreshCw, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../config/api';

const AdminForgotPassword = () => {
  const navigate = useNavigate();

  // Wizard Steps: 1 = Email Input, 2 = Enter 6-Digit OTP, 3 = New Password Input, 4 = Success
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const otpInputsRef = useRef([]);

  // Handle Step 1: Request Reset OTP to Admin Email
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      toast.error('Please enter your admin email address');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/admin/auth/forgot-password', { email: email.trim() });
      toast.success(res.data?.message || `6-digit reset code sent to ${email}`);
      setStep(2);
      setTimeout(() => otpInputsRef.current[0]?.focus(), 300);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No admin account found with this email');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Box Input Change
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      setOtp(pastedData.split(''));
      otpInputsRef.current[5]?.focus();
    }
  };

  // Handle Step 2: Verify 6-Digit OTP Code
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      toast.error('Please enter complete 6-digit verification code');
      return;
    }

    try {
      setLoading(true);
      await api.post('/admin/auth/verify-reset-otp', {
        email: email.trim(),
        otpCode: fullOtp,
      });
      toast.success('OTP code verified! You can now create your new password.');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid verification code');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Code
  const handleResendOTP = async () => {
    try {
      setResending(true);
      await api.post('/admin/auth/forgot-password', { email: email.trim() });
      toast.success(`Fresh 6-digit reset OTP sent to ${email}`);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  // Handle Step 3: Save New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error('Please enter new password');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/admin/auth/reset-password', {
        email: email.trim(),
        otpCode: otp.join(''),
        newPassword,
      });

      toast.success(res.data?.message || 'Admin password updated successfully!');
      setStep(4);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-stone-200 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-amber-500/30">
      {/* Luxury Background Shimmer & Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1f1c18,transparent_50%),radial-gradient(ellipse_at_bottom,#0f1115,transparent_50%)] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent opacity-60" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-[#111113]/90 border border-amber-500/20 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6 text-center"
      >
        {/* Step Indicator Badges */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === s
                  ? 'w-8 bg-amber-500'
                  : step > s
                  ? 'w-3 bg-amber-500/50'
                  : 'w-3 bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* STEP 1: ENTER ADMIN EMAIL */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              <FiKey className="w-8 h-8 text-amber-400" />
            </div>

            <div>
              <h1 className="text-2xl font-serif text-white">Reset Admin Password</h1>
              <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                Enter your registered admin email address. We will send a 6-digit OTP code to verify your identity.
              </p>
            </div>

            <form onSubmit={handleRequestOTP} className="space-y-5 text-left">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-stone-500 font-medium">Admin Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@kvlrstyles.com"
                    className="w-full pl-8 pr-4 py-2.5 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-stone-700 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Sending Verification Code...' : 'Send Reset Code'}
              </button>
            </form>
          </motion.div>
        )}

        {/* STEP 2: ENTER 6-DIGIT OTP */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              <FiShield className="w-8 h-8 text-amber-400" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-white">Enter 6-Digit OTP Code</h1>
              <p className="text-xs text-stone-400 mt-1.5">
                Verification code sent to <strong className="text-amber-400">{email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="flex justify-center gap-2 sm:gap-2.5">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpInputsRef.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={handleOtpPaste}
                    className="w-11 h-13 text-center text-xl font-bold font-mono bg-black/60 border border-amber-500/25 rounded-xl focus:border-amber-400 focus:outline-none text-amber-50 placeholder:text-stone-700"
                    placeholder="·"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Verifying OTP...' : 'Verify OTP Code'}
              </button>
            </form>

            <div className="text-xs text-stone-400 flex items-center justify-center gap-2">
              <span>Didn&apos;t receive code?</span>
              <button
                onClick={handleResendOTP}
                disabled={resending}
                className="text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                <FiRefreshCw size={12} className={resending ? 'animate-spin' : ''} /> Resend Code
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: CREATE NEW PASSWORD */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              <FiLock className="w-8 h-8 text-amber-400" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-white">Create New Password</h1>
              <p className="text-xs text-stone-400 mt-1.5">
                Set a strong new password for <strong className="text-amber-400">{email}</strong>
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-5 text-left">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-stone-500 font-medium">New Password</label>
                <div className="relative">
                  <FiLock className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-8 pr-10 py-2.5 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-stone-700 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-500 hover:text-amber-400"
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-stone-500 font-medium">Confirm New Password</label>
                <div className="relative">
                  <FiLock className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-8 pr-10 py-2.5 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-stone-700 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          </motion.div>
        )}

        {/* STEP 4: SUCCESS CONFIRMATION */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
              <FiCheckCircle className="w-10 h-10" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white">Password Updated!</h1>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                Your admin password has been changed successfully. Old password has been invalidated.
              </p>
            </div>

            <button
              onClick={() => navigate('/admin/login', { replace: true })}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              Log In With New Password <FiCheck size={16} />
            </button>
          </motion.div>
        )}

        {/* Back to Admin Login */}
        <div className="pt-2 border-t border-white/8">
          <Link
            to="/admin/login"
            className="text-[11px] text-stone-500 hover:text-amber-400 transition flex items-center gap-1 justify-center mx-auto"
          >
            <FiArrowLeft size={11} /> Back to Admin Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminForgotPassword;
