
// Reusable Card component for LegalPro v1.0.1 - Professional Color Palette

// Enhanced Card component for LegalPro v1.0.1 - With Loading & Error States

import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { LoadingOverlay, SkeletonCard } from './LoadingStates';
import { InlineError, RetryComponent } from './ErrorHandling';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  hover?: boolean;
  clickable?: boolean;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  skeleton?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  hover = false,
  clickable = false,
  loading = false,
  error,
  onRetry,
  skeleton = false,
  onClick
}) => {

  const baseClasses = "rounded-xl transition-all duration-200";

  const baseClasses = "bg-white rounded-lg shadow-md border border-gray-200 relative";
  const hoverClasses = hover && !loading ? "hover:shadow-lg transition-shadow duration-200" : "";
  const clickableClasses = clickable && !loading ? "cursor-pointer" : "";


  const variants = {
    default: "bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700",
    elevated: "bg-white dark:bg-neutral-800 shadow-lg border border-neutral-200 dark:border-neutral-700",
    outlined: "bg-white dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600",
    filled: "bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700"
  };

  const hoverClasses = hover ? "hover:shadow-lg hover:shadow-neutral-200/50 dark:hover:shadow-neutral-900/50 hover:-translate-y-1" : "";
  const clickableClasses = clickable ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-800" : "";

  const classes = clsx(baseClasses, variants[variant], hoverClasses, clickableClasses, className);

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

        whileHover={hover ? { y: -4, scale: 1.02 } : { y: -2 }}
        whileTap={{ y: 0, scale: 0.98 }}
        className={classes}
        onClick={onClick}
        tabIndex={0}
        role="button"
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && onClick) {

        whileHover={!loading ? { y: -2 } : {}}
        whileTap={!loading ? { y: 0 } : {}}
        className={classes}
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

    <motion.div
      className={classes}
      whileHover={hover ? { y: -2 } : {}}
    >
      {children}
    </motion.div>

    <div className={classes}>
      <CardContent />
    </div>

  );
};

export default Card;