// Enhanced Button component for LegalPro v1.0.1 - With Loading & Error States
import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-navy-800 text-white hover:bg-navy-700 focus:ring-navy-500 disabled:bg-gray-400",
    secondary: "bg-gold-500 text-white hover:bg-gold-600 focus:ring-gold-400 disabled:bg-gray-400",
    outline: "border-2 border-navy-800 text-navy-800 hover:bg-navy-800 hover:text-white focus:ring-navy-500 disabled:border-gray-400 disabled:text-gray-400",
    ghost: "text-navy-800 hover:bg-navy-100 focus:ring-navy-500 disabled:text-gray-400",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-gray-400"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm min-h-[32px]",
    md: "px-4 py-2 text-base min-h-[40px]",
    lg: "px-6 py-3 text-lg min-h-[48px]",
    xl: "px-8 py-4 text-xl min-h-[56px]"
  };

  const classes = clsx(
    baseClasses,
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    className
  );

  const spinnerSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' || size === 'xl' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      className={classes}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-describedby={loading ? 'loading-description' : undefined}
      {...props}
    >
      {loading && (
        <>
          <Loader2 className={clsx('animate-spin mr-2', spinnerSize)} aria-hidden="true" />
          <span id="loading-description" className="sr-only">
            {loadingText || 'Loading, please wait...'}
          </span>
        </>
      )}
      <span className={loading ? 'opacity-75' : ''}>
        {loading && loadingText ? loadingText : children}
      </span>
    </motion.button>
  );
};

export default Button;