import React from 'react';
import { BADGE, BORDER_RADIUS, TYPOGRAPHY, TRANSITIONS } from '@/config/theme';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  style,
}) => {
  const sizeStyles = BADGE.sizes[size];
  const variantStyles = BADGE.variants[variant === 'danger' ? 'error' : variant];

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    height: dot ? '8px' : sizeStyles.height,
    width: dot ? '8px' : 'auto',
    padding: dot ? '0' : sizeStyles.padding,
    fontSize: sizeStyles.fontSize,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    lineHeight: 1,
    borderRadius: dot ? BORDER_RADIUS.full : BORDER_RADIUS.full,
    backgroundColor: variantStyles.backgroundColor,
    color: variantStyles.color,
    textTransform: 'uppercase',
    letterSpacing: TYPOGRAPHY.letterSpacing.wide,
    whiteSpace: 'nowrap',
    transition: `all ${TRANSITIONS.duration.fast} ${TRANSITIONS.easing.default}`,
    ...style,
  };

  return (
    <span
      className={className}
      style={baseStyle}
    >
      {!dot && children}
    </span>
  );
};

export default Badge;
