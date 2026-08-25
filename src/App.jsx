import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardListings from './components/DashboardListings.jsx';
import PropertyView from './components/PropertyView.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import Settings from './components/Settings.jsx';
import LeadsInbox from './components/LeadsInbox.jsx';
import OpsPanel from './components/OpsPanel.jsx';
import Analytics from './components/Analytics.jsx';
import Billing from './components/Billing.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import ResetPassword from './components/ResetPassword.jsx';

// Public-facing pages — TypeScript/Tailwind design from plotra-lens
const LandingPage = lazy(() => import('./pages/LandingPage.tsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.tsx'));
const RequestAccessPage = lazy(() => import('./pages/RequestAccessPage.tsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.tsx'));
const PricingPage = lazy(() => import('./pages/PricingPage.tsx'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage.tsx'));
const LegalPage = lazy(() => import('./pages/LegalPage.tsx'));
const TeamPage = lazy(() => import('./pages/TeamPage.tsx'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          {/* Public marketing + auth routes — new plotra-lens design */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/request-access" element={<RequestAccessPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected dealer dashboard — unchanged */}
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
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminPanel />
              </PrivateRoute>
            }
          />

          {/* Public property view */}
          <Route path="/p/:slug" element={<PropertyView />} />

          {/* Unauthenticated users hitting /dashboard → landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
