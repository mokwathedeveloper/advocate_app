// Reusable Button component for LegalPro v1.0.1 - Professional Color Palette
import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-800 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus:ring-primary-500 disabled:bg-neutral-400 disabled:text-neutral-50 shadow-sm hover:shadow-md",
    secondary: "bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700 focus:ring-secondary-400 disabled:bg-neutral-400 disabled:text-neutral-50 shadow-sm hover:shadow-md",
    success: "bg-success-600 text-white hover:bg-success-700 active:bg-success-800 focus:ring-success-500 disabled:bg-neutral-400 disabled:text-neutral-50 shadow-sm hover:shadow-md",
    error: "bg-error-600 text-white hover:bg-error-700 active:bg-error-800 focus:ring-error-500 disabled:bg-neutral-400 disabled:text-neutral-50 shadow-sm hover:shadow-md",
    warning: "bg-warning-500 text-white hover:bg-warning-600 active:bg-warning-700 focus:ring-warning-400 disabled:bg-neutral-400 disabled:text-neutral-50 shadow-sm hover:shadow-md",
    outline: "border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white active:bg-primary-700 focus:ring-primary-500 disabled:border-neutral-300 disabled:text-neutral-400 disabled:hover:bg-transparent disabled:hover:text-neutral-400",
    ghost: "text-primary-600 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-500 disabled:text-neutral-400 disabled:hover:bg-transparent"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm font-medium",
    md: "px-4 py-2 text-sm font-medium",
    lg: "px-6 py-3 text-base font-medium",
    xl: "px-8 py-4 text-lg font-semibold"
  };

  const classes = clsx(
    baseClasses,
    variants[variant],
    sizes[size],
    className
  );

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
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
      )}
      <span className={loading ? "opacity-75" : ""}>{children}</span>
    </motion.button>
  );
};

export default Button;