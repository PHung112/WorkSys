import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  if (currentUser.systemRole !== 'SYSTEM_ADMIN') {
    return <Navigate to="/projects" replace />;
  }

  return children;
};

export default AdminRoute;
