import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * Resets window scroll position to (0, 0) smoothly on every route change.
 */
const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Scroll to top of window when pathname or query parameters change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });

    // Clean up any lingering body scroll locks from mobile drawers or modals
    document.body.style.overflow = '';
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
