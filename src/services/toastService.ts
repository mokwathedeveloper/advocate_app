// Enhanced Toast Service for LegalPro v1.0.1 - Comprehensive Toast Management
import toast, { Toast, ToastOptions } from 'react-hot-toast';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Loader2, 
  X,
  RotateCcw,
  Eye,
  ExternalLink
} from 'lucide-react';

// Toast action interface
export interface ToastAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: React.ComponentType<{ className?: string }>;
}

// Enhanced toast options
export interface EnhancedToastOptions extends ToastOptions {
  title?: string;
  actions?: ToastAction[];
  progress?: number;
  dismissible?: boolean;
  persistent?: boolean;
  ariaLabel?: string;
}

// Toast type definitions
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

// Toast configuration
const TOAST_CONFIG = {
  duration: {
    success: 4000,
    error: 10000,
    warning: 7000,
    info: 5000,
    loading: Infinity
  },
  maxVisible: 5,
  position: 'top-right' as const,
  gutter: 8
};

// Toast icons mapping
const TOAST_ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2
};

// Toast color schemes
const TOAST_COLORS = {
  success: {
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: '#FFFFFF',
    shadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
  },
  error: {
    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    color: '#FFFFFF',
    shadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
  },
  warning: {
    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    color: '#FFFFFF',
    shadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
  },
  info: {
    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    color: '#FFFFFF',
    shadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  },
  loading: {
    background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)',
    color: '#FFFFFF',
    shadow: '0 4px 12px rgba(30, 58, 138, 0.3)'
  }
};

// Enhanced toast service class
class ToastService {
  private activeToasts: Set<string> = new Set();

  /**
   * Create a custom toast with enhanced styling and functionality
   */
  private createCustomToast(
    type: ToastType,
    message: string,
    options: EnhancedToastOptions = {}
  ): string {
    const {
      title,
      actions = [],
      progress,
      dismissible = true,
      persistent = false,
      ariaLabel,
      ...toastOptions
    } = options;

    const Icon = TOAST_ICONS[type];
    const colors = TOAST_COLORS[type];
    const duration = persistent ? Infinity : (toastOptions.duration || TOAST_CONFIG.duration[type]);

    const toastId = toast.custom(
      (t: Toast) => (
        <div
          className={`
            transform transition-all duration-300 ease-in-out
            ${t.visible ? 'animate-enter' : 'animate-leave'}
            max-w-md w-full shadow-lg rounded-lg pointer-events-auto
            flex ring-1 ring-black ring-opacity-5
          `}
          style={{
            background: colors.background,
            color: colors.color,
            boxShadow: colors.shadow
          }}
          role="alert"
          aria-live="polite"
          aria-atomic="true"
          aria-label={ariaLabel || `${type}: ${message}`}
          tabIndex={0}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Icon 
                  className={`h-5 w-5 ${type === 'loading' ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3 flex-1">
                {title && (
                  <p className="text-sm font-medium mb-1">
                    {title}
                  </p>
                )}
                <p className="text-sm opacity-90">
                  {message}
                </p>
                
                {/* Progress bar for loading toasts */}
                {type === 'loading' && typeof progress === 'number' && (
                  <div className="mt-2 w-full bg-white bg-opacity-20 rounded-full h-2">
                    <div
                      className="bg-white h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                )}

                {/* Action buttons */}
                {actions.length > 0 && (
                  <div className="mt-3 flex space-x-2">
                    {actions.map((action, index) => {
                      const ActionIcon = action.icon;
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            action.action();
                            if (!persistent) toast.dismiss(t.id);
                          }}
                          className={`
                            inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md
                            transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2
                            ${action.variant === 'danger' 
                              ? 'bg-red-600 hover:bg-red-700 text-white' 
                              : action.variant === 'secondary'
                              ? 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white'
                              : 'bg-white bg-opacity-10 hover:bg-opacity-20 text-white'
                            }
                          `}
                          aria-label={action.label}
                        >
                          {ActionIcon && <ActionIcon className="w-3 h-3 mr-1" />}
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Dismiss button */}
          {dismissible && (
            <div className="flex border-l border-white border-opacity-20">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-white hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-white transition-colors duration-200"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ),
      {
        duration,
        ...toastOptions
      }
    );

    this.activeToasts.add(toastId);
    return toastId;
  }

  /**
   * Success toast with enhanced styling
   */
  success(message: string, options: EnhancedToastOptions = {}): string {
    return this.createCustomToast('success', message, {
      ariaLabel: `Success: ${message}`,
      ...options
    });
  }

  /**
   * Error toast with retry functionality
   */
  error(message: string, options: EnhancedToastOptions = {}): string {
    return this.createCustomToast('error', message, {
      ariaLabel: `Error: ${message}`,
      persistent: true,
      ...options
    });
  }

  /**
   * Warning toast for important information
   */
  warning(message: string, options: EnhancedToastOptions = {}): string {
    return this.createCustomToast('warning', message, {
      ariaLabel: `Warning: ${message}`,
      ...options
    });
  }

  /**
   * Info toast for general information
   */
  info(message: string, options: EnhancedToastOptions = {}): string {
    return this.createCustomToast('info', message, {
      ariaLabel: `Information: ${message}`,
      ...options
    });
  }

  /**
   * Loading toast with progress support
   */
  loading(message: string, options: EnhancedToastOptions = {}): string {
    return this.createCustomToast('loading', message, {
      ariaLabel: `Loading: ${message}`,
      persistent: true,
      dismissible: false,
      ...options
    });
  }

  /**


   * Update loading toast progress
   */
  updateProgress(toastId: string, progress: number): void {
    // This would require custom implementation with react-hot-toast
    // For now, we'll dismiss and recreate with new progress
    toast.dismiss(toastId);
  }

  /**

   * Dismiss specific toast
   */
  dismiss(toastId: string): void {
    toast.dismiss(toastId);
    this.activeToasts.delete(toastId);
  }

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    toast.dismiss();
    this.activeToasts.clear();
  }

  /**
   * Get count of active toasts
   */
  getActiveCount(): number {
    return this.activeToasts.size;
  }

  /**
   * Promise-based toast for async operations
   */
  async promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options: EnhancedToastOptions = {}
  ): Promise<T> {
    const loadingToastId = this.loading(messages.loading, options);

    try {
      const result = await promise;
      this.dismiss(loadingToastId);
      
      const successMessage = typeof messages.success === 'function' 
        ? messages.success(result) 
        : messages.success;
      
      this.success(successMessage, options);
      return result;
    } catch (error) {
      this.dismiss(loadingToastId);
      
      const errorMessage = typeof messages.error === 'function' 
        ? messages.error(error) 
        : messages.error;
      
      this.error(errorMessage, {
        ...options,
        actions: [
          {
            label: 'Retry',
            action: () => this.promise(promise, messages, options),
            icon: RotateCcw
          }
        ]
      });
      throw error;
    }
  }
}

// Export singleton instance
export const toastService = new ToastService();

// Export convenience functions
export const showToast = {
  success: (message: string, options?: EnhancedToastOptions) => toastService.success(message, options),
  error: (message: string, options?: EnhancedToastOptions) => toastService.error(message, options),
  warning: (message: string, options?: EnhancedToastOptions) => toastService.warning(message, options),
  info: (message: string, options?: EnhancedToastOptions) => toastService.info(message, options),
  loading: (message: string, options?: EnhancedToastOptions) => toastService.loading(message, options),

  promise: <T>(promise: Promise<T>, messages: any, options?: EnhancedToastOptions) => 

  promise: <T>(promise: Promise<T>, messages: any, options?: EnhancedToastOptions) =>

    toastService.promise(promise, messages, options),
  dismiss: (toastId: string) => toastService.dismiss(toastId),
  dismissAll: () => toastService.dismissAll()
};

export default toastService;
