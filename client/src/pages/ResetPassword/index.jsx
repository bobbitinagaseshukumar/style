import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { FiLock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../config/api';

const ResetPassword = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const password = watch('password');

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Invalid or missing token');
      return;
    }
    try {
      setLoading(true);
      await api.post('/auth/reset-password', { token, newPassword: data.password });
      toast.success('Password reset successfully');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-3xl font-playfair font-bold text-white text-center mb-6">Create New Password</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="New Password"
          type="password"
          icon={FiLock}
          className="bg-white/20 border-white/30 text-white placeholder-gray-300"
          {...register('password', { 
            required: 'Password is required',
            minLength: { value: 6, message: 'Password must be at least 6 characters' }
          })}
          error={errors.password?.message}
        />
        <Input
          label="Confirm New Password"
          type="password"
          icon={FiLock}
          className="bg-white/20 border-white/30 text-white placeholder-gray-300"
          {...register('confirmPassword', { 
            validate: value => value === password || 'Passwords do not match'
          })}
          error={errors.confirmPassword?.message}
        />
        <Button
          type="submit"
          isLoading={loading}
          className="w-full text-lg py-3"
        >
          Reset Password
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-gray-300">
        <Link to="/login" className="font-medium text-gold-400 hover:text-gold-300">
          Back to login
        </Link>
      </p>
    </div>
  );
};

export default ResetPassword;
