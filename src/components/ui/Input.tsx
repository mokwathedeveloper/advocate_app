// Reusable Input component for LegalPro v1.0.1 - Professional Color Palette
import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  icon,
  variant = 'default',
  size = 'md',
  className,
  ...props
}, ref) => {
  const baseClasses = "w-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50";

  const variants = {
    default: "border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 rounded-lg",
    filled: "border-0 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 rounded-lg",
    outlined: "border-2 border-neutral-300 dark:border-neutral-600 bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 rounded-lg"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-3 py-2 text-base",
    lg: "px-4 py-3 text-lg"
  };

  const errorClasses = error
    ? "border-error-500 focus:ring-error-500 focus:border-error-500"
    : "hover:border-neutral-400 dark:hover:border-neutral-500 focus:border-primary-500";

  const iconClasses = icon ? (size === 'lg' ? "pl-12" : size === 'sm' ? "pl-8" : "pl-10") : "";

  const classes = clsx(baseClasses, variants[variant], sizes[size], errorClasses, iconClasses, className);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          {label}
          {props.required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className={clsx(
            "absolute inset-y-0 left-0 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500",
            size === 'lg' ? "pl-4" : size === 'sm' ? "pl-2.5" : "pl-3"
          )}>
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={classes}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-error-600 dark:text-error-400 flex items-center">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;