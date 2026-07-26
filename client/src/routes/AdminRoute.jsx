import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const adminToken = localStorage.getItem('adminToken');

  // Never intercept login or verify-otp pages
  if (
    location.pathname.includes('/login') ||
    location.pathname.includes('/verify-otp')
  ) {
    return children;
  }

  // If unauthenticated or token missing, redirect to dedicated Admin Login page
  if (!isAuthenticated && !adminToken) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminRoute;
