import React from 'react';
import { cn } from '../../utils/cn';
import Spinner from './Spinner';

const variants = {
  primary: 'bg-gold-500 hover:bg-gold-600 text-white border-transparent shadow-sm',
  secondary: 'bg-charcoal-900 hover:bg-charcoal-800 text-white border-transparent',
  outline: 'bg-transparent hover:bg-gray-50 text-charcoal-900 border-gray-300',
  ghost: 'bg-transparent hover:bg-gray-100 text-charcoal-900 border-transparent',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

const Button = React.forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  icon: Icon,
  children, 
  disabled, 
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={isLoading || disabled}
      className={cn(
        'inline-flex items-center justify-center border font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500',
        variants[variant],
        sizes[size],
        (isLoading || disabled) && 'opacity-60 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {isLoading && <Spinner className="mr-2 h-4 w-4" />}
      {!isLoading && Icon && <Icon className="mr-2 -ml-1 h-5 w-5" />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
