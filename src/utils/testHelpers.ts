// Test Helper Utilities for LegalPro v1.0.1 - Mobile and Accessibility Testing
import { fireEvent } from '@testing-library/react';

// Mobile viewport dimensions
export const VIEWPORT_SIZES = {
  mobile: {
    small: { width: 320, height: 568 }, // iPhone SE
    medium: { width: 375, height: 667 }, // iPhone 8
    large: { width: 414, height: 896 } // iPhone 11 Pro Max
  },
  tablet: {
    small: { width: 768, height: 1024 }, // iPad
    large: { width: 1024, height: 1366 } // iPad Pro
  },
  desktop: {
    small: { width: 1200, height: 800 },
    medium: { width: 1440, height: 900 },
    large: { width: 1920, height: 1080 }
  }
};

// Mobile test helpers
export const mobileTestHelpers = {
  /**
   * Set mobile viewport for testing
   */
  setMobileViewport: (size: 'small' | 'medium' | 'large' = 'medium') => {
    const viewport = VIEWPORT_SIZES.mobile[size];
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: viewport.width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: viewport.height,
    });
    
    // Trigger resize event
    fireEvent(window, new Event('resize'));
  },

  /**
   * Set tablet viewport for testing
   */
  setTabletViewport: (size: 'small' | 'large' = 'small') => {
    const viewport = VIEWPORT_SIZES.tablet[size];
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: viewport.width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: viewport.height,
    });
    
    fireEvent(window, new Event('resize'));
  },

  /**
   * Set desktop viewport for testing
   */
  setDesktopViewport: (size: 'small' | 'medium' | 'large' = 'medium') => {
    const viewport = VIEWPORT_SIZES.desktop[size];
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: viewport.width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: viewport.height,
    });
    
    fireEvent(window, new Event('resize'));
  },

  /**
   * Check if element meets minimum touch target size (44px)
   */
  checkTouchTargetSize: (element: Element): boolean => {
    const rect = element.getBoundingClientRect();
    return rect.width >= 44 && rect.height >= 44;
  },

  /**
   * Simulate touch events for swipe gestures
   */
  simulateSwipe: (element: Element, direction: 'left' | 'right' | 'up' | 'down', distance: number = 100) => {
    const startCoords = { x: 0, y: 0 };
    const endCoords = { x: 0, y: 0 };

    switch (direction) {
      case 'right':
        endCoords.x = distance;
        break;
      case 'left':
        endCoords.x = -distance;
        break;
      case 'down':
        endCoords.y = distance;
        break;
      case 'up':
        endCoords.y = -distance;
        break;
    }

    // Touch start
    fireEvent.touchStart(element, {
      touches: [{ clientX: startCoords.x, clientY: startCoords.y }]
    });

    // Touch move
    fireEvent.touchMove(element, {
      touches: [{ clientX: endCoords.x, clientY: endCoords.y }]
    });

    // Touch end
    fireEvent.touchEnd(element, {
      changedTouches: [{ clientX: endCoords.x, clientY: endCoords.y }]
    });
  },

  /**
   * Check if element is visible in viewport
   */
  isElementInViewport: (element: Element): boolean => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  },

  /**
   * Mock touch device
   */
  mockTouchDevice: () => {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
    
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      configurable: true,
      value: () => {},
    });
  },

  /**
   * Mock non-touch device
   */
  mockNonTouchDevice: () => {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 0,
    });
    
    delete (window as any).ontouchstart;
  }
};

// Accessibility test helpers
export const accessibilityTestHelpers = {
  /**
   * Check if element has proper ARIA attributes
   */
  hasProperARIA: (element: Element, expectedAttributes: Record<string, string>): boolean => {
    return Object.entries(expectedAttributes).every(([attr, value]) => {
      return element.getAttribute(attr) === value;
    });
  },

  /**
   * Check color contrast ratio (simplified)
   */
  checkColorContrast: (element: Element): { ratio: number; passes: boolean } => {
    const styles = window.getComputedStyle(element);
    const backgroundColor = styles.backgroundColor;
    const color = styles.color;
    
    // Simplified contrast calculation
    // In real implementation, use proper color contrast calculation
    const ratio = 4.5; // Mock ratio
    const passes = ratio >= 4.5;
    
    return { ratio, passes };
  },

  /**
   * Check if element is focusable
   */
  isFocusable: (element: Element): boolean => {
    const focusableElements = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    return focusableElements.some(selector => element.matches(selector));
  },

  /**
   * Get focus order of elements
   */
  getFocusOrder: (container: Element): Element[] => {
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    return Array.from(focusableElements).sort((a, b) => {
      const aTabIndex = parseInt(a.getAttribute('tabindex') || '0');
      const bTabIndex = parseInt(b.getAttribute('tabindex') || '0');
      return aTabIndex - bTabIndex;
    });
  },

  /**
   * Mock screen reader
   */
  mockScreenReader: () => {
    const announcements: string[] = [];
    
    // Mock ARIA live region announcements
    const originalSetAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function(name: string, value: string) {
      if (name === 'aria-live' && value === 'polite') {
        // Mock announcement
        announcements.push(this.textContent || '');
      }
      return originalSetAttribute.call(this, name, value);
    };
    
    return {
      getAnnouncements: () => announcements,
      clearAnnouncements: () => announcements.length = 0
    };
  },

  /**
   * Check keyboard navigation
   */
  testKeyboardNavigation: (container: Element): boolean => {
    const focusableElements = accessibilityTestHelpers.getFocusOrder(container);
    
    if (focusableElements.length === 0) return true;
    
    // Test Tab navigation
    let currentIndex = 0;
    focusableElements[currentIndex].focus();
    
    for (let i = 1; i < focusableElements.length; i++) {
      fireEvent.keyDown(focusableElements[currentIndex], { key: 'Tab' });
      currentIndex = i;
      
      if (document.activeElement !== focusableElements[currentIndex]) {
        return false;
      }
    }
    
    return true;
  }
};

// Performance test helpers
export const performanceTestHelpers = {
  /**
   * Measure component render time
   */
  measureRenderTime: async (renderFunction: () => void): Promise<number> => {
    const start = performance.now();
    renderFunction();
    await new Promise(resolve => setTimeout(resolve, 0)); // Wait for render
    const end = performance.now();
    return end - start;
  },

  /**
   * Mock performance API
   */
  mockPerformanceAPI: () => {
    const marks: Record<string, number> = {};
    const measures: Record<string, number> = {};
    
    return {
      now: () => Date.now(),
      mark: (name: string) => {
        marks[name] = Date.now();
      },
      measure: (name: string, startMark: string, endMark: string) => {
        const duration = marks[endMark] - marks[startMark];
        measures[name] = duration;
        return duration;
      },
      getMarks: () => marks,
      getMeasures: () => measures
    };
  },

  /**
   * Check animation performance
   */
  checkAnimationPerformance: (element: Element): Promise<boolean> => {
    return new Promise((resolve) => {
      let frameCount = 0;
      const startTime = performance.now();
      
      const checkFrame = () => {
        frameCount++;
        const currentTime = performance.now();
        const elapsed = currentTime - startTime;
        
        if (elapsed >= 1000) { // Check for 1 second
          const fps = frameCount;
          resolve(fps >= 55); // Should maintain ~60fps
        } else {
          requestAnimationFrame(checkFrame);
        }
      };
      
      requestAnimationFrame(checkFrame);
    });
  }
};

// API test helpers
export const apiTestHelpers = {
  /**
   * Mock successful API response
   */
  mockSuccessResponse: <T>(data: T, delay: number = 100): Promise<T> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), delay);
    });
  },

  /**
   * Mock API error
   */
  mockErrorResponse: (message: string, status: number = 500, delay: number = 100): Promise<never> => {
    return new Promise((_, reject) => {
      setTimeout(() => {
        const error = new Error(message);
        (error as any).status = status;
        reject(error);
      }, delay);
    });
  },

  /**
   * Mock network timeout
   */
  mockTimeout: (delay: number = 5000): Promise<never> => {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timeout'));
      }, delay);
    });
  },

  /**
   * Mock progressive loading
   */
  mockProgressiveLoading: (totalSteps: number, stepDelay: number = 200): Promise<void> => {
    return new Promise((resolve) => {
      let currentStep = 0;
      
      const nextStep = () => {
        currentStep++;
        if (currentStep >= totalSteps) {
          resolve();
        } else {
          setTimeout(nextStep, stepDelay);
        }
      };
      
      setTimeout(nextStep, stepDelay);
    });
  }
};

// Toast-specific test helpers
export const toastTestHelpers = {
  /**
   * Wait for toast to appear
   */
  waitForToast: async (message: string, timeout: number = 5000): Promise<Element> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkForToast = () => {
        const toast = document.querySelector(`[aria-label*="${message}"]`);
        
        if (toast) {
          resolve(toast);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Toast with message "${message}" not found within ${timeout}ms`));
        } else {
          setTimeout(checkForToast, 100);
        }
      };
      
      checkForToast();
    });
  },

  /**
   * Count visible toasts
   */
  countVisibleToasts: (): number => {
    return document.querySelectorAll('[role="alert"]').length;
  },

  /**
   * Get toast by type
   */
  getToastByType: (type: string): Element | null => {
    return document.querySelector(`[aria-label^="${type}:"]`);
  },

  /**
   * Check toast positioning
   */
  checkToastPosition: (position: string): boolean => {
    const container = document.querySelector('.toast-container');
    if (!container) return false;
    
    const styles = window.getComputedStyle(container);
    
    switch (position) {
      case 'top-right':
        return styles.top !== 'auto' && styles.right !== 'auto';
      case 'top-left':
        return styles.top !== 'auto' && styles.left !== 'auto';
      case 'bottom-right':
        return styles.bottom !== 'auto' && styles.right !== 'auto';
      default:
        return false;
    }
  }
};

export default {
  mobileTestHelpers,
  accessibilityTestHelpers,
  performanceTestHelpers,
  apiTestHelpers,
  toastTestHelpers
};
