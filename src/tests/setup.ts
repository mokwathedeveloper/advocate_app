// Test Setup for LegalPro v1.0.1 - Comprehensive Testing Configuration
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { server } from './mocks/server';

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  computedStyleSupportsPseudoElements: true
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock fetch
global.fetch = jest.fn();

// Mock console methods for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Start MSW server
  server.listen({ onUnhandledRequest: 'error' });
  
  // Suppress console errors/warnings during tests unless they're test-related
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('Error:'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning:')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterEach(() => {
  // Reset MSW handlers
  server.resetHandlers();
  
  // Clear all mocks
  jest.clearAllMocks();
  
  // Clear localStorage and sessionStorage
  localStorageMock.clear();
  sessionStorageMock.clear();
  
  // Reset document body
  document.body.innerHTML = '';
  
  // Reset document title
  document.title = 'Test';
});

afterAll(() => {
  // Stop MSW server
  server.close();
  
  // Restore console methods
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test utilities
export const testUtils = {
  // Wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock timers
  mockTimers: () => {
    jest.useFakeTimers();
    return {
      advanceBy: (ms: number) => jest.advanceTimersByTime(ms),
      runAll: () => jest.runAllTimers(),
      restore: () => jest.useRealTimers()
    };
  },
  
  // Mock network requests
  mockFetch: (response: any, status: number = 200) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: async () => response,
      text: async () => JSON.stringify(response),
    });
  },
  
  // Mock localStorage
  mockLocalStorage: (data: Record<string, string> = {}) => {
    Object.keys(data).forEach(key => {
      localStorageMock.getItem.mockImplementation((k) => k === key ? data[key] : null);
    });
  },
  
  // Create mock user
  createMockUser: (overrides = {}) => ({
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'client' as const,
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    ...overrides
  }),
  
  // Create mock case
  createMockCase: (overrides = {}) => ({
    id: '1',
    clientId: '1',
    title: 'Test Case',
    description: 'Test case description',
    category: 'Civil',
    status: 'pending' as const,
    priority: 'medium' as const,
    documents: [],
    notes: [],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    ...overrides
  }),
  
  // Create mock appointment
  createMockAppointment: (overrides = {}) => ({
    id: '1',
    clientId: '1',
    advocateId: '2',
    title: 'Test Appointment',
    description: 'Test appointment description',
    date: '2023-12-01',
    time: '10:00',
    duration: 60,
    status: 'scheduled' as const,
    type: 'consultation' as const,
    location: 'Office',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    ...overrides
  })
};

// Custom matchers
expect.extend({
  toBeAccessible(received) {
    // Basic accessibility checks
    const hasAriaLabel = received.hasAttribute('aria-label') || received.hasAttribute('aria-labelledby');
    const hasRole = received.hasAttribute('role');
    const isInteractive = ['button', 'link', 'input', 'select', 'textarea'].includes(received.tagName.toLowerCase());
    
    if (isInteractive && !hasAriaLabel && !hasRole) {
      return {
        message: () => `Expected element to have aria-label, aria-labelledby, or role attribute for accessibility`,
        pass: false,
      };
    }
    
    return {
      message: () => `Expected element to not be accessible`,
      pass: true,
    };
  },
  
  toHaveValidContrast(received) {
    // Mock contrast validation - in real implementation, you'd calculate actual contrast
    const style = window.getComputedStyle(received);
    const hasValidContrast = style.color !== style.backgroundColor;
    
    return {
      message: () => hasValidContrast 
        ? `Expected element to not have valid contrast`
        : `Expected element to have valid color contrast ratio`,
      pass: hasValidContrast,
    };
  }
});

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAccessible(): R;
      toHaveValidContrast(): R;
    }
  }
}
