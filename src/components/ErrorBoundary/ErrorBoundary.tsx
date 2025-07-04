// Comprehensive Error Boundary for LegalPro v1.0.1 - Production Error Handling
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from 'lucide-react';
import Button from '../ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to monitoring service (e.g., Sentry, LogRocket)
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In production, send to error monitoring service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      level: this.props.level || 'component'
    };

    // Example: Send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Replace with your error monitoring service
      console.log('Error reported:', errorReport);
      
      // Example API call to error reporting service
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      }).catch(err => console.error('Failed to report error:', err));
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: ''
      });
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const subject = encodeURIComponent(`Bug Report - ${this.state.errorId}`);
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
Error Message: ${this.state.error?.message}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:

`);
    window.open(`mailto:support@legalpro.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { level = 'component' } = this.props;
      const canRetry = this.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            {/* Error Icon */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>

            {/* Error Title */}
            <h1 className="text-lg font-semibold text-gray-900 mb-2">
              {level === 'critical' ? 'Critical Error' : 'Something went wrong'}
            </h1>

            {/* Error Description */}
            <p className="text-sm text-gray-600 mb-6">
              {level === 'critical' 
                ? 'A critical error has occurred. Please contact support immediately.'
                : level === 'page'
                ? 'This page encountered an error. You can try refreshing or go back to the home page.'
                : 'A component failed to load properly. You can try again or refresh the page.'
              }
            </p>

            {/* Error ID */}
            <div className="bg-gray-100 rounded-md p-3 mb-6">
              <p className="text-xs text-gray-500 mb-1">Error ID</p>
              <p className="text-sm font-mono text-gray-700">{this.state.errorId}</p>
            </div>

            {/* Error Details (Development only) */}
            {this.props.showDetails && process.env.NODE_ENV === 'development' && (
              <details className="text-left mb-6">
                <summary className="text-sm font-medium text-gray-700 cursor-pointer mb-2">
                  Error Details
                </summary>
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-xs font-semibold text-red-800 mb-1">Error:</p>
                  <p className="text-xs text-red-700 mb-2">{this.state.error?.message}</p>
                  
                  {this.state.error?.stack && (
                    <>
                      <p className="text-xs font-semibold text-red-800 mb-1">Stack Trace:</p>
                      <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Primary Actions */}
              <div className="flex space-x-3">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again ({this.maxRetries - this.retryCount} left)
                  </Button>
                )}
                
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
              </div>

              {/* Secondary Actions */}
              <div className="flex space-x-3">
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
                
                <Button
                  onClick={this.handleReportBug}
                  variant="outline"
                  className="flex-1"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Report Bug
                </Button>
              </div>
            </div>

            {/* Support Contact */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Need help? Contact our support team
              </p>
              <a
                href="mailto:support@legalpro.com"
                className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 mt-1"
              >
                <Mail className="w-3 h-3 mr-1" />
                support@legalpro.com
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
