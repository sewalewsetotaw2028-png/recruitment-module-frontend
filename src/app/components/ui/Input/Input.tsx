import React from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  size = 'md',
  className = '',
  ...props
}) => {
  const baseClasses =
    'rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  };

  const stateClasses = error
    ? 'border-red-500 focus:ring-red-500/20'
    : 'border-outline-variant focus:ring-primary/20 focus:border-primary';

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-semibold text-on-surface-variant">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            {leftIcon}
          </div>
        )}
        <input
          className={`${baseClasses} ${sizeClasses[size]} ${stateClasses} ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {helperText && !error && (
        <p className="text-sm text-on-surface-variant">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
