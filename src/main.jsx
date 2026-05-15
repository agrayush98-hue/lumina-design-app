import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import SharedView from './components/SharedView.jsx'
import DashboardRoute from './components/DashboardRoute.jsx'
import LandingPage from './pages/LandingPage.jsx'
import PricingPage from './pages/PricingPage.jsx'
import FeaturesPage from './pages/FeaturesPage.jsx'
import ContactPage            from './pages/ContactPage.jsx'
import TermsPage              from './pages/TermsPage.jsx'
import PrivacyPage            from './pages/PrivacyPage.jsx'
import RefundPage             from './pages/RefundPage.jsx'
import CancellationPage       from './pages/CancellationPage.jsx'
import FeatureDetailPage      from './pages/features/FeatureDetailPage.jsx'
import SolutionPage           from './pages/solutions/SolutionPage.jsx'
import DiaLuxAlternativePage  from './pages/compare/DiaLuxAlternativePage.jsx'
import LuxCalculatorPage      from './pages/tools/LuxCalculatorPage.jsx'
import BlogIndexPage          from './pages/blog/BlogIndexPage.jsx'
import BlogPostPage           from './pages/blog/BlogPostPage.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider }   from './components/Toast.jsx'
import { ConfirmProvider } from './components/ConfirmModal.jsx'
import './index.css'

// Global error handlers
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);

  // Check if it's a Firebase error
  if (event.reason?.code?.startsWith('firestore/') ||
      event.reason?.code?.startsWith('auth/')) {
    console.warn('Firebase error caught by global handler - connection may be unstable');
    // Prevent the error from crashing the app
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
    <BrowserRouter>
      <ToastProvider>
      <ConfirmProvider>
      <AuthProvider>
        <Routes>
          <Route path="/"                 element={<LandingPage />} />
          <Route path="/pricing"          element={<PricingPage />} />
          <Route path="/features"         element={<FeaturesPage />} />
          <Route path="/contact"          element={<ContactPage />} />
          <Route path="/terms"            element={<TermsPage />} />
          <Route path="/privacy"          element={<PrivacyPage />} />
          <Route path="/refund"           element={<RefundPage />} />
          <Route path="/cancellation"                   element={<CancellationPage />} />
          {/* Feature sub-pages */}
          <Route path="/features/:slug"               element={<FeatureDetailPage />} />
          {/* Solutions pages */}
          <Route path="/solutions/:slug"              element={<SolutionPage />} />
          {/* Comparison pages */}
          <Route path="/compare/dialux-alternative"   element={<DiaLuxAlternativePage />} />
          {/* Tool pages */}
          <Route path="/tools/lux-calculator"         element={<LuxCalculatorPage />} />
          {/* Blog */}
          <Route path="/blog"                         element={<BlogIndexPage />} />
          <Route path="/blog/:slug"                   element={<BlogPostPage />} />
          <Route path="/share/:projectId"             element={<SharedView />} />
          <Route path="/dashboard"        element={<DashboardRoute />} />
          <Route path="/app"              element={<App />} />
          <Route path="*"                 element={<App />} />
        </Routes>
      </AuthProvider>
      </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
