// Reusable Card component for LegalPro v1.0.1 - WCAG 2.1 AA Compliant
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useReducedMotion } from '../../hooks/useAccessibility';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  clickable?: boolean;
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

  // Variant styles
  const variantClasses = {
    default: "bg-white shadow-md border border-neutral-200",
    elevated: "bg-white shadow-lg border border-neutral-100",
    outlined: "bg-white border-2 border-neutral-300",
    filled: "bg-neutral-50 border border-neutral-200"
  };

  // Padding variants
  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8"
  };

  // Interactive states
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

  if (clickable || onClick) {
    return (
      <motion.div
        {...motionProps}
        ref={cardRef}
        className={classes}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role={role || "button"}
        tabIndex={tabIndex ?? 0}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
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
  );
};

export default Card;