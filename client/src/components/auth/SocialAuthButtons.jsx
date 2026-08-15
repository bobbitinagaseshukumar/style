import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../config/api';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../../firebase';

/**
 * Reusable Modular Social Authentication Component
 * Firebase Google Sign-In → Backend Account Check → Login or Register redirect
 */
const SocialAuthButtons = ({ mode = 'login', onSuccess }) => {
  const [loadingProvider, setLoadingProvider] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoadingProvider('google');
    try {
      // Step 1: Firebase Google popup authentication
      const result = await signInWithGoogle();
      const firebaseUser = result.user;

      // Step 2: Get the Firebase ID token for server-side verification
      const idToken = await firebaseUser.getIdToken();

      console.log('[GOOGLE AUTH] Firebase authenticated:', firebaseUser.email);

      // Step 3: Send ID token to backend for account check
      const response = await api.post('/auth/google', {
        idToken,
        uid: firebaseUser.uid,
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        photo: firebaseUser.photoURL,
      });

      const data = response.data;
      console.log('[GOOGLE AUTH] Backend response:', data);

      if (data.status === 'LOGIN_SUCCESS' && data.token) {
        // Existing account — login directly
        dispatch(setCredentials({ user: data.user, token: data.token }));
        localStorage.setItem('token', data.token);
        toast.success(`Welcome back ${data.user.fullName || data.user.name}!`);
        const targetPath = data.user?.role === 'ADMIN' || data.user?.role === 'SUPER_ADMIN' ? '/admin/dashboard' : '/';
        navigate(targetPath, { replace: true });
        if (onSuccess) onSuccess();
      } else if (data.status === 'ACCOUNT_NOT_FOUND') {
        // New Google user — redirect to registration with Google profile
        toast.info('Please complete your account details to continue.');
        // Store Google profile temporarily for the registration page
        sessionStorage.setItem('googleProfile', JSON.stringify(data.googleProfile));
        navigate('/register?google=true');
      } else {
        toast.error('Unexpected response from server. Please try again.');
      }
    } catch (error) {
      console.error('[GOOGLE AUTH ERROR]:', error);
      // Handle popup closed by user
      if (
        error?.code === 'auth/popup-closed-by-user' ||
        error?.message?.includes('popup-closed-by-user')
      ) {
        return; // Silent — user intentionally closed
      }
      toast.error(
        error.response?.data?.message ||
        error.message ||
        'Google login failed. Please try again.'
      );
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleGithubLogin = async () => {
    setLoadingProvider('github');
    try {
      toast.info('GitHub login coming soon!');
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3 w-full">
      <div className="relative flex items-center justify-center my-4">
        <div className="border-t border-white/10 w-full" />
        <span className="bg-[#0D0D0D] px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest absolute">
          Or {mode === 'register' ? 'Sign Up' : 'Continue'} with
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Google Sign-In */}
        <motion.button
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          type="button"
          disabled={!!loadingProvider}
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
            />
          </svg>
          <span>{loadingProvider === 'google' ? 'Connecting...' : 'Google'}</span>
        </motion.button>

        {/* GitHub Sign-In */}
        <motion.button
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          type="button"
          disabled={!!loadingProvider}
          onClick={handleGithubLogin}
          className="flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>{loadingProvider === 'github' ? 'Connecting...' : 'GitHub'}</span>
        </motion.button>
      </div>
    </div>
  );
};

export default SocialAuthButtons;
