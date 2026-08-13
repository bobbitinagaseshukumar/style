import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminRoute = ({ children }) => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const adminToken = localStorage.getItem('adminToken');

  // Never intercept login or verify-otp pages
  if (
    location.pathname.includes('/login') ||
    location.pathname.includes('/verify-otp')
  ) {
    return children;
  }

  const isAdmin = Boolean(
    adminToken || 
    user?.role === 'ADMIN' || 
    user?.role === 'SUPER_ADMIN' ||
    (isAuthenticated && user?.isAdmin)
  );

  // If unauthenticated or non-admin, redirect to dedicated Admin Login page
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminRoute;
