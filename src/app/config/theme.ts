/**
 * Theme configuration and design tokens
 * Comprehensive design system for the candidate portal
 */

// ─── Color Tokens ───────────────────────────────────────────────────────────────

export const THEME_COLORS = {
  // Primary brand color and its variations
  primary: '#0f2847',
  primaryRgb: '15 40 71',
  primaryLight: '#1a3a5f',
  primaryDark: '#0a1c32',

  // Primary color palette (Tailwind scale)
  primary100: '#d4e3ff',
  primary200: '#afc8f0',
  primary300: '#7a9dc9',
  primary400: '#5376a1',
  primary500: '#305379',
  primary600: '#0f2847',
  primary700: '#0a1f38',
  primary800: '#07172a',
  primary900: '#030e1a',

  // Semantic colors
  success: '#10b981',
  successLight: '#d1fae5',
  successDark: '#059669',
  
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  warningDark: '#d97706',
  
  error: '#ef4444',
  errorLight: '#fee2e2',
  errorDark: '#dc2626',
  
  info: '#3b82f6',
  infoLight: '#dbeafe',
  infoDark: '#2563eb',

  // Neutral colors (slate scale)
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',

  // Surface colors
  white: '#ffffff',
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceHover: '#f1f5f9',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',

  // Text colors
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  textInverse: '#ffffff',

  // Surface and background
  onPrimaryRgb: '255 255 255',
} as const;

// ─── Spacing Tokens ──────────────────────────────────────────────────────────────

export const SPACING = {
  // Base spacing unit (4px)
  base: 4,
  
  // Spacing scale
  xs: 4,    // 4px
  sm: 8,    // 8px
  md: 12,   // 12px
  lg: 16,   // 16px
  xl: 24,   // 24px
  '2xl': 32,  // 32px
  '3xl': 48,  // 48px
  '4xl': 64,  // 64px
  '5xl': 96,  // 96px
  '6xl': 128, // 128px

  // Component-specific spacing
  cardPadding: 16,
  sectionGap: 24,
  elementGap: 8,
  formGroupGap: 16,
} as const;

// ─── Typography Tokens ───────────────────────────────────────────────────────────

export const TYPOGRAPHY = {
  // Font families
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  },

  // Font sizes
  fontSize: {
    xs: '12px',    // 0.75rem
    sm: '14px',    // 0.875rem
    base: '16px',  // 1rem
    lg: '18px',    // 1.125rem
    xl: '20px',    // 1.25rem
    '2xl': '24px', // 1.5rem
    '3xl': '30px', // 1.875rem
    '4xl': '36px', // 2.25rem
    '5xl': '48px', // 3rem
    '6xl': '60px', // 3.75rem
  },

  // Font weights
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter spacing
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Heading hierarchy
  heading: {
    h1: {
      fontSize: '32px',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '24px',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '20px',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0',
    },
    h4: {
      fontSize: '16px',
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0',
    },
    h5: {
      fontSize: '14px',
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0',
    },
    h6: {
      fontSize: '12px',
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0.05em',
    },
  },

  // Body text
  body: {
    large: {
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    base: {
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    small: {
      fontSize: '12px',
      fontWeight: 400,
      lineHeight: 1.4,
    },
  },
} as const;

// ─── Border Radius Tokens ─────────────────────────────────────────────────────────

export const BORDER_RADIUS = {
  none: '0',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  full: '9999px',
} as const;

// ─── Shadow Tokens ───────────────────────────────────────────────────────────────

export const SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const;

// ─── Transition Tokens ───────────────────────────────────────────────────────────

export const TRANSITIONS = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// ─── Z-Index Tokens ──────────────────────────────────────────────────────────────

export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// ─── Breakpoint Tokens ────────────────────────────────────────────────────────────

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ─── Button Tokens ───────────────────────────────────────────────────────────────

export const BUTTON = {
  sizes: {
    sm: {
      height: '32px',
      padding: '0 12px',
      fontSize: '12px',
    },
    md: {
      height: '40px',
      padding: '0 16px',
      fontSize: '14px',
    },
    lg: {
      height: '48px',
      padding: '0 24px',
      fontSize: '16px',
    },
  },
  variants: {
    primary: {
      backgroundColor: THEME_COLORS.primary,
      color: THEME_COLORS.textInverse,
      hover: THEME_COLORS.primaryLight,
    },
    secondary: {
      backgroundColor: 'transparent',
      color: THEME_COLORS.primary,
      border: `1px solid ${THEME_COLORS.border}`,
      hover: THEME_COLORS.surfaceHover,
    },
    tertiary: {
      backgroundColor: 'transparent',
      color: THEME_COLORS.primary,
      hover: THEME_COLORS.surfaceHover,
    },
    danger: {
      backgroundColor: THEME_COLORS.error,
      color: THEME_COLORS.textInverse,
      hover: THEME_COLORS.errorDark,
    },
  },
} as const;

// ─── Input Tokens ────────────────────────────────────────────────────────────────

export const INPUT = {
  sizes: {
    sm: {
      height: '32px',
      padding: '0 12px',
      fontSize: '12px',
    },
    md: {
      height: '40px',
      padding: '0 16px',
      fontSize: '14px',
    },
    lg: {
      height: '48px',
      padding: '0 20px',
      fontSize: '16px',
    },
  },
  states: {
    default: {
      borderColor: THEME_COLORS.border,
      backgroundColor: THEME_COLORS.surface,
    },
    focus: {
      borderColor: THEME_COLORS.primary,
      boxShadow: `0 0 0 3px ${THEME_COLORS.primary100}`,
    },
    error: {
      borderColor: THEME_COLORS.error,
      boxShadow: `0 0 0 3px ${THEME_COLORS.errorLight}`,
    },
  },
} as const;

// ─── Card Tokens ─────────────────────────────────────────────────────────────────

export const CARD = {
  padding: {
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },
  shadow: SHADOWS.base,
  radius: BORDER_RADIUS.lg,
} as const;

// ─── Badge Tokens ────────────────────────────────────────────────────────────────

export const BADGE = {
  sizes: {
    sm: {
      padding: '2px 8px',
      fontSize: '10px',
      height: '20px',
    },
    md: {
      padding: '4px 12px',
      fontSize: '12px',
      height: '24px',
    },
    lg: {
      padding: '6px 16px',
      fontSize: '14px',
      height: '28px',
    },
  },
  variants: {
    default: {
      backgroundColor: THEME_COLORS.slate100,
      color: THEME_COLORS.textSecondary,
    },
    primary: {
      backgroundColor: THEME_COLORS.primary100,
      color: THEME_COLORS.primary,
    },
    success: {
      backgroundColor: THEME_COLORS.successLight,
      color: THEME_COLORS.successDark,
    },
    warning: {
      backgroundColor: THEME_COLORS.warningLight,
      color: THEME_COLORS.warningDark,
    },
    error: {
      backgroundColor: THEME_COLORS.errorLight,
      color: THEME_COLORS.errorDark,
    },
    info: {
      backgroundColor: THEME_COLORS.infoLight,
      color: THEME_COLORS.infoDark,
    },
  },
} as const;

// ─── Legacy Exports (for backward compatibility) ───────────────────────────────────

// Export hex color for direct CSS use
export const PRIMARY_COLOR_HEX = THEME_COLORS.primary;

// Export RGB for CSS variables
export const PRIMARY_COLOR_RGB = THEME_COLORS.primaryRgb;

// Export Tailwind class name
export const PRIMARY_COLOR_CLASS = 'text-primary';

// Color used for icon badges and accent highlights
export const PRIMARY_ACCENT_COLOR_HEX = THEME_COLORS.primary100;
export const PRIMARY_ACCENT_COLOR_CLASS = 'bg-primary/10';

// ─── Default Export ───────────────────────────────────────────────────────────────

export default THEME_COLORS;
