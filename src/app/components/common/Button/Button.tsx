import React from 'react';
import { BUTTON, THEME_COLORS, TRANSITIONS, BORDER_RADIUS } from '@/config/theme';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const sizeStyles = BUTTON.sizes[size];
  const variantStyles = BUTTON.variants[variant];

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    height: sizeStyles.height,
    padding: sizeStyles.padding,
    fontSize: sizeStyles.fontSize,
    fontWeight: 600,
    borderRadius: BORDER_RADIUS.md,
    border: variant === 'secondary' ? '1px solid #e2e8f0' : 'none',
    backgroundColor: variantStyles.backgroundColor,
    color: variantStyles.color,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: `all ${TRANSITIONS.duration.base} ${TRANSITIONS.easing.default}`,
    width: fullWidth ? '100%' : 'auto',
  };

  const hoverStyles = !disabled && !loading ? {
    '&:hover': {
      backgroundColor: variantStyles.hover,
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  } : {};

  return (
    <button
      className={className}
      style={{
        ...baseStyles,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        ...hoverStyles,
      }}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span
            style={{
              display: 'inline-block',
              width: '16px',
              height: '16px',
              border: '2px solid currentColor',
              borderRadius: '50%',
              borderTopColor: 'transparent',
              animation: 'spin 0.6s linear infinite',
            }}
          />
          {children}
        </>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

export default Button;
