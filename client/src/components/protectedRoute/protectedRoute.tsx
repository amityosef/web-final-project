import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as strings from './strings';
import * as types from './types';
import * as consts from './consts';

const ProtectedRoute: React.FC<types.ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={strings.loginRoute} replace={consts.replaceNavigation} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
