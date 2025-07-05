import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useReducedMotion } from '../../hooks/useAccessibility';
import { LoadingOverlay, SkeletonCard } from './LoadingStates';
import { InlineError, RetryComponent } from './ErrorHandling';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';

  padding?: 'sm' | 'md' | 'lg';


  hover?: boolean;
  clickable?: boolean;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  skeleton?: boolean;
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  'aria-label'?: string;
  'aria-describedby'?: string;
  role?: string;
  tabIndex?: number;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  padding = 'md',
  hover = false,
  clickable = false,
  loading = false,
  error,
  onRetry,
  skeleton = false,
  onClick,
  onKeyDown,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  role,
  tabIndex,
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  // Base classes with accessibility support
  const baseClasses = "rounded-lg transition-all duration-200 focus:outline-none";
  const variantClasses = {
    default: "bg-white shadow-md border border-neutral-200",
    elevated: "bg-white shadow-lg border border-neutral-100",
    outlined: "bg-white border-2 border-neutral-300",
    filled: "bg-neutral-50 border border-neutral-200"
  };
  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8"
  };
  const hoverClasses = hover ? "hover:shadow-lg transition-shadow duration-200" : "";
  const clickableClasses = clickable
    ? "card-interactive cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
    : "";
  const classes = clsx(
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    hoverClasses,
    clickableClasses,
    className
  );

  // Handle keyboard interaction for clickable cards
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (clickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.();
    }
    onKeyDown?.(e);
  };
  
  // Motion settings that respect reduced motion preference
  const motionProps = prefersReducedMotion
    ? {}
    : {
        whileHover: hover ? { y: -2 } : undefined,
        whileTap: clickable ? { y: 0 } : undefined
      };

  // const baseClasses = "bg-white rounded-lg shadow-md border border-gray-200 relative";
  // const hoverClasses = hover && !loading ? "hover:shadow-lg transition-shadow duration-200" : "";
  // const clickableClasses = clickable && !loading ? "cursor-pointer" : "";


  // const variants = {
  //   default: "bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700",
  //   elevated: "bg-white dark:bg-neutral-800 shadow-lg border border-neutral-200 dark:border-neutral-700",
  //   outlined: "bg-white dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600",
  //   filled: "bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700"
  // };

  // const hoverClasses = hover ? "hover:shadow-lg hover:shadow-neutral-200/50 dark:hover:shadow-neutral-900/50 hover:-translate-y-1" : "";
  // const clickableClasses = clickable ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-800" : "";
  // const classes = clsx(baseClasses, variants[variant], hoverClasses, clickableClasses, className);

  // Show skeleton loader
  if (skeleton) {
    return <SkeletonCard className={className} />;
  }

  // Show error state
  if (error && onRetry) {
    return (
      <div className={classes}>
        <RetryComponent
          onRetry={onRetry}
          error={error}
          className="py-8"
        />
      </div>
    );
  }

  const CardContent = () => (
    <>
      {children}
      {loading && (
        <LoadingOverlay
          isVisible={loading}
          message="Loading..."
          size="md"
        />
      )}
      {error && !onRetry && (
        <div className="p-4">
          <InlineError error={error} />
        </div>
      )}
    </>
  );


  if (clickable || onClick) {
    return (
      <motion.div

        {...motionProps}
        ref={cardRef}
        className={classes}
        // onClick={onClick}
        // onKeyDown={handleKeyDown}
        // role={role || "button"}
        // tabIndex={tabIndex ?? 0}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        {...props}

        // whileHover={hover ? { y: -4, scale: 1.02 } : { y: -2 }}
        // whileTap={{ y: 0, scale: 0.98 }}
        // className={classes}
        // onClick={onClick}
        // tabIndex={0}
        // role="button"
        // onKeyDown={(e) => {
        //   if ((e.key === 'Enter' || e.key === ' ') && onClick) {

        whileHover={!loading ? { y: -2 } : {}}
        whileTap={!loading ? { y: 0 } : {}}
        // className={classes}
        onClick={!loading ? onClick : undefined}
        role={onClick ? "button" : undefined}
        tabIndex={onClick && !loading ? 0 : undefined}
        onKeyDown={(e) => {
          if (!loading && onClick && (e.key === 'Enter' || e.key === ' ')) {

            e.preventDefault();
            onClick();
          }
        }}

      >
        <CardContent />
      </motion.div>
    );
  }

  return (

    <div>

 <motion.div
      {...motionProps}
      ref={cardRef}
      className={classes}
      role={role}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      {...props}
    >
      {children}
    </motion.div>

{/* 
    <motion.div
      className={classes}
      whileHover={hover ? { y: -2 } : {}}
    >
      {children}
    </motion.div> */}

    <div className={classes}>
      <CardContent />
    </div>
    </div>

   


  );
};

export default Card;