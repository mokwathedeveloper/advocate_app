// Navigation bar component for LegalPro v1.0.1
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Scale, 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings,
  Home,
  Calendar,
  MessageSquare,
  FileText,
  Users,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationCenter from '../notifications/NotificationCenter';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const publicNavItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/about', label: 'About', icon: User },
    { path: '/practice-areas', label: 'Practice Areas', icon: Scale },
    { path: '/areas-we-serve', label: 'Areas We Serve', icon: null },
    { path: '/resources', label: 'Resources', icon: FileText },
    { path: '/locations', label: 'Locations', icon: null },
    { path: '/contact', label: 'Contact', icon: MessageSquare },
  ];

  const clientNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/cases', label: 'My Cases', icon: FileText },
    { path: '/appointments', label: 'Appointments', icon: Calendar },
    { path: '/messages', label: 'Messages', icon: MessageSquare },
  ];

  const adminNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/cases', label: 'Cases', icon: FileText },
    { path: '/appointments', label: 'Appointments', icon: Calendar },
    { path: '/messages', label: 'Messages', icon: MessageSquare },
    { path: '/clients', label: 'Clients', icon: Users },
  ];

  const advocateNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/cases', label: 'Cases', icon: FileText },
    { path: '/appointments', label: 'Appointments', icon: Calendar },
    { path: '/messages', label: 'Messages', icon: MessageSquare },
    { path: '/clients', label: 'Clients', icon: Users },
    { path: '/admin-management', label: 'Admin Management', icon: Shield },
    { path: '/system-settings', label: 'System Settings', icon: Settings },
  ];

  const getNavItems = () => {
    if (!user) return publicNavItems;
    
    switch (user.role) {
      case 'advocate':
        return advocateNavItems;
      case 'admin':
        return adminNavItems;
      case 'client':
        return clientNavItems;
      default:
        return publicNavItems;
    }
  };

  const navItems = getNavItems();

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'advocate':
        return 'Advocate (Super Admin)';
      case 'admin':
        return 'Admin';
      case 'client':
        return 'Client';
      default:
        return role;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Scale className="h-8 w-8 text-navy-800" />
              <span className="text-xl font-bold text-navy-800">
                LegalPro
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-navy-100 text-navy-800'
                    : 'text-gray-700 hover:text-navy-800 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}

            {/* User Menu or Auth Buttons */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {/* Notification Center */}
                  <NotificationCenter />

                  <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-navy-800 focus:outline-none"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      user.role === 'advocate' ? 'bg-gold-100' : 'bg-navy-100'
                    }`}>
                      {user.role === 'advocate' ? (
                        <Scale className="h-4 w-4 text-gold-600" />
                      ) : (
                        <User className="h-4 w-4 text-navy-800" />
                      )}
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-medium">
                        {user.firstName} {user.lastName}
                      </span>
                      <div className="text-xs text-gray-500">
                        {getRoleDisplay(user.role)}
                      </div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                      >
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Profile Settings
                        </Link>
                        {user.role === 'advocate' && (
                          <Link
                            to="/admin-management"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Admin Management
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-navy-800 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-navy-800 text-white hover:bg-navy-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-navy-800 focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.path)
                      ? 'bg-navy-100 text-navy-800'
                      : 'text-gray-700 hover:text-navy-800 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              ))}

              {user ? (
                <div className="border-t pt-2 mt-2">
                  <div className="px-3 py-2 text-sm text-gray-500">
                    {user.firstName} {user.lastName}
                    <div className="text-xs">{getRoleDisplay(user.role)}</div>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-navy-800 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5" />
                    <span>Profile Settings</span>
                  </Link>
                  {user.role === 'advocate' && (
                    <Link
                      to="/admin-management"
                      className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-navy-800 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Shield className="h-5 w-5" />
                      <span>Admin Management</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-navy-800 hover:bg-gray-100"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="border-t pt-2 mt-2 space-y-1">
                  <Link
                    to="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-navy-800 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 rounded-md text-base font-medium bg-navy-800 text-white hover:bg-navy-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;