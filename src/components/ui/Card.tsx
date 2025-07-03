// Reusable Card component for LegalPro v1.0.1 - Professional Color Palette
import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  hover = false,
  clickable = false,
  onClick
}) => {
  const baseClasses = "rounded-xl transition-all duration-200";

  const variants = {
    default: "bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700",
    elevated: "bg-white dark:bg-neutral-800 shadow-lg border border-neutral-200 dark:border-neutral-700",
    outlined: "bg-white dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600",
    filled: "bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700"
  };

  const hoverClasses = hover ? "hover:shadow-lg hover:shadow-neutral-200/50 dark:hover:shadow-neutral-900/50 hover:-translate-y-1" : "";
  const clickableClasses = clickable ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-800" : "";

  const classes = clsx(baseClasses, variants[variant], hoverClasses, clickableClasses, className);

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