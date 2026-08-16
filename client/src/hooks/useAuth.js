import { useSelector, useDispatch } from 'react-redux';
import { loginUser, registerUser, logoutUser, verifyOTP, getMe, clearError } from '../redux/auth/authSlice';
import { clearCartLocal } from '../redux/cart/cartSlice';
import { clearWishlist } from '../redux/wishlist/wishlistSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);

  return {
    ...authState,
    login: (data) => dispatch(loginUser(data)),
    register: (data) => dispatch(registerUser(data)),
    logout: () => {
      dispatch(logoutUser());
      dispatch(clearCartLocal());
      dispatch(clearWishlist());
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('persist:auth');
        localStorage.removeItem('__KVLR_HOME_PERSISTENT_CACHE_V3__');
        if (typeof window !== 'undefined') sessionStorage.clear();
      } catch (e) {}
    },
    verifyOTP: (data) => dispatch(verifyOTP(data)),
    getMe: () => dispatch(getMe()),
    clearError: () => dispatch(clearError()),
  };
};
