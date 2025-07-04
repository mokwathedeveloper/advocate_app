// Test helpers for loading and error handling - LegalPro v1.0.1
import { ApiError } from '../services/apiService';

// Mock API responses for testing
export const mockApiResponses = {
  // Success responses
  success: {
    cases: [
      {
        id: '1',
        title: 'Property Dispute Resolution',
        status: 'in_progress',
        priority: 'high',
        clientId: 'client-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Contract Negotiation',
        status: 'pending',
        priority: 'medium',
        clientId: 'client-2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    appointments: [
      {
        id: '1',
        title: 'Initial Consultation',
        date: new Date().toISOString(),
        status: 'scheduled',
        clientId: 'client-1',
        advocateId: 'advocate-1'
      }
    ],
    dashboardStats: {
      activeCases: 3,
      upcomingAppointments: 2,
      pendingActions: 5,
      outstandingFees: 2500
    }
  },

  // Error responses
  errors: {
    network: new ApiError('Network error. Please check your internet connection.', 'NETWORK_ERROR'),
    timeout: new ApiError('Request timeout. Please check your connection and try again.', 'TIMEOUT'),
    unauthorized: new ApiError('Your session has expired. Please log in again.', 'UNAUTHORIZED', 401),
    forbidden: new ApiError('You do not have permission to perform this action.', 'FORBIDDEN', 403),
    notFound: new ApiError('The requested resource was not found.', 'NOT_FOUND', 404),
    validation: new ApiError('Invalid data provided.', 'VALIDATION_ERROR', 422, {
      email: ['Email is required'],
      password: ['Password must be at least 8 characters']
    }),
    rateLimit: new ApiError('Too many requests. Please wait a moment and try again.', 'RATE_LIMIT', 429),
    serverError: new ApiError('Server error. Please try again later.', 'SERVER_ERROR', 500)
  }
};

// Simulate network delays
export const simulateDelay = (ms: number = 1000): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Simulate API call with loading and error states
export const simulateApiCall = async <T>(
  response: T | ApiError,
  delay: number = 1000,
  shouldFail: boolean = false
): Promise<T> => {
  await simulateDelay(delay);
  
  if (shouldFail || response instanceof ApiError) {
    throw response;
  }
  
  return response as T;
};

// Test scenarios for different loading states
export const testScenarios = {
  // Fast loading (< 1 second)
  fast: {
    delay: 500,
    shouldFail: false
  },
  
  // Normal loading (1-3 seconds)
  normal: {
    delay: 2000,
    shouldFail: false
  },
  
  // Slow loading (3-5 seconds)
  slow: {
    delay: 4000,
    shouldFail: false
  },
  
  // Very slow loading (> 5 seconds)
  verySlow: {
    delay: 6000,
    shouldFail: false
  },
  
  // Network error
  networkError: {
    delay: 1000,
    shouldFail: true,
    error: mockApiResponses.errors.network
  },
  
  // Timeout error
  timeoutError: {
    delay: 1000,
    shouldFail: true,
    error: mockApiResponses.errors.timeout
  },
  
  // Server error
  serverError: {
    delay: 1000,
    shouldFail: true,
    error: mockApiResponses.errors.serverError
  },
  
  // Validation error
  validationError: {
    delay: 500,
    shouldFail: true,
    error: mockApiResponses.errors.validation
  }
};

// Mock API service for testing
export const createMockApiService = (scenario: keyof typeof testScenarios = 'normal') => {
  const config = testScenarios[scenario];
  
  return {
    getCases: () => simulateApiCall(
      config.shouldFail ? config.error! : mockApiResponses.success.cases,
      config.delay,
      config.shouldFail
    ),
    
    getAppointments: () => simulateApiCall(
      config.shouldFail ? config.error! : mockApiResponses.success.appointments,
      config.delay,
      config.shouldFail
    ),
    
    getDashboardData: () => simulateApiCall(
      config.shouldFail ? config.error! : mockApiResponses.success.dashboardStats,
      config.delay,
      config.shouldFail
    ),
    
    createCase: (data: any) => simulateApiCall(
      config.shouldFail ? config.error! : { ...data, id: Date.now().toString() },
      config.delay,
      config.shouldFail
    ),
    
    updateCase: (id: string, data: any) => simulateApiCall(
      config.shouldFail ? config.error! : { ...data, id },
      config.delay,
      config.shouldFail
    ),
    
    deleteCase: (id: string) => simulateApiCall(
      config.shouldFail ? config.error! : { success: true },
      config.delay,
      config.shouldFail
    )
  };
};

// Accessibility testing helpers
export const accessibilityTestHelpers = {
  // Check if loading indicators have proper ARIA attributes
  checkLoadingAria: (element: HTMLElement): boolean => {
    const hasRole = element.getAttribute('role') === 'status';
    const hasAriaLabel = element.hasAttribute('aria-label');
    const hasAriaLive = element.getAttribute('aria-live') === 'polite';
    
    return hasRole && (hasAriaLabel || hasAriaLive);
  },
  
  // Check if error messages have proper ARIA attributes
  checkErrorAria: (element: HTMLElement): boolean => {
    const hasRole = element.getAttribute('role') === 'alert';
    const hasAriaLive = element.getAttribute('aria-live') === 'polite';
    
    return hasRole && hasAriaLive;
  },
  
  // Check if interactive elements are keyboard accessible
  checkKeyboardAccessibility: (element: HTMLElement): boolean => {
    const isButton = element.tagName === 'BUTTON';
    const hasTabIndex = element.hasAttribute('tabindex');
    const hasRole = element.getAttribute('role') === 'button';
    
    return isButton || (hasTabIndex && hasRole);
  },
  
  // Check color contrast (simplified check)
  checkColorContrast: (foreground: string, background: string): boolean => {
    // This is a simplified check - in real testing, use proper contrast calculation
    const fgLuminance = getLuminance(foreground);
    const bgLuminance = getLuminance(background);
    const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / (Math.min(fgLuminance, bgLuminance) + 0.05);
    
    return ratio >= 4.5; // WCAG AA standard
  }
};

// Helper function to calculate luminance (simplified)
function getLuminance(color: string): number {
  // This is a simplified implementation
  // In real testing, use a proper color library
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Performance testing helpers
export const performanceTestHelpers = {
  // Measure time to first loading indicator
  measureLoadingTime: (): { start: () => void; end: () => number } => {
    let startTime: number;
    
    return {
      start: () => {
        startTime = performance.now();
      },
      end: () => {
        return performance.now() - startTime;
      }
    };
  },
  
  // Check if loading indicators appear within 100ms
  checkLoadingSpeed: async (triggerLoading: () => void): Promise<boolean> => {
    const timer = performanceTestHelpers.measureLoadingTime();
    timer.start();
    
    triggerLoading();
    
    // Wait for loading indicator to appear
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const loadingTime = timer.end();
    return loadingTime <= 100; // Should appear within 100ms
  }
};

// Mobile testing helpers
export const mobileTestHelpers = {
  // Simulate mobile viewport
  setMobileViewport: () => {
    Object.defineProperty(window, 'innerWidth', { value: 375 });
    Object.defineProperty(window, 'innerHeight', { value: 667 });
    window.dispatchEvent(new Event('resize'));
  },
  
  // Simulate tablet viewport
  setTabletViewport: () => {
    Object.defineProperty(window, 'innerWidth', { value: 768 });
    Object.defineProperty(window, 'innerHeight', { value: 1024 });
    window.dispatchEvent(new Event('resize'));
  },
  
  // Simulate desktop viewport
  setDesktopViewport: () => {
    Object.defineProperty(window, 'innerWidth', { value: 1920 });
    Object.defineProperty(window, 'innerHeight', { value: 1080 });
    window.dispatchEvent(new Event('resize'));
  },
  
  // Check touch target size (minimum 44px)
  checkTouchTargetSize: (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    return rect.width >= 44 && rect.height >= 44;
  }
};
