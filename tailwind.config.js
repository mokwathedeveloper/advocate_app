/** @type {import('tailwindcss').Config} */
// Tailwind CSS configuration for LegalPro v1.0.1 - Mobile-First Responsive Design
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    // Enhanced breakpoint system for mobile-first design
    screens: {
      'xs': '320px',    // Extra small phones (iPhone SE)
      'sm': '375px',    // Small phones (iPhone 12 Mini)
      'md': '768px',    // Tablets (iPad Mini)
      'lg': '1024px',   // Small laptops (iPad)
      'xl': '1280px',   // Laptops
      '2xl': '1536px',  // Large desktops
    },
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1e40af',
          700: '#1e3a8a',
          800: '#1e2856',
          900: '#1e1b4b',
        },
        navy: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1a202c',
          900: '#0f172a',
        },
        secondary: {
          50: '#fffdf7',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        gold: {
          50: '#fffdf7',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'bounce-subtle': 'bounceSubtle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      },
      // Mobile-first spacing system
      spacing: {
        'mobile-xs': '0.5rem',   // 8px
        'mobile-sm': '0.75rem',  // 12px
        'mobile-md': '1rem',     // 16px
        'mobile-lg': '1.5rem',   // 24px
        'mobile-xl': '2rem',     // 32px
        'mobile-2xl': '3rem',    // 48px
      },
      // Enhanced font sizes for mobile-first typography
      fontSize: {
        'xs-mobile': ['0.75rem', { lineHeight: '1rem' }],     // 12px
        'sm-mobile': ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        'base-mobile': ['1rem', { lineHeight: '1.5rem' }],    // 16px
        'lg-mobile': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        'xl-mobile': ['1.25rem', { lineHeight: '1.75rem' }],  // 20px
        '2xl-mobile': ['1.5rem', { lineHeight: '2rem' }],     // 24px
        '3xl-mobile': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl-mobile': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px
      },
      // Touch-friendly minimum sizes
      minHeight: {
        'touch-target': '44px',
        'touch-target-lg': '48px',
      },
      minWidth: {
        'touch-target': '44px',
        'touch-target-lg': '48px',
      }
    },
  },
  plugins: [],
}