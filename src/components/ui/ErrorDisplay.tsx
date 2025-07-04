// Error Display Components for LegalPro v1.0.1 - Comprehensive Error Handling
import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Wifi, WifiOff } from 'lucide-react';
import { clsx } from 'clsx';
import Button from './Button';

// Error types
export type ErrorType = 'network' | 'validation' | 'permission' | 'notFound' | 'server' | 'generic';

// Error display props
export interface ErrorDisplayProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  error?: Error;
  onRetry?: () => void;
  onGoHome?: () => void;
  onReportBug?: () => void;
  showDetails?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  inline?: boolean;
}

// Inline error props
export interface InlineErrorProps {
  message: string;
  className?: string;
  icon?: boolean;
}

// Network status props
export interface NetworkStatusProps {
  isOnline: boolean;
  onRetry?: () => void;
  className?: string;
}

// Error configurations
const ERROR_CONFIGS = {
  network: {
    icon: WifiOff,
    title: 'Connection Error',
    message: 'Unable to connect to the server. Please check your internet connection and try again.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  validation: {
    icon: AlertTriangle,
    title: 'Validation Error',
    message: 'Please check your input and try again.',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  permission: {
    icon: AlertTriangle,
    title: 'Access Denied',
    message: 'You don\'t have permission to perform this action.',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  notFound: {
    icon: AlertTriangle,
    title: 'Not Found',
    message: 'The requested resource could not be found.',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  server: {
    icon: AlertTriangle,
    title: 'Server Error',
    message: 'An internal server error occurred. Please try again later.',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  generic: {
    icon: AlertTriangle,
    title: 'Error',
    message: 'An unexpected error occurred.',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
};

/**
 * Main Error Display component
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  type = 'generic',
  title,
  message,
  error,
  onRetry,
  onGoHome,
  onReportBug,
  showDetails = false,
  className,
  size = 'md',
  inline = false
}) => {
  const config = ERROR_CONFIGS[type];
  const Icon = config.icon;

  const displayTitle = title || config.title;
  const displayMessage = message || error?.message || config.message;

  const sizeClasses = {
    sm: inline ? 'p-3' : 'p-4',
    md: inline ? 'p-4' : 'p-6',
    lg: inline ? 'p-6' : 'p-8'
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  if (inline) {
    return (
      <div
        className={clsx(
          'rounded-md border',
          config.bgColor,
          config.borderColor,
          sizeClasses[size],
          className
        )}
        role="alert"
        aria-live="polite"
      >
        <div className="flex">
          <div className="flex-shrink-0">
            <Icon className={clsx(iconSizes[size], config.color)} aria-hidden="true" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className={clsx('text-sm font-medium', config.color)}>
              {displayTitle}
            </h3>
            <div className={clsx('mt-1 text-sm', config.color)}>
              <p>{displayMessage}</p>
            </div>
            
            {/* Actions for inline errors */}
            {(onRetry || onReportBug) && (
              <div className="mt-3 flex space-x-3">
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className={clsx(
                      'text-sm font-medium underline hover:no-underline',
                      config.color
                    )}
                  >
                    Try again
                  </button>
                )}
                {onReportBug && (
                  <button
                    onClick={onReportBug}
                    className={clsx(
                      'text-sm font-medium underline hover:no-underline',
                      config.color
                    )}
                  >
                    Report issue
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'text-center',
        sizeClasses[size],
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Error Icon */}
      <div className={clsx('mx-auto flex items-center justify-center rounded-full', config.bgColor, {
        'h-12 w-12': size === 'sm',
        'h-16 w-16': size === 'md',
        'h-20 w-20': size === 'lg'
      })}>
        <Icon className={clsx(iconSizes[size], config.color)} aria-hidden="true" />
      </div>

      {/* Error Title */}
      <h3 className={clsx('mt-4 font-semibold text-gray-900', {
        'text-lg': size === 'sm',
        'text-xl': size === 'md',
        'text-2xl': size === 'lg'
      })}>
        {displayTitle}
      </h3>

      {/* Error Message */}
      <p className={clsx('mt-2 text-gray-600', {
        'text-sm': size === 'sm',
        'text-base': size === 'md',
        'text-lg': size === 'lg'
      })}>
        {displayMessage}
      </p>

      {/* Error Details (Development only) */}
      {showDetails && error && process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-left">
          <summary className="text-sm font-medium text-gray-700 cursor-pointer">
            Error Details
          </summary>
          <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-3 rounded overflow-auto max-h-32">
            {error.stack || error.message}
          </pre>
        </details>
      )}

      {/* Action Buttons */}
      {(onRetry || onGoHome || onReportBug) && (
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <Button
              onClick={onRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          
          {onGoHome && (
            <Button
              onClick={onGoHome}
              variant="outline"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          )}
          
          {onReportBug && (
            <Button
              onClick={onReportBug}
              variant="outline"
            >
              <Bug className="w-4 h-4 mr-2" />
              Report Issue
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Inline Error component for form fields
 */
export const InlineError: React.FC<InlineErrorProps> = ({
  message,
  className,
  icon = true
}) => {
  return (
    <div
      className={clsx('flex items-center text-sm text-red-600 mt-1', className)}
      role="alert"
      aria-live="polite"
    >
      {icon && <AlertTriangle className="w-4 h-4 mr-1 flex-shrink-0" aria-hidden="true" />}
      <span>{message}</span>
    </div>
  );
};

/**
 * Network Status component
 */
export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  isOnline,
  onRetry,
  className
}) => {
  if (isOnline) return null;

  return (
    <div
      className={clsx(
        'fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center text-sm z-50',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="w-4 h-4" aria-hidden="true" />
        <span>You're offline. Check your connection.</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="underline hover:no-underline ml-2"
            aria-label="Retry connection"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Error Fallback component for error boundaries
 */
export const ErrorFallback: React.FC<{
  error: Error;
  resetError: () => void;
}> = ({ error, resetError }) => {
  return (
    <ErrorDisplay
      type="generic"
      title="Something went wrong"
      error={error}
      onRetry={resetError}
      onGoHome={() => window.location.href = '/'}
      onReportBug={() => {
        const subject = encodeURIComponent('Error Report');
        const body = encodeURIComponent(`Error: ${error.message}\n\nStack: ${error.stack}`);
        window.open(`mailto:support@legalpro.com?subject=${subject}&body=${body}`);
      }}
      showDetails={process.env.NODE_ENV === 'development'}
      size="lg"
    />
  );
};

export default ErrorDisplay;
