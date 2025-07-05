import React, { useId } from 'react';
import { clsx } from 'clsx';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;

  inputSize?: 'sm' | 'md' | 'lg';
  showRequiredIndicator?: boolean;

  variant?: 'default' | 'filled' | 'outlined';
  // size?: 'sm' | 'md' | 'lg';

  success?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  icon,

  variant = 'default',
  inputSize = 'md',
  showRequiredIndicator = false,
  className,
  required,
  id: providedId,
  ...props
}, ref) => {
  const generatedId = useId();
  const id = providedId || generatedId;
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  // Build aria-describedby
  const describedBy = [
    error ? errorId : null,
    helperText ? helperId : null
  ].filter(Boolean).join(' ') || undefined;

  // WCAG 2.1 AA compliant base classes with proper focus indicators
  const baseClasses = "input-accessible w-full border rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50";

  // Variant styles
  const variantClasses = {
    default: "bg-white border-neutral-300 focus-visible:border-primary-500",
    filled: "bg-neutral-50 border-neutral-200 focus-visible:bg-white focus-visible:border-primary-500",
    outlined: "bg-transparent border-2 border-neutral-300 focus-visible:border-primary-500"
  };

  // Size classes with touch-friendly targets
  const sizeClasses = {
    sm: "px-3 py-2 text-sm min-h-[44px]",
    md: "px-3 py-2.5 text-base min-h-[44px]",
    lg: "px-4 py-3 text-lg min-h-[48px]"
  };

  // State-based classes
  const stateClasses = error
    ? "error-state border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500"
    : "";

  const iconClasses = icon ? "pl-10" : "";

  const classes = clsx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[inputSize],
    stateClasses,
    iconClasses,
    className
  );

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

  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const widthClasses = props.fullWidth ? "w-full" : "";

  return (
    <div className="w-full">
      {label && (

        <label
          htmlFor={id}
          className="block text-sm font-medium text-neutral-700 mb-1"
        >
          {label}
          {(required || showRequiredIndicator) && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}

        </label>
      )}

      <div className="relative">
        {icon && (

          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">

            {/* <div className={clsx(
            "absolute inset-y-0 left-0 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500",
            size === 'lg' ? "pl-4" : size === 'sm' ? "pl-2.5" : "pl-3"
          )}> */}

            {icon}

            <label
              htmlFor={inputId}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {label}
              {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
            </label>

          </div>


        )}

      </div>

      <div className="relative">
        {(icon || error || props.success || props.loading) && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {props.loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-navy-500" aria-hidden="true" />
            ) : error ? (
              <AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
            ) : props.success ? (
              <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
            ) : (
              icon
            )}

          </div>
        )}
        <input
          ref={ref}

          // id={id}
          // className={classes}
          // aria-invalid={error ? 'true' : 'false'}
          // aria-describedby={describedBy}
          // aria-required={required}

          id={inputId}
          className={classes}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={clsx(errorId, helperId).trim() || undefined}

          {...props}
        />
        {/* Status indicator for screen readers */}
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
          </div>
        )}
      </div>

      {error && (

        <div>
          <p id={errorId} role="alert" className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" aria-hidden="true" />
          </p>


          <p className="mt-2 text-sm text-error-600 dark:text-error-400 flex items-center">
            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </p>

          <p
            id={errorId}
            className="mt-1 text-sm text-red-600 flex items-center"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" aria-hidden="true" />


            {error}
          </p>
        </div>
      )}


      {helperText && !error && (
        <p
          id={helperId}
          className="mt-1 text-sm text-gray-500"
        >
          {helperText}
        </p>


      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
