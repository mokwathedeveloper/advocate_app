// Enhanced Main App component for LegalPro v1.0.1 - Production Ready
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AccessibilityProvider } from './components/ui/AccessibilityProvider';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import AsyncErrorBoundary from './components/ErrorBoundary/AsyncErrorBoundary';
import MobileNavigation from './components/ui/MobileNavigation';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdvocateRegister from './pages/auth/AdvocateRegister';
import AdminManagement from './pages/AdminManagement';
import PracticeAreas from './pages/PracticeAreas';
import Contact from './pages/Contact';
import AreasWeServe from './pages/AreasWeServe';
import Resources from './pages/Resources';
import Locations from './pages/Locations';
import NotFound from './pages/NotFound';
import Cases from './pages/Cases';
import AppointmentDashboard from './pages/appointments/AppointmentDashboard';
import Messages from './pages/Messages';
import WhatsAppWidget from './components/whatsapp/WhatsAppWidget';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-navy-800"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-navy-800"></div>
      </div>
    );
  }

  return !user ? <>{children}</> : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            
            {/* Auth routes */}
            <Route
              path="login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="advocate-register"
              element={
                <PublicRoute>
                  <AdvocateRegister />
                </PublicRoute>
              }
            />

            {/* Protected routes */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Advocate-only routes */}
            <Route
              path="admin-management"
              element={
                <ProtectedRoute allowedRoles={['advocate']}>
                  <AdminManagement />
                </ProtectedRoute>
              }
            />

            {/* Public pages */}
            <Route path="practice-areas" element={<PracticeAreas />} />
            <Route path="resources" element={<Resources />} />
            <Route path="contact" element={<Contact />} />
            <Route path="areas-we-serve" element={<AreasWeServe />} />
            <Route path="locations" element={<Locations />} />

            {/* Protected routes */}
            <Route
              path="appointments"
              element={
                <ProtectedRoute>
                  <AppointmentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="cases"
              element={
                <ProtectedRoute>
                  <Cases />
                </ProtectedRoute>
              }
            />
            <Route
              path="messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />

            {/* Placeholder routes for future implementation */}
            <Route path="profile" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Profile - Coming Soon</h1></div>} />
            <Route path="clients" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Clients - Coming Soon</h1></div>} />
            <Route path="system-settings" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">System Settings - Coming Soon</h1></div>} />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
            
            {/* 404 route */}
            <Route path="*" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Page Not Found</h1></div>} />
          </Route>
        </Routes>

        {/* WhatsApp Widget - Available on all pages */}
        <WhatsAppWidget
          phoneNumber="254726745739"
          message="Hello! I need legal assistance from LegalPro."
          position="bottom-right"
        />
      </Router>
    </AuthProvider>
  );
}

export default App;