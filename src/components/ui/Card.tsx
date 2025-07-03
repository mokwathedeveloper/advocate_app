// Reusable Card component for LegalPro v1.0.1 - Mobile-First Responsive Design
import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  padding = 'md',
  hover = false,
  clickable = false,
  onClick
}) => {
  const baseClasses = "rounded-xl transition-all duration-200";

  const variants = {
    default: "bg-white shadow-sm border border-neutral-200",
    elevated: "bg-white shadow-lg border border-neutral-200",
    outlined: "bg-white border-2 border-neutral-300",
    filled: "bg-neutral-50 border border-neutral-200"
  };

  // Mobile-first responsive padding
  const paddings = {
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-6 lg:p-8",
    lg: "p-6 sm:p-8 lg:p-10"
  };

  const hoverClasses = hover ? "hover:shadow-lg hover:shadow-neutral-200/50 hover:-translate-y-1" : "";
  const clickableClasses = clickable ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white" : "";

  const classes = clsx(
    baseClasses,
    variants[variant],
    paddings[padding],
    hoverClasses,
    clickableClasses,
    className
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
            e.preventDefault();
            onClick();
          }
        }}
      >
        {children}
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
  );
};

export default Card;