import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/common/ErrorBoundary';
import { getMe } from './redux/auth/authSlice';
import { fetchStoreSettings } from './redux/settings/settingsSlice';
import { fetchServerCart } from './redux/cart/cartSlice';
import { fetchServerWishlist } from './redux/wishlist/wishlistSlice';

const App = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (token) {
      dispatch(getMe());
      dispatch(fetchServerCart());
      dispatch(fetchServerWishlist());
    }
  }, [dispatch, token]);

  const { storeSettings } = useSelector((state) => state.settings || {});

  // Fetch global store settings on app boot and sync dynamically
  useEffect(() => {
    dispatch(fetchStoreSettings());

    const handleSettingsUpdate = () => {
      dispatch(fetchStoreSettings());
    };

    window.addEventListener('settings_updated', handleSettingsUpdate);
    window.addEventListener('kvlr:content-updated', handleSettingsUpdate);

    // Pre-warm live backend instance in background
    try {
      fetch('https://style-q21b.onrender.com/api/v1/health', { mode: 'no-cors' }).catch(() => {});
    } catch (e) {}

    return () => {
      window.removeEventListener('settings_updated', handleSettingsUpdate);
      window.removeEventListener('kvlr:content-updated', handleSettingsUpdate);
    };
  }, [dispatch]);

  // Synchronize document title, meta tags, and custom SEO tags when storeSettings update
  useEffect(() => {
    if (storeSettings?.metaTitle) {
      document.title = storeSettings.metaTitle;
    } else if (storeSettings?.storeName) {
      document.title = `${storeSettings.storeName} | Luxury Fashion & Jewellery`;
    }

    // Dynamic Meta Description
    if (storeSettings?.metaDescription) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = storeSettings.metaDescription;
    }

    // Dynamic Meta Keywords
    if (storeSettings?.metaKeywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.name = 'keywords';
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.content = storeSettings.metaKeywords;
    }

    // Dynamic Custom SEO Tags
    if (storeSettings?.customSeoTags) {
      try {
        const tags = typeof storeSettings.customSeoTags === 'string'
          ? JSON.parse(storeSettings.customSeoTags)
          : storeSettings.customSeoTags;
        if (Array.isArray(tags)) {
          // Remove previously injected custom tags
          document.querySelectorAll('[data-kvlr-custom-seo]').forEach(el => el.remove());

          tags.filter(t => t.enabled).forEach(tag => {
            const meta = document.createElement('meta');
            meta.setAttribute(tag.type || 'name', tag.key);
            meta.content = tag.value;
            meta.setAttribute('data-kvlr-custom-seo', 'true');
            document.head.appendChild(meta);
          });
        }
      } catch (e) {}
    }
  }, [storeSettings]);

  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
};

export default App;
