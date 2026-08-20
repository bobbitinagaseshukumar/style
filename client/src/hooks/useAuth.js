import { useSelector, useDispatch } from 'react-redux';
import { loginUser, registerUser, logoutUser, verifyOTP, getMe, clearError } from '../redux/auth/authSlice';
import { clearCartLocal, clearCartServer } from '../redux/cart/cartSlice';
import { clearWishlist } from '../redux/wishlist/wishlistSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);

  return {
    ...authState,
    login: (data) => dispatch(loginUser(data)),
    register: (data) => dispatch(registerUser(data)),
    logout: () => {
      // 1. Clear server-side cart first (while token is still valid)
      const token = localStorage.getItem('token');
      if (token) {
        dispatch(clearCartServer());
      } else {
        dispatch(clearCartLocal());
      }
      dispatch(clearWishlist());

      // 2. Dispatch Redux logout (clears auth state)
      dispatch(logoutUser());

      // 3. Nuke ALL persistence keys to prevent stale data on next login
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('persist:auth');
        localStorage.removeItem('persist:cart');
        localStorage.removeItem('persist:wishlist');
        localStorage.removeItem('styleverse_cart');
        localStorage.removeItem('styleverse_wishlist');
        // Don't clear home product cache — products are public data
      } catch (e) {}
    },
    verifyOTP: (data) => dispatch(verifyOTP(data)),
    getMe: () => dispatch(getMe()),
    clearError: () => dispatch(clearError()),
  };
};
