// Reusable Button component for LegalPro v1.0.1 - WCAG 2.1 AA Compliant
import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useReducedMotion } from '../../hooks/useAccessibility';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText = 'Loading...',
  fullWidth = false,
  children,
  className,
  disabled,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();

  // WCAG 2.1 AA compliant base classes with proper focus indicators
  const baseClasses = "btn-accessible inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus-visible:ring-3 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed";

  // High contrast color variants meeting WCAG AA standards
  const variants = {
    primary: "bg-primary-800 text-white hover:bg-primary-700 focus-visible:ring-primary-500 disabled:bg-neutral-400 disabled:text-neutral-600",
    secondary: "bg-secondary-500 text-white hover:bg-secondary-600 focus-visible:ring-secondary-400 disabled:bg-neutral-400 disabled:text-neutral-600",
    outline: "border-2 border-primary-800 text-primary-800 hover:bg-primary-800 hover:text-white focus-visible:ring-primary-500 disabled:border-neutral-400 disabled:text-neutral-400 disabled:hover:bg-transparent disabled:hover:text-neutral-400",
    ghost: "text-primary-800 hover:bg-primary-100 focus-visible:ring-primary-500 disabled:text-neutral-400 disabled:hover:bg-transparent"
  };

  // Touch-friendly sizes meeting WCAG minimum 44px target size
  const sizes = {
    sm: "px-3 py-2 text-sm min-h-[44px]",
    md: "px-4 py-2.5 text-base min-h-[44px]",
    lg: "px-6 py-3 text-lg min-h-[48px]",
    xl: "px-8 py-4 text-xl min-h-[52px]"
  };

  const classes = clsx(
    baseClasses,
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className
  );

  // Motion settings that respect reduced motion preference
  const motionProps = prefersReducedMotion
    ? {}
    : {
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.98 }
      };

  return (
    <motion.button
      {...motionProps}
      className={classes}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      {...props}
    >
      {loading && (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="sr-only">{loadingText}</span>
        </>
      )}
      <span aria-hidden={loading}>{children}</span>
    </motion.button>
  );
};

export default Button;