import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardListings from './components/DashboardListings.jsx';
import PropertyView from './components/PropertyView.jsx';
import Login from './components/Login.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import Settings from './components/Settings.jsx';
import LeadsInbox from './components/LeadsInbox.jsx';
import OpsPanel from './components/OpsPanel.jsx';
import Analytics from './components/Analytics.jsx';
import Billing from './components/Billing.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import RequestAccess from './components/RequestAccess.jsx';
import Pricing from './components/Pricing.jsx';
import ForgotPassword from './components/ForgotPassword.jsx';
import ResetPassword from './components/ResetPassword.jsx';
// NEW — Phase 7
import LandingPage from './components/LandingPage.jsx';

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
        <Route path="/request-access" element={<RequestAccess />} />
        <Route path="/pricing" element={<Pricing />} />
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
        <Route
          path="/dashboard/leads"
          element={
            <PrivateRoute>
              <LeadsInbox />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/ops"
          element={
            <PrivateRoute>
              <OpsPanel />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/analytics"
          element={
            <PrivateRoute>
              <Analytics />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/billing"
          element={
            <PrivateRoute>
              <Billing />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
        {/* AdminRoute (not just PrivateRoute) — AdminPanel manages tenant
            approvals, plans and billing, so this checks role === 'super_admin',
            not just "is logged in". */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />

        <Route path="/p/:slug" element={<PropertyView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
