import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiCheckCircle, FiArrowRight, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-toastify';

/**
 * Reusable Email Verification Placeholder Component
 * Ready for Firebase Email Verification & Nodemailer link integration
 */
const VerifyEmail = () => {
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    setTimeout(() => {
      setResending(false);
      toast.success('Verification link resent to your email address!');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#0D0D0D]/90 border border-gold-500/20 backdrop-blur-2xl rounded-3xl p-8 text-center shadow-[0_8px_40px_rgba(0,0,0,0.8)] relative z-10"
      >
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-6 shadow-inner">
          <FiMail className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Please Verify Your Email</h2>
        <p className="text-xs text-gray-400 leading-relaxed mb-6">
          We have sent a verification link to your registered email address. Please check your inbox and click the link to activate your account.
        </p>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-gray-300 space-y-2 mb-6">
          <div className="flex items-center justify-center gap-2 text-amber-400 font-bold">
            <FiCheckCircle className="w-4 h-4" />
            <span>Firebase & Nodemailer Ready</span>
          </div>
          <p className="text-[11px] text-gray-400">
            Didn't receive the email? Check your spam folder or resend below.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black font-bold text-xs uppercase tracking-wider hover:from-amber-400 transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {resending ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiMail className="w-4 h-4" />}
            <span>Resend Verification Email</span>
          </button>

          <Link
            to="/login"
            className="block w-full py-2.5 rounded-xl border border-white/10 text-gray-300 text-xs font-semibold hover:bg-white/5 transition"
          >
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
