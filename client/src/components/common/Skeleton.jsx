import React from 'react';
import { cn } from '../../utils/cn';

const Skeleton = ({ className, variant = 'line', ...props }) => {
  if (variant === 'card') {
    return (
      <div className={cn("animate-pulse bg-gray-200 rounded-lg h-64 w-full", className)} {...props} />
    );
  }
  if (variant === 'image') {
    return (
      <div className={cn("animate-pulse bg-gray-200 aspect-square w-full rounded-md", className)} {...props} />
    );
  }
  return (
    <div className={cn("animate-pulse bg-gray-200 rounded h-4 w-full", className)} {...props} />
  );
};

export default Skeleton;
