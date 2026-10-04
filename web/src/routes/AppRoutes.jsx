import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/Login';
import Terms from '../pages/Terms';
import Privacy from '../pages/Privacy';
import AdminLayout from '../components/AdminLayout';
import AdminDashboard from '../pages/AdminDashboard';
import ClientsPage from '../pages/ClientsPage';
import SupervisorsPage from '../pages/SupervisorsPage';
import PostsPage from '../pages/PostsPage';
import PayrollPage from '../pages/PayrollPage';
import BillingPage from '../pages/BillingPage';
import GuardsPage from '../pages/GuardsPage';
import LocationsPage from '../pages/LocationsPage';
import SchedulesPage from '../pages/SchedulesPage';
import ReportsPage from '../pages/ReportsPage';
import SupervisorLayout from '../components/SupervisorLayout';
import LiveMapPage from '../pages/LiveMapPage';
import IncidentsPage from '../pages/IncidentsPage';
import PanicPage from '../pages/PanicPage';
import RequestsPage from '../pages/RequestsPage';
import AvailabilityPage from '../pages/AvailabilityPage';

function ProtectedRoute({ children, allowedRole }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-sm text-text-muted">Loading authentication state...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user?.role === 'SUPERVISOR') return <Navigate to="/supervisor/live" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function AppRoutes() {
  const { user, isAuthenticated, loading } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="supervisors" element={<SupervisorsPage />} />
        <Route path="guards" element={<GuardsPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="posts" element={<PostsPage />} />
        <Route path="schedules" element={<SchedulesPage />} />
        <Route path="payroll" element={<PayrollPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      {/* Supervisor Routes */}
      <Route
        path="/supervisor"
        element={
          <ProtectedRoute allowedRole="SUPERVISOR">
            <SupervisorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="live" replace />} />
        <Route path="live" element={<LiveMapPage />} />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="panic" element={<PanicPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="availability" element={<AvailabilityPage />} />
      </Route>

      {/* Root Redirection */}
      <Route
        path="/"
        element={
          loading ? (
            <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="text-sm text-text-muted">Loading...</div>
            </div>
          ) : isAuthenticated ? (
            user?.role === 'ADMIN' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/supervisor/live" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
