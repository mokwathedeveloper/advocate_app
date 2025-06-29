import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminManagement from './pages/AdminManagement';

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

            {/* Placeholder routes for future implementation */}
            <Route path="practice-areas" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Practice Areas - Coming Soon</h1></div>} />
            <Route path="resources" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Resources - Coming Soon</h1></div>} />
            <Route path="contact" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Contact - Coming Soon</h1></div>} />
            <Route path="appointments" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Appointments - Coming Soon</h1></div>} />
            <Route path="cases" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Cases - Coming Soon</h1></div>} />
            <Route path="messages" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Messages - Coming Soon</h1></div>} />
            <Route path="profile" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Profile - Coming Soon</h1></div>} />
            <Route path="clients" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Clients - Coming Soon</h1></div>} />
            <Route path="system-settings" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">System Settings - Coming Soon</h1></div>} />
            
            {/* 404 route */}
            <Route path="*" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Page Not Found</h1></div>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;