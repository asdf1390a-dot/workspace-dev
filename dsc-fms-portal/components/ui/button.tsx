import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', disabled, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
      outline: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 active:bg-slate-100',
      destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
      secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300 active:bg-slate-400',
      ghost: 'text-slate-900 hover:bg-slate-100 active:bg-slate-200',
    };

    const sizeClasses = {
      default: 'px-4 py-2 text-base',
      sm: 'px-3 py-1 text-sm',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        disabled={disabled}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
