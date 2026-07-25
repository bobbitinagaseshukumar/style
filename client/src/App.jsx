import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AppRoutes from './routes/AppRoutes';
import { getMe } from './redux/auth/authSlice';
import api from './config/api';
// Normally we'd dispatch fetchStoreSettings, fetchCategories here.
// For now, doing it directly in App.jsx to ensure layout data exists.

const App = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (token) {
      dispatch(getMe());
    }
  }, [dispatch, token]);

  useEffect(() => {
    // We would fetch settings/categories here
    // Example: dispatch(fetchStoreSettings())
    // Example: dispatch(fetchCategories())
  }, [dispatch]);

  return <AppRoutes />;
};

export default App;
