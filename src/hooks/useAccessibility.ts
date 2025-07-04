// Accessibility Hook for LegalPro v1.0.1 - WCAG 2.1 AA Compliance
import { useEffect, useRef, useState, useCallback } from 'react';

// Accessibility preferences interface
export interface AccessibilityPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusVisible: boolean;
}

// Focus trap options
export interface FocusTrappingOptions {
  initialFocus?: HTMLElement | string;
  returnFocus?: HTMLElement;
  allowOutsideClick?: boolean;
}

// Announcement options
export interface AnnouncementOptions {
  priority?: 'polite' | 'assertive';
  delay?: number;
  clear?: boolean;
}

/**
 * Accessibility hook for managing WCAG compliance features
 */
export const useAccessibility = () => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    screenReader: false,
    keyboardNavigation: false,
    focusVisible: true
  });

  const announcementRef = useRef<HTMLDivElement | null>(null);

  // Initialize accessibility preferences
  useEffect(() => {
    const detectPreferences = (): AccessibilityPreferences => {
      return {
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        highContrast: window.matchMedia('(prefers-contrast: high)').matches,
        largeText: window.matchMedia('(prefers-font-size: large)').matches,
        screenReader: detectScreenReader(),
        keyboardNavigation: detectKeyboardNavigation(),
        focusVisible: true
      };
    };

    setPreferences(detectPreferences());

    // Listen for preference changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-font-size: large)')
    ];

    const handleChange = () => {
      setPreferences(detectPreferences());
    };

    mediaQueries.forEach(mq => mq.addEventListener('change', handleChange));

    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', handleChange));
    };
  }, []);

  // Create announcement element for screen readers
  useEffect(() => {
    if (!announcementRef.current) {
      const element = document.createElement('div');
      element.setAttribute('aria-live', 'polite');
      element.setAttribute('aria-atomic', 'true');
      element.className = 'sr-only';
      element.id = 'accessibility-announcements';
      document.body.appendChild(element);
      announcementRef.current = element;
    }

    return () => {
      if (announcementRef.current && document.body.contains(announcementRef.current)) {
        document.body.removeChild(announcementRef.current);
      }
    };
  }, []);

  /**
   * Detect if screen reader is being used
   */
  const detectScreenReader = (): boolean => {
    // Check for common screen reader indicators
    const indicators = [
      navigator.userAgent.includes('NVDA'),
      navigator.userAgent.includes('JAWS'),
      navigator.userAgent.includes('VoiceOver'),
      navigator.userAgent.includes('Orca'),
      window.speechSynthesis && window.speechSynthesis.getVoices().length > 0,
      'speechSynthesis' in window
    ];

    return indicators.some(indicator => indicator);
  };

  /**
   * Detect if user prefers keyboard navigation
   */
  const detectKeyboardNavigation = (): boolean => {
    // This is a heuristic - in practice, you might want to track actual keyboard usage
    return !('ontouchstart' in window) && !navigator.maxTouchPoints;
  };

  /**
   * Announce message to screen readers
   */
  const announce = useCallback((message: string, options: AnnouncementOptions = {}) => {
    if (!announcementRef.current) return;

    const { priority = 'polite', delay = 0, clear = false } = options;

    const makeAnnouncement = () => {
      if (!announcementRef.current) return;

      if (clear) {
        announcementRef.current.textContent = '';
        // Small delay to ensure screen reader notices the change
        setTimeout(() => {
          if (announcementRef.current) {
            announcementRef.current.textContent = message;
          }
        }, 10);
      } else {
        announcementRef.current.textContent = message;
      }

      announcementRef.current.setAttribute('aria-live', priority);
    };

    if (delay > 0) {
      setTimeout(makeAnnouncement, delay);
    } else {
      makeAnnouncement();
    }
  }, []);

  /**
   * Focus management utilities
   */
  const focusManagement = {
    /**
     * Set focus to element with optional delay
     */
    setFocus: (element: HTMLElement | string, delay: number = 0) => {
      const targetElement = typeof element === 'string' 
        ? document.querySelector(element) as HTMLElement
        : element;

      if (targetElement) {
        if (delay > 0) {
          setTimeout(() => targetElement.focus(), delay);
        } else {
          targetElement.focus();
        }
      }
    },

    /**
     * Get all focusable elements within a container
     */
    getFocusableElements: (container: HTMLElement): HTMLElement[] => {
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
      ].join(', ');

      return Array.from(container.querySelectorAll(focusableSelectors));
    },

    /**
     * Trap focus within a container
     */
    trapFocus: (container: HTMLElement, options: FocusTrappingOptions = {}) => {
      const focusableElements = focusManagement.getFocusableElements(container);
      
      if (focusableElements.length === 0) return () => {};

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Set initial focus
      if (options.initialFocus) {
        const initialElement = typeof options.initialFocus === 'string'
          ? container.querySelector(options.initialFocus) as HTMLElement
          : options.initialFocus;
        
        if (initialElement) {
          initialElement.focus();
        } else {
          firstElement.focus();
        }
      } else {
        firstElement.focus();
      }

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Tab') return;

        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      };

      const handleClick = (event: MouseEvent) => {
        if (!options.allowOutsideClick && !container.contains(event.target as Node)) {
          event.preventDefault();
          firstElement.focus();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      if (!options.allowOutsideClick) {
        document.addEventListener('click', handleClick, true);
      }

      // Return cleanup function
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('click', handleClick, true);
        
        // Return focus to specified element
        if (options.returnFocus) {
          options.returnFocus.focus();
        }
      };
    }
  };

  /**
   * Keyboard navigation utilities
   */
  const keyboardNavigation = {
    /**
     * Handle arrow key navigation in a list
     */
    handleArrowNavigation: (
      event: KeyboardEvent,
      items: HTMLElement[],
      currentIndex: number,
      onIndexChange: (index: number) => void,
      options: { wrap?: boolean; orientation?: 'horizontal' | 'vertical' } = {}
    ) => {
      const { wrap = true, orientation = 'vertical' } = options;
      
      let newIndex = currentIndex;

      switch (event.key) {
        case 'ArrowDown':
          if (orientation === 'vertical') {
            event.preventDefault();
            newIndex = currentIndex + 1;
            if (newIndex >= items.length) {
              newIndex = wrap ? 0 : items.length - 1;
            }
          }
          break;
        case 'ArrowUp':
          if (orientation === 'vertical') {
            event.preventDefault();
            newIndex = currentIndex - 1;
            if (newIndex < 0) {
              newIndex = wrap ? items.length - 1 : 0;
            }
          }
          break;
        case 'ArrowRight':
          if (orientation === 'horizontal') {
            event.preventDefault();
            newIndex = currentIndex + 1;
            if (newIndex >= items.length) {
              newIndex = wrap ? 0 : items.length - 1;
            }
          }
          break;
        case 'ArrowLeft':
          if (orientation === 'horizontal') {
            event.preventDefault();
            newIndex = currentIndex - 1;
            if (newIndex < 0) {
              newIndex = wrap ? items.length - 1 : 0;
            }
          }
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = items.length - 1;
          break;
      }

      if (newIndex !== currentIndex) {
        onIndexChange(newIndex);
        items[newIndex]?.focus();
      }
    }
  };

  /**
   * Color contrast utilities
   */
  const colorContrast = {
    /**
     * Calculate contrast ratio between two colors
     */
    getContrastRatio: (color1: string, color2: string): number => {
      const getLuminance = (color: string): number => {
        // Simplified luminance calculation
        const rgb = color.match(/\d+/g);
        if (!rgb) return 0;
        
        const [r, g, b] = rgb.map(c => {
          const val = parseInt(c) / 255;
          return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
        });
        
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };

      const lum1 = getLuminance(color1);
      const lum2 = getLuminance(color2);
      const brightest = Math.max(lum1, lum2);
      const darkest = Math.min(lum1, lum2);
      
      return (brightest + 0.05) / (darkest + 0.05);
    },

    /**
     * Check if contrast ratio meets WCAG standards
     */
    meetsWCAG: (ratio: number, level: 'AA' | 'AAA' = 'AA', size: 'normal' | 'large' = 'normal'): boolean => {
      const requirements = {
        AA: { normal: 4.5, large: 3 },
        AAA: { normal: 7, large: 4.5 }
      };
      
      return ratio >= requirements[level][size];
    }
  };

  /**
   * Skip link utilities
   */
  const skipLinks = {
    /**
     * Create skip link for main content
     */
    createSkipLink: (targetId: string, label: string = 'Skip to main content'): HTMLAnchorElement => {
      const skipLink = document.createElement('a');
      skipLink.href = `#${targetId}`;
      skipLink.textContent = label;
      skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md';
      
      return skipLink;
    },

    /**
     * Add skip links to page
     */
    addSkipLinks: (links: Array<{ targetId: string; label: string }>) => {
      const container = document.createElement('div');
      container.className = 'skip-links';
      
      links.forEach(({ targetId, label }) => {
        const skipLink = skipLinks.createSkipLink(targetId, label);
        container.appendChild(skipLink);
      });
      
      document.body.insertBefore(container, document.body.firstChild);
    }
  };

  return {
    preferences,
    announce,
    focusManagement,
    keyboardNavigation,
    colorContrast,
    skipLinks,
    
    // Utility functions
    isReducedMotion: () => preferences.reducedMotion,
    isHighContrast: () => preferences.highContrast,
    isLargeText: () => preferences.largeText,
    isScreenReader: () => preferences.screenReader,
    isKeyboardNavigation: () => preferences.keyboardNavigation
  };
};

export default useAccessibility;
