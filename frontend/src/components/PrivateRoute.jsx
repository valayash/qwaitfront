import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../services/authService';

// Component to protect routes that require authentication
const PrivateRoute = ({ children }) => {
  const location = useLocation();
  
  // Check if the user is authenticated
  const auth = isAuthenticated();
  
  useEffect(() => {
    console.log(`PrivateRoute check (${location.pathname}): Authentication status:`, auth ? 'Authenticated' : 'Not authenticated');
  }, [auth, location.pathname]);

  // If not authenticated, redirect to login
  if (!auth) {
    console.log(`Redirecting to login from ${location.pathname} - user not authenticated`);
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the protected component
  console.log(`Rendering protected component for ${location.pathname}`);
  return children;
};

export default PrivateRoute; 