import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NotFoundPage from './pages/NotFoundPage.tsx';
import DashboardListings from './components/DashboardListings.jsx';
import PropertyView from './components/PropertyView.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import Billing from './components/Billing.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import ResetPassword from './components/ResetPassword.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';

// Public-facing pages — TypeScript/Tailwind design from plotra-lens
const LandingPage = lazy(() => import('./pages/LandingPage.tsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.tsx'));
const RequestAccessPage = lazy(() => import('./pages/RequestAccessPage.tsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.tsx'));
const SellPropertyPage = lazy(() => import('./pages/SellPropertyPage.tsx'));
const PricingPage = lazy(() => import('./pages/PricingPage.tsx'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage.tsx'));
const LegalPage = lazy(() => import('./pages/LegalPage.tsx'));
const TeamPage = lazy(() => import('./pages/TeamPage.tsx'));
const ChatWidgetPage = lazy(() => import('./pages/ChatWidgetPage.jsx'));
const ShowcaseListingPage = lazy(() => import('./pages/ShowcaseListingPage.tsx'));
// Blog — public pages + a standalone admin (own login, not the dashboard)
const BlogPage = lazy(() => import('./pages/BlogPage.tsx'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage.tsx'));
const BlogAdminPage = lazy(() => import('./pages/BlogAdminPage.tsx'));
// SEO / AI-search pages (see src/content/)
const FaqPage = lazy(() => import('./pages/FaqPage.tsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.tsx'));
const ContentPage = lazy(() => import('./pages/ContentPage.tsx'));

// Paths of the long-form SEO pages rendered by ContentPage (src/content/pages.ts).
export const CONTENT_PAGE_PATHS = [
  '/features/whatsapp-property-listing',
  '/features/lead-management',
  '/property-dealer-software-ludhiana',
  '/property-dealer-software-mohali-kharar',
  '/plotraa-vs-property-portals',
];

/** Route table without a router — wrapped by BrowserRouter in the browser
 *  and by StaticRouter in src/entry-server.tsx (build-time prerender). */
export function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          {/* Public marketing + auth routes — new plotra-lens design */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/request-access" element={<RequestAccessPage />} />
          <Route path="/sell-property" element={<SellPropertyPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/about" element={<AboutPage />} />
          {CONTENT_PAGE_PATHS.map((p) => (
            <Route key={p} path={p} element={<ContentPage path={p} />} />
          ))}
          <Route path="/showcase/:id" element={<ShowcaseListingPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Public blog */}
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />

          {/* Blog admin — intentionally NOT behind PrivateRoute/AdminRoute and
              not linked from the dashboard: it signs in with its own
              credentials and keeps its own token (see src/lib/blog-api.ts) */}
          <Route path="/blog-admin" element={<BlogAdminPage />} />

          {/* Protected dealer dashboard — unchanged */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardListings />
              </PrivateRoute>
            }
          />
          <Route path="/dashboard/leads" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard/ops" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard/analytics" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard/settings" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard/billing"
            element={
              <PrivateRoute>
                <Billing />
              </PrivateRoute>
            }
          />
          {/* AdminRoute (not just PrivateRoute) — checks role === 'super_admin' */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />

          {/* Public property view */}
          <Route path="/p/:slug" element={<PropertyView />} />

          {/* Public web chat widget — embeddable via iframe on a tenant's
              own website, activated with the code from Settings.jsx's
              "Web Chat Widget" section */}
          <Route path="/widget" element={<ChatWidgetPage />} />

          {/* Unknown routes show a real "Page not found" page (the web
              server also returns HTTP 404 for them — see deploy/nginx) */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
