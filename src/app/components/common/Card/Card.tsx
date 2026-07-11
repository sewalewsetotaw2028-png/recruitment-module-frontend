import React from 'react';
import { CARD, SHADOWS, BORDER_RADIUS, THEME_COLORS, TRANSITIONS } from '@/config/theme';

export interface CardProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  shadow?: 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | 'none';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  shadow = 'base',
  radius = 'lg',
  hover = false,
  clickable = false,
  onClick,
  className = '',
  style,
}) => {
  const paddingValue = padding === 'none' ? 0 : CARD.padding[padding];
  const shadowValue = shadow === 'none' ? 'none' : SHADOWS[shadow];
  const radiusValue = BORDER_RADIUS[radius];

  const baseStyle: React.CSSProperties = {
    backgroundColor: THEME_COLORS.surface,
    borderRadius: radiusValue,
    boxShadow: shadowValue,
    padding: paddingValue,
    border: `1px solid ${THEME_COLORS.border}`,
    transition: `all ${TRANSITIONS.duration.base} ${TRANSITIONS.easing.default}`,
    cursor: clickable ? 'pointer' : 'default',
    ...style,
  };

  const hoverStyle = (hover || clickable) ? {
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: SHADOWS.lg,
      borderColor: THEME_COLORS.primary100,
    },
  } : {};

  return (
    <div
      className={className}
      style={{
        ...baseStyle,
        ...hoverStyle,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
