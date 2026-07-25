import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  // TODO: REVERT THIS BEFORE PRODUCTION — bypassed for UI preview
  // if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
  //   return <Navigate to="/" replace />;
  // }

  return children;
};

export default AdminRoute;
