import React from 'react';
import { Navigate } from 'react-router-dom';

export default function AdminRoute({ children }) {
  const token   = localStorage.getItem('pve_token');
  const userStr = localStorage.getItem('pve_user');

  if (!token || !userStr) return <Navigate to="/login" replace />;

  try {
    const user = JSON.parse(userStr);
    if (user.role !== 'super_admin') return <Navigate to="/dashboard" replace />;
  } catch {
    return <Navigate to="/login" replace />;
  }

  return children;
}
