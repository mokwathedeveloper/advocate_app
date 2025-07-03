// Reusable Input component for LegalPro v1.0.1 - Mobile-First Responsive Design
import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  inputSize?: 'sm' | 'md' | 'lg';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  icon,
  variant = 'default',
  inputSize = 'md',
  className,
  ...props
}, ref) => {
  const baseClasses = "w-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50";

  const variants = {
    default: "border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-500 rounded-lg",
    filled: "border-0 bg-neutral-100 text-neutral-900 placeholder-neutral-500 rounded-lg",
    outlined: "border-2 border-neutral-300 bg-transparent text-neutral-900 placeholder-neutral-500 rounded-lg"
  };

  // Mobile-first responsive sizing with touch-friendly targets
  const sizes = {
    sm: "px-3 py-2 text-sm min-h-touch-target",
    md: "px-3 py-2.5 text-base min-h-touch-target sm:px-4 sm:py-3",
    lg: "px-4 py-3.5 text-lg min-h-touch-target-lg sm:px-5 sm:py-4"
  };

  const errorClasses = error
    ? "border-error-500 focus:ring-error-500 focus:border-error-500"
    : "hover:border-neutral-400 focus:border-primary-500";

  const iconClasses = icon ? (inputSize === 'lg' ? "pl-12 sm:pl-14" : inputSize === 'sm' ? "pl-8 sm:pl-10" : "pl-10 sm:pl-12") : "";

  const classes = clsx(baseClasses, variants[variant], sizes[inputSize], errorClasses, iconClasses, className);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-2 sm:text-base">
          {label}
          {props.required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className={clsx(
            "absolute inset-y-0 left-0 flex items-center pointer-events-none text-neutral-400",
            inputSize === 'lg' ? "pl-4 sm:pl-5" : inputSize === 'sm' ? "pl-2.5 sm:pl-3" : "pl-3 sm:pl-4"
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
        <p className="mt-2 text-sm text-error-600 flex items-center sm:text-base">
          <svg className="w-4 h-4 mr-1 flex-shrink-0 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-neutral-500 sm:text-base">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;