import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import SharedView from './components/SharedView.jsx'
import DashboardRoute from './components/DashboardRoute.jsx'
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
          <Route path="/share/:projectId" element={<SharedView />} />
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
