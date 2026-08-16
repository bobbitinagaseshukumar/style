import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../config/api';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../../redux/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import {
  signInWithGoogle,
  signInWithApple,
  signInWithFacebook,
  signInWithGithub,
} from '../../firebase';
import { FaGoogle, FaApple, FaFacebook, FaGithub, FaTwitter } from 'react-icons/fa';
import { FiGlobe } from 'react-icons/fi';

/**
 * Reusable Modular Dynamic Social Authentication Component
 * Dynamically queries admin social login settings (Google, Apple, Facebook, GitHub, Twitter, Custom)
 */
const SocialAuthButtons = ({ mode = 'login', onSuccess }) => {
  const [loadingProvider, setLoadingProvider] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { authSettings: reduxAuthSettings } = useSelector((state) => state.auth || {});
  const [socialSettings, setSocialSettings] = useState({
    google: true,
    apple: true,
    facebook: false,
    github: false,
    twitter: false,
  });

  const fetchSocialConfig = async () => {
    try {
      const { data } = await api.get('/auth/settings/public');
      if (data?.data?.socialLogins) {
        const parsed = typeof data.data.socialLogins === 'string'
          ? JSON.parse(data.data.socialLogins)
          : data.data.socialLogins;
        if (parsed && typeof parsed === 'object') {
          setSocialSettings(parsed);
        }
      }
    } catch (err) {
      if (reduxAuthSettings?.socialLogins) {
        try {
          const parsed = typeof reduxAuthSettings.socialLogins === 'string'
            ? JSON.parse(reduxAuthSettings.socialLogins)
            : reduxAuthSettings.socialLogins;
          if (parsed && typeof parsed === 'object') setSocialSettings(parsed);
        } catch (e) {}
      }
    }
  };

  useEffect(() => {
    fetchSocialConfig();

    const handleSync = () => fetchSocialConfig();
    window.addEventListener('auth_settings_updated', handleSync);
    window.addEventListener('settings_updated', handleSync);
    window.addEventListener('kvlr:content-updated', handleSync);

    return () => {
      window.removeEventListener('auth_settings_updated', handleSync);
      window.removeEventListener('settings_updated', handleSync);
      window.removeEventListener('kvlr:content-updated', handleSync);
    };
  }, []);

  const handleProviderAuth = async (providerName, signInFn) => {
    setLoadingProvider(providerName);
    try {
      const result = await signInFn();
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      const response = await api.post('/auth/google', {
        idToken,
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || `${providerName.charAt(0).toUpperCase() + providerName.slice(1)} User`,
        email: firebaseUser.email,
        photo: firebaseUser.photoURL,
        provider: providerName,
      });

      const data = response.data;

      if (data.status === 'LOGIN_SUCCESS' && data.token) {
        dispatch(setCredentials({ user: data.user, token: data.token }));
        localStorage.setItem('token', data.token);
        toast.success(`Welcome back ${data.user.fullName || data.user.name || 'Valued Member'}! ✨`);
        const targetPath = data.user?.role === 'ADMIN' || data.user?.role === 'SUPER_ADMIN' ? '/admin/dashboard' : '/';
        navigate(targetPath, { replace: true });
        if (onSuccess) onSuccess();
      } else if (data.status === 'ACCOUNT_NOT_FOUND') {
        toast.info('Please complete your account details to continue.');
        sessionStorage.setItem('googleProfile', JSON.stringify(data.googleProfile || {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          photo: firebaseUser.photoURL,
        }));
        navigate('/register?google=true');
      } else {
        toast.error('Unexpected response from server. Please try again.');
      }
    } catch (error) {
      console.error(`[${providerName.toUpperCase()} AUTH ERROR]:`, error);
      const code = error?.code || '';
      const msg = error?.message || '';

      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        msg.includes('popup-closed-by-user') ||
        msg.includes('cancelled-popup-request')
      ) {
        return;
      }

      if (code === 'auth/popup-blocked' || msg.includes('popup-blocked')) {
        toast.warn(`${providerName.charAt(0).toUpperCase() + providerName.slice(1)} popup was blocked by browser. Please allow popups.`);
        return;
      }

      toast.error(error.response?.data?.message || msg || `${providerName} sign-in failed. Please try again.`);
    } finally {
      setLoadingProvider(null);
    }
  };

  // Check which providers are enabled
  const activeProviders = [];

  if (socialSettings.google !== false) {
    activeProviders.push({
      key: 'google',
      label: 'Google',
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
          <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z" />
          <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
        </svg>
      ),
      action: () => handleProviderAuth('google', signInWithGoogle),
    });
  }

  if (socialSettings.apple) {
    activeProviders.push({
      key: 'apple',
      label: 'Apple',
      icon: (
        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 170 170">
          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.19-9.5-11.05-20.48-14.58-32.94-3.53-12.46-5.3-24.32-5.3-35.58 0-14.18 3.58-26.06 10.74-35.65 7.16-9.58 16.03-14.49 26.6-14.73 4.8-.13 10.15 1.22 16.06 4.04 5.91 2.83 9.78 4.3 11.62 4.41 1.5.12 5.64-1.41 12.43-4.59 6.78-3.18 12.63-4.52 17.55-4.04 13.51.98 24.18 6.03 32.01 15.15-11.75 7.12-17.51 16.89-17.27 29.31.24 9.87 4.03 18.06 11.36 24.56 7.33 6.5 15.89 10.22 25.68 11.16-2.12 6.64-4.73 13.43-7.83 20.37zM119.22 33.09c0-7.39 2.68-14.28 8.04-20.67 5.36-6.39 12.01-10.47 19.95-12.24.24 1.13.36 2.19.36 3.18 0 7.39-2.79 14.42-8.37 21.09-5.58 6.67-12.37 10.79-20.37 12.35-.12-1.07-.18-2.07-.18-3.01z" />
        </svg>
      ),
      action: () => handleProviderAuth('apple', signInWithApple),
    });
  }

  if (socialSettings.facebook) {
    activeProviders.push({
      key: 'facebook',
      label: 'Facebook',
      icon: <FaFacebook className="w-4 h-4 text-blue-500 shrink-0" />,
      action: () => handleProviderAuth('facebook', signInWithFacebook),
    });
  }

  if (socialSettings.github) {
    activeProviders.push({
      key: 'github',
      label: 'GitHub',
      icon: <FaGithub className="w-4 h-4 shrink-0" />,
      action: () => handleProviderAuth('github', signInWithGithub),
    });
  }

  if (socialSettings.twitter) {
    activeProviders.push({
      key: 'twitter',
      label: 'Twitter',
      icon: <FaTwitter className="w-4 h-4 text-sky-400 shrink-0" />,
      action: () => toast.info('Twitter sign-in coming soon!'),
    });
  }

  // Custom Social SSO providers
  if (Array.isArray(socialSettings._custom)) {
    socialSettings._custom.filter(c => c && socialSettings[c.key]).forEach((cust) => {
      activeProviders.push({
        key: cust.key,
        label: cust.label,
        icon: <FiGlobe className="w-4 h-4 text-amber-400 shrink-0" />,
        action: () => toast.info(`${cust.label} Single Sign-On coming soon!`),
      });
    });
  }

  if (activeProviders.length === 0) return null;

  return (
    <div className="space-y-3 w-full">
      <div className="relative flex items-center justify-center my-4">
        <div className="border-t border-white/10 w-full" />
        <span className="bg-[#0D0D0D] px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest absolute">
          Or {mode === 'register' ? 'Sign Up' : 'Continue'} with
        </span>
      </div>

      <div className={`grid gap-3 ${activeProviders.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {activeProviders.map((provider) => (
          <motion.button
            key={provider.key}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            type="button"
            disabled={!!loadingProvider}
            onClick={provider.action}
            className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {provider.icon}
            <span>{loadingProvider === provider.key ? 'Connecting...' : provider.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default SocialAuthButtons;
