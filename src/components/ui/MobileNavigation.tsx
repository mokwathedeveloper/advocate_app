// Mobile Navigation Component for LegalPro v1.0.1 - Touch-Optimized Navigation
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Home, 
  FileText, 
  Calendar, 
  MessageSquare, 
  User, 
  Settings,
  LogOut,
  ChevronRight,
  Bell
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import Button from './Button';

// Navigation item interface
interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  requiresAuth?: boolean;
  roles?: string[];
}

// Mobile navigation props
interface MobileNavigationProps {
  className?: string;
}

// Navigation items configuration
const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    requiresAuth: true
  },
  {
    label: 'Cases',
    href: '/cases',
    icon: FileText,
    requiresAuth: true
  },
  {
    label: 'Appointments',
    href: '/appointments',
    icon: Calendar,
    requiresAuth: true
  },
  {
    label: 'Messages',
    href: '/messages',
    icon: MessageSquare,
    requiresAuth: true,
    badge: 3 // Example badge count
  },
  {
    label: 'Admin',
    href: '/admin-management',
    icon: Settings,
    requiresAuth: true,
    roles: ['advocate']
  }
];

/**
 * Mobile Navigation Component with drawer and bottom navigation
 */
export const MobileNavigation: React.FC<MobileNavigationProps> = ({ className }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const { user, logout } = useAuth();
  const location = useLocation();

  // Hide/show bottom navigation on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowBottomNav(false);
      } else {
        setShowBottomNav(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Close drawer on route change
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  // Filter navigation items based on user permissions
  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (!item.requiresAuth) return true;
    if (!user) return false;
    if (item.roles && !item.roles.includes(user.role)) return false;
    return true;
  });

  const handleLogout = async () => {
    try {
      await logout();
      setIsDrawerOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const isActiveRoute = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile Header */}
      <header className={clsx('md:hidden bg-white border-b border-gray-200 safe-area-top', className)}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Menu Button */}
          <button
            onClick={toggleDrawer}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-blue-600">LegalPro</span>
          </Link>

          {/* Notifications */}
          <button
            className="p-2 -mr-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors relative"
            aria-label="View notifications"
          >
            <Bell className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              2
            </span>
          </button>
        </div>
      </header>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Navigation Drawer */}
      <nav
        className={clsx(
          'fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden',
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 safe-area-top">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {user?.firstName?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
                </p>
                <p className="text-sm text-gray-500 capitalize">
                  {user?.role || 'Not logged in'}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href);
                
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={clsx(
                        'flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={clsx('w-5 h-5', isActive ? 'text-blue-600' : 'text-gray-400')} />
                        <span>{item.label}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {item.badge && item.badge > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Drawer Footer */}
          <div className="border-t border-gray-200 p-4 safe-area-bottom">
            {user ? (
              <div className="space-y-3">
                <Link
                  to="/profile"
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium">Profile Settings</span>
                </Link>
                
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link to="/login">
                  <Button className="w-full">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button variant="outline" className="w-full">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Bottom Navigation */}
      {user && (
        <nav
          className={clsx(
            'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden safe-area-bottom z-30 transition-transform duration-300',
            showBottomNav ? 'translate-y-0' : 'translate-y-full'
          )}
          aria-label="Bottom navigation"
        >
          <div className="flex items-center justify-around py-2">
            {filteredNavItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={clsx(
                    'flex flex-col items-center justify-center px-3 py-2 min-w-[60px] relative transition-colors',
                    isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  )}
                  aria-label={item.label}
                >
                  <Icon className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">{item.label}</span>
                  
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                  
                  {isActive && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
};

export default MobileNavigation;
