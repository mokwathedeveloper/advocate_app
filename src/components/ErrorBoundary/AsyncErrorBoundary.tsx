// Async Error Boundary for LegalPro v1.0.1 - Handles Async Errors
import React, { Component, ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}

interface State {
  asyncError: Error | null;
}

/**
 * AsyncErrorBoundary - Catches errors from async operations
 * that don't bubble up to regular error boundaries
 */
class AsyncErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { asyncError: null };
  }

  componentDidMount() {
    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    
    // Listen for global errors
    window.addEventListener('error', this.handleGlobalError);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleGlobalError);
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    this.setState({ asyncError: error });
    
    if (this.props.onError) {
      this.props.onError(error);
    }
    
    // Prevent the default browser behavior
    event.preventDefault();
  };

  handleGlobalError = (event: ErrorEvent) => {
    console.error('Global error:', event.error);
    
    const error = event.error instanceof Error 
      ? event.error 
      : new Error(event.message);
    
    this.setState({ asyncError: error });
    
    if (this.props.onError) {
      this.props.onError(error);
    }
  };

  render() {
    if (this.state.asyncError) {
      // Throw the async error so the regular ErrorBoundary can catch it
      throw this.state.asyncError;
    }

    return (
      <ErrorBoundary
        fallback={this.props.fallback}
        onError={this.props.onError}
        level="component"
      >
        {this.props.children}
      </ErrorBoundary>
    );
  }
}

export default AsyncErrorBoundary;
