import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiPhone, FiCheck, FiArrowRight } from 'react-icons/fi';
import api from '../../config/api';
import { toast } from 'react-toastify';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: 'Women',
    terms: true,
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Password rules validation
  const hasLength = formData.password.length >= 8;
  const hasUpper = /[A-Z]/.test(formData.password);
  const hasLower = /[a-z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const hasSpecial = /[@$!%*?&]/.test(formData.password);

  const passwordValid = hasLength && hasUpper && hasLower && hasNumber && hasSpecial;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!passwordValid) {
      toast.error('Password does not meet security requirements');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!formData.terms) {
      toast.error('Please accept the Terms & Conditions');
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post('/auth/register', formData);
      toast.success(data.message || 'Registration successful! Please verify OTP.');
      navigate('/verify-otp', { state: { email: formData.email, userId: data.data?.userId } });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-100 my-8">
      <div className="text-center mb-6">
        <span className="text-3xl font-serif font-bold text-gold-600 block mb-1">StyleVerse</span>
        <h2 className="text-2xl font-serif font-bold text-charcoal-900">Create Your Account</h2>
        <p className="text-xs text-gray-500 mt-1">Join StyleVerse for luxury shopping and exclusive perks</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
          <div className="relative">
            <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Priya Sharma"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold-500 text-sm focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address *</label>
          <div className="relative">
            <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="priya@example.com"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold-500 text-sm focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
          <div className="relative">
            <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold-500 text-sm focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Password *</label>
          <div className="relative">
            <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold-500 text-sm focus:outline-none"
            />
          </div>

          {/* Password Strength Checks */}
          <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-gray-500">
            <span className={hasLength ? 'text-emerald-600 font-semibold' : ''}>• Min 8 chars</span>
            <span className={hasUpper ? 'text-emerald-600 font-semibold' : ''}>• Uppercase</span>
            <span className={hasLower ? 'text-emerald-600 font-semibold' : ''}>• Lowercase</span>
            <span className={hasNumber ? 'text-emerald-600 font-semibold' : ''}>• Number</span>
            <span className={hasSpecial ? 'text-emerald-600 font-semibold' : ''}>• Special (@$!%*?&)</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password *</label>
          <div className="relative">
            <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold-500 text-sm focus:outline-none"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer pt-1">
          <input
            type="checkbox"
            name="terms"
            checked={formData.terms}
            onChange={handleChange}
            className="rounded text-gold-500 focus:ring-gold-500"
          />
          I agree to the <Link to="/terms" className="text-gold-600 font-semibold hover:underline">Terms & Conditions</Link> and <Link to="/privacy-policy" className="text-gold-600 font-semibold hover:underline">Privacy Policy</Link>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-full bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Continue to Email OTP Verification'}
          <FiArrowRight />
        </button>
      </form>

      <div className="text-center mt-6 text-xs text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-gold-600 font-bold hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default Register;
