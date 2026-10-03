import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, useAuthProvider } from './hooks/useAuth';

import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { ProtectedRoute, AdminRoute } from './routes/ProtectedRoute';

import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Complaints } from './pages/Complaints';
import { NewComplaint } from './pages/NewComplaint';
import { ComplaintDetail } from './pages/ComplaintDetail';
import { EmailSimulator } from './pages/EmailSimulator';
import { Authorities } from './pages/Authorities';
import { Settings } from './pages/Settings';
import { Admin } from './pages/Admin';
import { AdminAuthorities } from './pages/AdminAuthorities';

export default function App() {
  const auth = useAuthProvider();

  return (
    <AuthContext.Provider value={auth}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />

        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected app */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/complaints/new" element={<NewComplaint />} />
            <Route path="/complaints/:id" element={<ComplaintDetail />} />
            <Route path="/authorities" element={<Authorities />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/dev/email-simulator" element={<EmailSimulator />} />

            {/* Admin only */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/authorities" element={<AdminAuthorities />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthContext.Provider>
  );
}
