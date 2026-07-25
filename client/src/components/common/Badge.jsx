import React from 'react';
import { cn } from '../../utils/cn';

const variants = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  gold: 'bg-gold-100 text-gold-800',
  gray: 'bg-gray-100 text-gray-800',
};

const Badge = ({ children, variant = 'gray', className }) => {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

export default Badge;
