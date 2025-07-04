// Comprehensive Loading Components for LegalPro v1.0.1 - WCAG AA Compliant
import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

// Loading spinner props
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
  label?: string;
  showLabel?: boolean;
}

// Loading overlay props
export interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  className?: string;
  blur?: boolean;
}

// Loading button props
export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

// Size configurations
const SPINNER_SIZES = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

// Color variants
const SPINNER_VARIANTS = {
  primary: 'text-blue-600',
  secondary: 'text-gray-600',
  white: 'text-white',
  gray: 'text-gray-400'
};

/**
 * LoadingSpinner - Accessible loading spinner component
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className,
  label = 'Loading...',
  showLabel = false
}) => {
  return (
    <div 
      className={clsx('flex items-center justify-center', className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <Loader2 
        className={clsx(
          'animate-spin',
          SPINNER_SIZES[size],
          SPINNER_VARIANTS[variant]
        )}
        aria-hidden="true"
      />
      {showLabel && (
        <span className="ml-2 text-sm text-gray-600">
          {label}
        </span>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );
};

/**
 * LoadingOverlay - Overlay loading state for containers
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  message = 'Loading...',
  className,
  blur = true
}) => {
  return (
    <div className={clsx('relative', className)}>
      {children}
      
      {isLoading && (
        <div 
          className={clsx(
            'absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10',
            blur && 'backdrop-blur-sm'
          )}
          role="status"
          aria-live="polite"
          aria-label={message}
        >
          <div className="flex flex-col items-center space-y-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-600 font-medium">
              {message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * LoadingButton - Button with loading state
 */
export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  loadingText,
  children,
  variant = 'primary',
  size = 'md',
  disabled,
  className,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-blue-500',
    ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-gray-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      aria-label={isLoading ? (loadingText || 'Loading...') : undefined}
    >
      {isLoading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
      )}
      {isLoading ? (loadingText || children) : children}
    </button>
  );
};

/**
 * LoadingCard - Card with loading state
 */
export const LoadingCard: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  message?: string;
}> = ({ isLoading, children, className, message = 'Loading content...' }) => {
  if (isLoading) {
    return (
      <div 
        className={clsx(
          'bg-white rounded-lg shadow p-6 flex items-center justify-center min-h-[200px]',
          className
        )}
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        <div className="flex flex-col items-center space-y-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
};

/**
 * LoadingDots - Animated dots for inline loading
 */
export const LoadingDots: React.FC<{
  className?: string;
  dotClassName?: string;
}> = ({ className, dotClassName }) => {
  return (
    <div 
      className={clsx('flex space-x-1', className)}
      role="status"
      aria-label="Loading"
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={clsx(
            'w-2 h-2 bg-current rounded-full animate-pulse',
            dotClassName
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
};

/**
 * RefreshButton - Button with refresh animation
 */
export const RefreshButton: React.FC<{
  onClick: () => void;
  isRefreshing: boolean;
  className?: string;
  children?: React.ReactNode;
}> = ({ onClick, isRefreshing, className, children = 'Refresh' }) => {
  return (
    <button
      onClick={onClick}
      disabled={isRefreshing}
      className={clsx(
        'inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      aria-label={isRefreshing ? 'Refreshing...' : 'Refresh content'}
    >
      <RefreshCw 
        className={clsx(
          'w-4 h-4 mr-2',
          isRefreshing && 'animate-spin'
        )}
        aria-hidden="true"
      />
      {isRefreshing ? 'Refreshing...' : children}
    </button>
  );
};

export default LoadingSpinner;
