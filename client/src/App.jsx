import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/common/ErrorBoundary';
import { getMe } from './redux/auth/authSlice';
import { fetchStoreSettings } from './redux/settings/settingsSlice';

const App = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (token) {
      dispatch(getMe());
    }
  }, [dispatch, token]);

  // Fetch global store settings on app boot so storeName, colors, etc. are available everywhere
  useEffect(() => {
    dispatch(fetchStoreSettings());
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
};

export default App;
