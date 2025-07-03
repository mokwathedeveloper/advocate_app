import '@testing-library/jest-dom';
import React from 'react';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
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
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: () => {},
});

// Mock framer-motion components
vi.mock('framer-motion', () => ({
  motion: {
    div: (props: any) => React.createElement('div', props),
    h1: (props: any) => React.createElement('h1', props),
    h2: (props: any) => React.createElement('h2', props),
    h3: (props: any) => React.createElement('h3', props),
    p: (props: any) => React.createElement('p', props),
    section: (props: any) => React.createElement('section', props),
    button: (props: any) => React.createElement('button', props),
    span: (props: any) => React.createElement('span', props),
    a: (props: any) => React.createElement('a', props),
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock Google Maps (if needed)
global.google = {
  maps: {
    Map: class {
      constructor() {}
    },
    Marker: class {
      constructor() {}
    },
    InfoWindow: class {
      constructor() {}
    },
    LatLng: class {
      constructor() {}
    },
    event: {
      addListener: () => {},
    },
  },
} as any;
