// Reusable Card component for LegalPro v1.0.1
import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false,
  clickable = false,
  onClick
}) => {
  const baseClasses = "bg-white rounded-lg shadow-md border border-gray-200";
  const hoverClasses = hover ? "hover:shadow-lg transition-shadow duration-200" : "";
  const clickableClasses = clickable ? "cursor-pointer" : "";

  const classes = clsx(baseClasses, hoverClasses, clickableClasses, className);

  if (clickable || onClick) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ y: 0 }}
        className={classes}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export default Card;