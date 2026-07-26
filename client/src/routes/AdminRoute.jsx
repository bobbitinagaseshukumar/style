import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const adminToken = localStorage.getItem('adminToken');

  // If unauthenticated or token missing, redirect to dedicated Admin Login page
  if (!isAuthenticated && !adminToken) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminRoute;
