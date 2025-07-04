// Skeleton Loader Components for LegalPro v1.0.1 - Accessible Loading States
import React from 'react';
import { clsx } from 'clsx';

// Base skeleton props
export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  animate?: boolean;
}

// Skeleton text props
export interface SkeletonTextProps {
  lines?: number;
  className?: string;
  lineHeight?: string;
  lastLineWidth?: string;
}

// Skeleton card props
export interface SkeletonCardProps {
  className?: string;
  showImage?: boolean;
  imageHeight?: string;
  lines?: number;
  showActions?: boolean;
}

/**
 * Base Skeleton component
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width,
  height,
  rounded = false,
  animate = true
}) => {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={clsx(
        'bg-gray-200',
        animate && 'animate-pulse',
        rounded ? 'rounded-full' : 'rounded',
        className
      )}
      style={style}
      role="status"
      aria-label="Loading content"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Skeleton Text component for text content
 */
export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className,
  lineHeight = 'h-4',
  lastLineWidth = '75%'
}) => {
  return (
    <div className={clsx('space-y-2', className)} role="status" aria-label="Loading text content">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={lineHeight}
          width={index === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
      <span className="sr-only">Loading text content...</span>
    </div>
  );
};

/**
 * Skeleton Avatar component
 */
export const SkeletonAvatar: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <Skeleton
      className={clsx(sizeClasses[size], className)}
      rounded
    />
  );
};

/**
 * Skeleton Button component
 */
export const SkeletonButton: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-32'
  };

  return (
    <Skeleton
      className={clsx(sizeClasses[size], 'rounded-md', className)}
    />
  );
};

/**
 * Skeleton Card component for card layouts
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className,
  showImage = true,
  imageHeight = 'h-48',
  lines = 3,
  showActions = true
}) => {
  return (
    <div 
      className={clsx('bg-white rounded-lg shadow p-6 space-y-4', className)}
      role="status"
      aria-label="Loading card content"
    >
      {/* Image skeleton */}
      {showImage && (
        <Skeleton className={clsx('w-full rounded-md', imageHeight)} />
      )}

      {/* Title skeleton */}
      <Skeleton className="h-6 w-3/4" />

      {/* Text content skeleton */}
      <SkeletonText lines={lines} lineHeight="h-4" />

      {/* Actions skeleton */}
      {showActions && (
        <div className="flex space-x-3 pt-4">
          <SkeletonButton size="sm" />
          <SkeletonButton size="sm" />
        </div>
      )}

      <span className="sr-only">Loading card content...</span>
    </div>
  );
};

/**
 * Skeleton Table component
 */
export const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
  showHeader?: boolean;
}> = ({ rows = 5, columns = 4, className, showHeader = true }) => {
  return (
    <div 
      className={clsx('bg-white rounded-lg shadow overflow-hidden', className)}
      role="status"
      aria-label="Loading table content"
    >
      {/* Table header skeleton */}
      {showHeader && (
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, index) => (
              <Skeleton key={index} className="h-4 flex-1" />
            ))}
          </div>
        </div>
      )}

      {/* Table rows skeleton */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  className="h-4 flex-1" 
                  width={colIndex === 0 ? '60%' : '100%'}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Loading table content...</span>
    </div>
  );
};

/**
 * Skeleton List component
 */
export const SkeletonList: React.FC<{
  items?: number;
  className?: string;
  showAvatar?: boolean;
  showActions?: boolean;
}> = ({ items = 5, className, showAvatar = true, showActions = false }) => {
  return (
    <div 
      className={clsx('bg-white rounded-lg shadow divide-y divide-gray-200', className)}
      role="status"
      aria-label="Loading list content"
    >
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="p-4 flex items-center space-x-4">
          {/* Avatar */}
          {showAvatar && <SkeletonAvatar size="md" />}

          {/* Content */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex space-x-2">
              <SkeletonButton size="sm" />
            </div>
          )}
        </div>
      ))}

      <span className="sr-only">Loading list content...</span>
    </div>
  );
};

/**
 * Skeleton Form component
 */
export const SkeletonForm: React.FC<{
  fields?: number;
  className?: string;
  showSubmitButton?: boolean;
}> = ({ fields = 4, className, showSubmitButton = true }) => {
  return (
    <div 
      className={clsx('bg-white rounded-lg shadow p-6 space-y-6', className)}
      role="status"
      aria-label="Loading form content"
    >
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          {/* Field label */}
          <Skeleton className="h-4 w-1/4" />
          {/* Field input */}
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}

      {/* Submit button */}
      {showSubmitButton && (
        <div className="pt-4">
          <SkeletonButton size="lg" className="w-full" />
        </div>
      )}

      <span className="sr-only">Loading form content...</span>
    </div>
  );
};

/**
 * Skeleton Dashboard component for dashboard layouts
 */
export const SkeletonDashboard: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <div 
      className={clsx('space-y-6', className)}
      role="status"
      aria-label="Loading dashboard content"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-1/3" />
        <SkeletonButton size="md" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6 space-y-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2">
          <SkeletonCard showImage={false} lines={5} showActions={false} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <SkeletonList items={3} showAvatar={false} />
          <SkeletonCard showImage={false} lines={2} />
        </div>
      </div>

      <span className="sr-only">Loading dashboard content...</span>
    </div>
  );
};

export default Skeleton;
