// Enhanced Card component for LegalPro v1.0.1 - With Loading & Error States
import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { LoadingOverlay, SkeletonCard } from './LoadingStates';
import { InlineError, RetryComponent } from './ErrorHandling';

interface CardProps {
  children: React.ReactNode;
  className?: string;
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
  hover = false,
  clickable = false,
  loading = false,
  error,
  onRetry,
  skeleton = false,
  onClick
}) => {
  const baseClasses = "bg-white rounded-lg shadow-md border border-gray-200 relative";
  const hoverClasses = hover && !loading ? "hover:shadow-lg transition-shadow duration-200" : "";
  const clickableClasses = clickable && !loading ? "cursor-pointer" : "";

  const classes = clsx(baseClasses, hoverClasses, clickableClasses, className);

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
    <div className={classes}>
      <CardContent />
    </div>
  );
};

export default Card;