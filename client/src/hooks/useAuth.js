import { useSelector, useDispatch } from 'react-redux';
import { loginUser, registerUser, logoutUser, verifyOTP, getMe, clearError } from '../redux/auth/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);

  return {
    ...authState,
    login: (data) => dispatch(loginUser(data)),
    register: (data) => dispatch(registerUser(data)),
    logout: () => dispatch(logoutUser()),
    verifyOTP: (data) => dispatch(verifyOTP(data)),
    getMe: () => dispatch(getMe()),
    clearError: () => dispatch(clearError()),
  };
};
