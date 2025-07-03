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
    <nav className="bg-white dark:bg-neutral-800 shadow-lg border-b border-neutral-200 dark:border-neutral-700 relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <Scale className="h-8 w-8 text-primary-600 group-hover:text-primary-700 transition-colors" />
              <span className="text-xl font-bold text-primary-800 dark:text-primary-400 group-hover:text-primary-900 dark:group-hover:text-primary-300 transition-colors">
                LegalPro
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 shadow-sm'
                    : 'text-neutral-700 dark:text-neutral-300 hover:text-primary-700 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
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
                    className="flex items-center space-x-3 text-neutral-700 dark:text-neutral-300 hover:text-primary-700 dark:hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-800 rounded-lg p-2 transition-all duration-200"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                      user.role === 'advocate'
                        ? 'bg-secondary-100 dark:bg-secondary-900/30'
                        : 'bg-primary-100 dark:bg-primary-900/30'
                    }`}>
                      {user.role === 'advocate' ? (
                        <Scale className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                      ) : (
                        <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      )}
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {user.firstName} {user.lastName}
                      </span>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {getRoleDisplay(user.role)}
                      </div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 z-50"
                      >
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-primary-700 dark:hover:text-primary-400 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4 mr-3" />
                          Profile Settings
                        </Link>
                        {user.role === 'advocate' && (
                          <Link
                            to="/admin-management"
                            className="flex items-center px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-primary-700 dark:hover:text-primary-400 transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Shield className="h-4 w-4 mr-3" />
                            Admin Management
                          </Link>
                        )}
                        <hr className="my-2 border-neutral-200 dark:border-neutral-700" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-neutral-700 dark:text-neutral-300 hover:text-primary-700 dark:hover:text-primary-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-800"
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
              className="text-neutral-700 dark:text-neutral-300 hover:text-primary-700 dark:hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-800 p-2 rounded-lg transition-colors"
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
            className="md:hidden bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700"
          >
            <div className="px-4 pt-4 pb-3 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 shadow-sm'
                      : 'text-neutral-700 dark:text-neutral-300 hover:text-primary-700 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.icon && <item.icon className="h-5 w-5" />}
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