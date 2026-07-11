import React, { useState, forwardRef } from 'react';
import { INPUT, THEME_COLORS, TRANSITIONS, BORDER_RADIUS, TYPOGRAPHY } from '@/config/theme';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'md',
      fullWidth = false,
      leftIcon,
      rightIcon,
      onRightIconClick,
      className = '',
      value,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!value);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      setHasValue(!!e.target.value);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      props.onChange?.(e);
    };

    const sizeStyles = INPUT.sizes[size];
    const errorState = error ? INPUT.states.error : focused ? INPUT.states.focus : INPUT.states.default;

    const containerStyle: React.CSSProperties = {
      position: 'relative',
      width: fullWidth ? '100%' : 'auto',
    };

    const inputStyle: React.CSSProperties = {
      width: '100%',
      height: sizeStyles.height,
      padding: leftIcon ? `0 ${sizeStyles.padding} 0 40px` : rightIcon ? `0 40px 0 ${sizeStyles.padding}` : `0 ${sizeStyles.padding}`,
      fontSize: sizeStyles.fontSize,
      fontFamily: TYPOGRAPHY.fontFamily.sans,
      fontWeight: TYPOGRAPHY.fontWeight.regular,
      lineHeight: 1.5,
      color: THEME_COLORS.textPrimary,
      backgroundColor: errorState.backgroundColor,
      border: `1px solid ${errorState.borderColor}`,
      borderRadius: BORDER_RADIUS.md,
      outline: 'none',
      transition: `all ${TRANSITIONS.duration.base} ${TRANSITIONS.easing.default}`,
      boxShadow: errorState.boxShadow ?? 'none',
      paddingTop: label ? '24px' : '0',
      paddingBottom: label ? '8px' : '0',
    };

    const labelStyle: React.CSSProperties = {
      position: 'absolute',
      left: leftIcon ? '40px' : sizeStyles.padding,
      top: focused || hasValue ? '8px' : '50%',
      transform: focused || hasValue ? 'translateY(0)' : 'translateY(-50%)',
      fontSize: focused || hasValue ? TYPOGRAPHY.fontSize.xs : sizeStyles.fontSize,
      fontWeight: focused || hasValue ? TYPOGRAPHY.fontWeight.medium : TYPOGRAPHY.fontWeight.regular,
      color: focused ? THEME_COLORS.primary : error ? THEME_COLORS.error : hasValue ? THEME_COLORS.textSecondary : THEME_COLORS.textTertiary,
      pointerEvents: 'none',
      transition: `all ${TRANSITIONS.duration.base} ${TRANSITIONS.easing.default}`,
      backgroundColor: 'transparent',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: 'calc(100% - 80px)',
    };

    const leftIconStyle: React.CSSProperties = {
      position: 'absolute',
      left: sizeStyles.padding,
      top: '50%',
      transform: 'translateY(-50%)',
      color: THEME_COLORS.textTertiary,
      display: 'flex',
      alignItems: 'center',
      pointerEvents: 'none',
    };

    const rightIconStyle: React.CSSProperties = {
      position: 'absolute',
      right: sizeStyles.padding,
      top: '50%',
      transform: 'translateY(-50%)',
      color: onRightIconClick ? THEME_COLORS.primary : THEME_COLORS.textTertiary,
      display: 'flex',
      alignItems: 'center',
      cursor: onRightIconClick ? 'pointer' : 'default',
      transition: `color ${TRANSITIONS.duration.base} ${TRANSITIONS.easing.default}`,
    };

    const helperTextStyle: React.CSSProperties = {
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: error ? THEME_COLORS.error : THEME_COLORS.textTertiary,
      marginTop: '4px',
      fontWeight: TYPOGRAPHY.fontWeight.regular,
    };

    return (
      <div className={className} style={containerStyle}>
        <div style={{ position: 'relative' }}>
          {label && (
            <label style={labelStyle}>
              {label}
            </label>
          )}
          {leftIcon && <div style={leftIconStyle}>{leftIcon}</div>}
          <input
            ref={ref}
            style={inputStyle}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />
          {rightIcon && (
            <div 
              style={rightIconStyle}
              onClick={onRightIconClick}
              onMouseEnter={(e) => {
                if (onRightIconClick) {
                  e.currentTarget.style.color = THEME_COLORS.primaryDark;
                }
              }}
              onMouseLeave={(e) => {
                if (onRightIconClick) {
                  e.currentTarget.style.color = THEME_COLORS.primary;
                }
              }}
            >
              {rightIcon}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <div style={helperTextStyle}>
            {error || helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
