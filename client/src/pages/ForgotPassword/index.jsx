import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiShield, FiKey, FiArrowLeft, FiCheckCircle, FiRefreshCw, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../config/api';

const ForgotPassword = () => {
  const navigate = useNavigate();

  // Wizard Steps: 1 = Email, 2 = 6-Digit OTP, 3 = New Password, 4 = Success
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const otpInputsRef = useRef([]);

  // Step 1: Send Reset OTP to Customer Email
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      toast.success(res.data?.message || `6-digit reset code sent to ${email}`);
      setStep(2);
      setTimeout(() => otpInputsRef.current[0]?.focus(), 300);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No account found with this email');
    } finally {
      setLoading(false);
    }
  };

  // OTP Box Inputs
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

  // Step 2: Verify 6-Digit OTP Code
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      toast.error('Please enter complete 6-digit OTP code');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/verify-reset-otp', {
        email: email.trim(),
        otp: fullOtp,
      });
      toast.success('OTP code verified! Enter your new password.');
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
      await api.post('/auth/forgot-password', { email: email.trim() });
      toast.success(`Fresh 6-digit reset OTP sent to ${email}`);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  // Step 3: Save New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error('Please enter new password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/reset-password', {
        email: email.trim(),
        otp: otp.join(''),
        newPassword,
      });

      toast.success(res.data?.message || 'Password updated successfully!');
      setStep(4);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-100 my-8 text-center">
      {/* Step Indicator Badges */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step === s ? 'w-8 bg-gold-600' : step > s ? 'w-3 bg-gold-400/50' : 'w-3 bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* STEP 1: ENTER EMAIL */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gold-50 text-gold-600 flex items-center justify-center mx-auto mb-2 text-2xl font-bold shadow-inner">
            <FiKey className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-serif font-bold text-charcoal-900">Forgot Password</h2>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Enter your registered email address. We will send a 6-digit OTP verification code to reset your password.
            </p>
          </div>

          <form onSubmit={handleRequestOTP} className="space-y-5 text-left">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none text-sm text-charcoal-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Sending Verification Code...' : 'Send OTP Code'}
            </button>
          </form>
        </motion.div>
      )}

      {/* STEP 2: ENTER 6-DIGIT OTP */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gold-50 text-gold-600 flex items-center justify-center mx-auto mb-2 text-2xl font-bold shadow-inner">
            <FiShield className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-serif font-bold text-charcoal-900">Enter Verification Code</h2>
            <p className="text-xs text-gray-500 mt-1.5">
              Enter the 6-digit OTP code sent to <strong className="text-charcoal-900">{email}</strong>
            </p>
          </div>

          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="flex justify-center gap-2 sm:gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpInputsRef.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  className="w-11 h-13 text-center text-xl font-bold rounded-xl border-2 border-gray-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none bg-white"
                  placeholder="·"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full py-3.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Verifying OTP...' : 'Verify Code'}
            </button>
          </form>

          <div className="text-xs text-gray-500 flex items-center justify-center gap-2">
            <span>Didn&apos;t receive code?</span>
            <button
              onClick={handleResendOTP}
              disabled={resending}
              className="text-gold-600 font-bold hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50"
            >
              <FiRefreshCw size={12} className={resending ? 'animate-spin' : ''} /> Resend OTP
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 3: CREATE NEW PASSWORD */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gold-50 text-gold-600 flex items-center justify-center mx-auto mb-2 text-2xl font-bold shadow-inner">
            <FiLock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-serif font-bold text-charcoal-900">Create New Password</h2>
            <p className="text-xs text-gray-500 mt-1.5">
              Enter your new password for <strong className="text-charcoal-900">{email}</strong>
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-5 text-left">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">New Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none text-sm text-charcoal-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">Confirm New Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none text-sm text-charcoal-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </motion.div>
      )}

      {/* STEP 4: SUCCESS CONFIRMATION */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <FiCheckCircle className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-serif font-bold text-charcoal-900">Password Updated!</h2>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Your password has been changed successfully. Your old password has been invalidated.
            </p>
          </div>

          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full py-3.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
          >
            Log In With New Password <FiCheck size={16} />
          </button>
        </motion.div>
      )}

      {/* Back to Login Link */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <Link
          to="/login"
          className="text-xs text-gray-500 hover:text-gold-600 transition flex items-center gap-1 justify-center mx-auto"
        >
          <FiArrowLeft size={12} /> Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
