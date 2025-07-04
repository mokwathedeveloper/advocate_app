// Route Error Boundary for LegalPro v1.0.1 - Page-level Error Handling
import React from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from 'lucide-react';
import Button from '../ui/Button';

/**
 * RouteErrorBoundary - Handles routing errors and 404s
 */
const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError();

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReload = () => {
    window.location.reload();
  };

  // Handle different types of route errors
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            {/* 404 Illustration */}
            <div className="mb-8">
              <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100">
                <AlertTriangle className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            {/* Error Content */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Page Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleGoHome}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
              
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (error.status === 403) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600 mb-8">
              You don't have permission to access this page.
            </p>

            <div className="space-y-3">
              <Button
                onClick={handleGoHome}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
              
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (error.status >= 500) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Server Error
            </h1>
            <p className="text-gray-600 mb-8">
              Something went wrong on our end. Please try again later.
            </p>

            <div className="space-y-3">
              <Button
                onClick={handleReload}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }

  // Generic error fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-8">
          An unexpected error occurred. Please try refreshing the page.
        </p>

        {/* Error Details (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <summary className="text-sm font-medium text-red-800 cursor-pointer mb-2">
              Error Details
            </summary>
            <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto max-h-32">
              {error instanceof Error ? error.stack : String(error)}
            </pre>
          </details>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleReload}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload Page
          </Button>
          
          <Button
            onClick={handleGoHome}
            variant="outline"
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Homepage
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RouteErrorBoundary;
