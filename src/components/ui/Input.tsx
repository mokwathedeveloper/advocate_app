// Reusable Input component for LegalPro v1.0.1 - WCAG 2.1 AA Compliant
import React, { useId } from 'react';
import { clsx } from 'clsx';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  inputSize?: 'sm' | 'md' | 'lg';
  showRequiredIndicator?: boolean;
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
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={id}
          className={classes}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          aria-required={required}
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
        <p id={errorId} role="alert" className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-1 text-sm text-neutral-600">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;