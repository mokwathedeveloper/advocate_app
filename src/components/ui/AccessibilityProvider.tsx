// Accessibility Provider for LegalPro v1.0.1 - Global Accessibility Context
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';

// Accessibility context interface
interface AccessibilityContextType {
  announce: (message: string, options?: { priority?: 'polite' | 'assertive'; delay?: number; clear?: boolean }) => void;
  focusManagement: {
    setFocus: (element: HTMLElement | string, delay?: number) => void;
    getFocusableElements: (container: HTMLElement) => HTMLElement[];
    trapFocus: (container: HTMLElement, options?: any) => () => void;
  };
  keyboardNavigation: {
    handleArrowNavigation: (
      event: KeyboardEvent,
      items: HTMLElement[],
      currentIndex: number,
      onIndexChange: (index: number) => void,
      options?: { wrap?: boolean; orientation?: 'horizontal' | 'vertical' }
    ) => void;
  };
  colorContrast: {
    getContrastRatio: (color1: string, color2: string) => number;
    meetsWCAG: (ratio: number, level?: 'AA' | 'AAA', size?: 'normal' | 'large') => boolean;
  };
  skipLinks: {
    createSkipLink: (targetId: string, label?: string) => HTMLAnchorElement;
    addSkipLinks: (links: Array<{ targetId: string; label: string }>) => void;
  };
  preferences: {
    reducedMotion: boolean;
    highContrast: boolean;
    largeText: boolean;
    screenReader: boolean;
    keyboardNavigation: boolean;
    focusVisible: boolean;
  };
  isReducedMotion: () => boolean;
  isHighContrast: () => boolean;
  isLargeText: () => boolean;
  isScreenReader: () => boolean;
  isKeyboardNavigation: () => boolean;
}

// Create accessibility context
const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// Accessibility provider props
interface AccessibilityProviderProps {
  children: ReactNode;
  enableSkipLinks?: boolean;
  skipLinks?: Array<{ targetId: string; label: string }>;
}

/**
 * Accessibility Provider Component
 * Provides global accessibility features and context
 */
export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
  enableSkipLinks = true,
  skipLinks = [
    { targetId: 'main-content', label: 'Skip to main content' },
    { targetId: 'main-navigation', label: 'Skip to navigation' },
    { targetId: 'footer', label: 'Skip to footer' }
  ]
}) => {
  const accessibility = useAccessibility();

  // Initialize accessibility features
  useEffect(() => {
    // Add skip links if enabled
    if (enableSkipLinks && skipLinks.length > 0) {
      accessibility.skipLinks.addSkipLinks(skipLinks);
    }

    // Add global accessibility styles
    const style = document.createElement('style');
    style.textContent = `
      /* Screen reader only content */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* Show screen reader content when focused */
      .sr-only:focus,
      .focus\\:not-sr-only:focus {
        position: static;
        width: auto;
        height: auto;
        padding: inherit;
        margin: inherit;
        overflow: visible;
        clip: auto;
        white-space: normal;
      }

      /* High contrast mode support */
      @media (prefers-contrast: high) {
        * {
          border-color: ButtonText !important;
        }
        
        button, input, select, textarea {
          border: 2px solid ButtonText !important;
        }
        
        a {
          text-decoration: underline !important;
        }
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }

      /* Large text support */
      @media (prefers-font-size: large) {
        body {
          font-size: 1.2em;
        }
        
        button, input, select, textarea {
          font-size: 1.1em;
          padding: 0.75em 1em;
        }
      }

      /* Focus visible styles */
      .focus-visible:focus {
        outline: 2px solid #3B82F6;
        outline-offset: 2px;
      }

      /* Skip links styles */
      .skip-links a {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #3B82F6;
        color: white;
        padding: 8px 16px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 1000;
        transition: top 0.3s;
      }

      .skip-links a:focus {
        top: 6px;
      }

      /* Keyboard navigation indicators */
      .keyboard-navigation *:focus {
        outline: 2px solid #3B82F6 !important;
        outline-offset: 2px !important;
      }

      /* Touch target size for accessibility */
      button, [role="button"], input[type="button"], input[type="submit"], a {
        min-height: 44px;
        min-width: 44px;
      }

      /* Ensure sufficient color contrast */
      .low-contrast-warning {
        background-color: #FEF3C7 !important;
        color: #92400E !important;
        border: 1px solid #F59E0B !important;
      }
    `;
    
    document.head.appendChild(style);

    // Add keyboard navigation class to body when keyboard is used
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    // Announce page load to screen readers
    accessibility.announce('Page loaded', { delay: 1000 });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [accessibility, enableSkipLinks, skipLinks]);

  // Monitor route changes and announce them
  useEffect(() => {
    const handleRouteChange = () => {
      const pageTitle = document.title;
      accessibility.announce(`Navigated to ${pageTitle}`, { 
        priority: 'assertive',
        delay: 500 
      });
    };

    // Listen for route changes (this is a simplified approach)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.target === document.head) {
          const titleElement = document.querySelector('title');
          if (titleElement && mutation.addedNodes.length > 0) {
            handleRouteChange();
          }
        }
      });
    });

    observer.observe(document.head, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [accessibility]);

  const contextValue: AccessibilityContextType = {
    announce: accessibility.announce,
    focusManagement: accessibility.focusManagement,
    keyboardNavigation: accessibility.keyboardNavigation,
    colorContrast: accessibility.colorContrast,
    skipLinks: accessibility.skipLinks,
    preferences: accessibility.preferences,
    isReducedMotion: accessibility.isReducedMotion,
    isHighContrast: accessibility.isHighContrast,
    isLargeText: accessibility.isLargeText,
    isScreenReader: accessibility.isScreenReader,
    isKeyboardNavigation: accessibility.isKeyboardNavigation
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

/**
 * Hook to use accessibility context
 */
export const useAccessibilityContext = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibilityContext must be used within an AccessibilityProvider');
  }
  return context;
};

/**
 * Higher-order component for accessibility features
 */
export const withAccessibility = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> => {
  const AccessibleComponent = (props: P) => {
    const accessibility = useAccessibilityContext();
    
    return (
      <Component 
        {...props} 
        accessibility={accessibility}
      />
    );
  };

  AccessibleComponent.displayName = `withAccessibility(${Component.displayName || Component.name})`;
  
  return AccessibleComponent;
};

export default AccessibilityProvider;
