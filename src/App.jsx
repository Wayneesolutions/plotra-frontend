import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardListings from './components/DashboardListings.jsx';
import PropertyView from './components/PropertyView.jsx';
import Login from './components/Login.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import RequestAccess from './components/RequestAccess.jsx';
// NEW — Phase 7
import LandingPage from './components/LandingPage.jsx';
// NEW — gap #4: password reset flow
import ForgotPassword from './components/ForgotPassword.jsx';
import ResetPassword from './components/ResetPassword.jsx';
// NEW — internal ops panel (leads/WhatsApp inbox, documents, AI calls, site visits)
import OpsPanel from './components/OpsPanel.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* NEW — public marketing homepage, was previously an unconditional
            redirect to /dashboard (which just bounced to /login for anyone
            not signed in). Investors/prospects landing on the bare domain
            now see an actual product page. */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardListings />
            </PrivateRoute>
          }
        />
        <Route path="/p/:slug" element={<PropertyView />} />
        <Route
          path="/dashboard/ops"
          element={
            <PrivateRoute>
              <OpsPanel />
            </PrivateRoute>
          }
        />
        <Route path="/request-access" element={<RequestAccess />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
