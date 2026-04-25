import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import SharedView from './components/SharedView.jsx'
import DashboardRoute from './components/DashboardRoute.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ToastProvider }   from './components/Toast.jsx'
import { ConfirmProvider } from './components/ConfirmModal.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
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
  </React.StrictMode>
)
