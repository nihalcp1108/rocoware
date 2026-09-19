import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

import { LoginPage } from './pages/LoginPage';
import { RegisteredComplaintsPage } from './pages/RegisteredComplaintsPage';
import { CompletedComplaintsPage } from './pages/CompletedComplaintsPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            borderRadius: '16px',
            padding: '14px 18px',
            fontSize: '13px',
            fontFamily: 'inherit',
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root Redirect to app */}
          <Route path="/" element={<Navigate to="/app/complaints" replace />} />

          {/* Protected Application Workspace */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/complaints" replace />} />
            <Route path="complaints" element={<RegisteredComplaintsPage />} />
            <Route path="completed" element={<CompletedComplaintsPage />} />
            <Route path="profile" element={<ProfileSettingsPage />} />
          </Route>

          {/* 404 Handler */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
