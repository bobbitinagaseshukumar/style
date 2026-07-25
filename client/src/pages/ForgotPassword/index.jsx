import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { FiMail } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../config/api';

const ForgotPassword = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await api.post('/auth/forgot-password', data);
      setIsSent(true);
      toast.success('Password reset link sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-3xl font-playfair font-bold text-white text-center mb-4">Reset Password</h2>
      
      {!isSent ? (
        <>
          <p className="text-sm text-gray-300 text-center mb-8">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              icon={FiMail}
              className="bg-white/20 border-white/30 text-white placeholder-gray-300"
              {...register('email', { required: 'Email is required' })}
              error={errors.email?.message}
            />
            <Button
              type="submit"
              isLoading={loading}
              className="w-full text-lg py-3"
            >
              Send Reset Link
            </Button>
          </form>
        </>
      ) : (
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiMail className="w-8 h-8" />
          </div>
          <p className="text-white mb-6">We've sent a password reset link to your email. Please check your inbox.</p>
          <Button onClick={() => setIsSent(false)} variant="outline" className="text-white border-white hover:bg-white/10">
            Try another email
          </Button>
        </div>
      )}

      <p className="mt-8 text-center text-sm text-gray-300">
        Remember your password?{' '}
        <Link to="/login" className="font-medium text-gold-400 hover:text-gold-300">
          Back to login
        </Link>
      </p>
    </div>
  );
};

export default ForgotPassword;
