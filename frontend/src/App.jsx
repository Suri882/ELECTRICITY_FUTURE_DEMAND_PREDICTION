import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';

// Existing Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ConsumptionPage from './pages/ConsumptionPage';
import AddConsumptionPage from './pages/AddConsumptionPage';
import PredictionsPage from './pages/PredictionsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AnomaliesPage from './pages/AnomaliesPage';
import RecommendationsPage from './pages/RecommendationsPage';
import HistoryPage from './pages/HistoryPage';
import NotificationsPage from './pages/NotificationsPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';

// New Advanced Intelligence Pages
import PeakDemandPage from './pages/PeakDemandPage';
import WeatherInsightsPage from './pages/WeatherInsightsPage';
import BillEstimatorPage from './pages/BillEstimatorPage';
import WhatIfSimulatorPage from './pages/WhatIfSimulatorPage';
import CarbonEmissionsPage from './pages/CarbonEmissionsPage';
import SettingsPage from './pages/SettingsPage';
import PlanningStudioPage from './pages/PlanningStudioPage';

import { LoadingSpinner } from './components/LoadingSpinner';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner text="Authenticating session..." />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Admin Route Guard
const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner text="Verifying administrator credentials..." />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected User Dashboard Routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Core Modules */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/planning-studio" element={<PlanningStudioPage />} />
            <Route path="/planning-studio/:projectId" element={<PlanningStudioPage />} />
            <Route path="/predictions" element={<PredictionsPage />} />
            <Route path="/peak-demand" element={<PeakDemandPage />} />
            <Route path="/weather" element={<WeatherInsightsPage />} />
            <Route path="/billing" element={<BillEstimatorPage />} />
            <Route path="/simulator" element={<WhatIfSimulatorPage />} />
            <Route path="/carbon" element={<CarbonEmissionsPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Preserved Telemetry, Operations & Admin Routes */}
            <Route path="/consumption" element={<ConsumptionPage />} />
            <Route path="/consumption/add" element={<AddConsumptionPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/anomalies" element={<AnomaliesPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Protected Admin Route */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboardPage />
                </AdminRoute>
              }
            />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
