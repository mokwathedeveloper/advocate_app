// Enhanced Input component for LegalPro v1.0.1 - With Error Handling & Accessibility
import React from 'react';
import { clsx } from 'clsx';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  success?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  icon,
  success = false,
  loading = false,
  fullWidth = true,
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  const baseClasses = "px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed";
  const widthClasses = fullWidth ? "w-full" : "";
  const stateClasses = error
    ? "border-red-500 focus:ring-red-500"
    : success
    ? "border-green-500 focus:ring-green-500"
    : "border-gray-300";
  const iconClasses = (icon || error || success || loading) ? "pl-10" : "";

  const classes = clsx(baseClasses, widthClasses, stateClasses, iconClasses, className);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      <div className="relative">
        {(icon || error || success || loading) && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-navy-500" aria-hidden="true" />
            ) : error ? (
              <AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
            ) : success ? (
              <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
            ) : (
              icon
            )}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={classes}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={clsx(errorId, helperId).trim() || undefined}
          {...props}
        />
      </div>
      {error && (
        <p
          id={errorId}
          className="mt-1 text-sm text-red-600 flex items-center"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" aria-hidden="true" />
          {error}
        </p>
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