import type { CompanyProfile } from '@/hooks/useCompanyProfile';

export const DEFAULT_COMPANY_THEME = {
  primary: '#0f2847',
  secondary: '#6366f1',
  background: '#ffffff',
  surface: '#f8fafc',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
};

const clamp = (value: number) => Math.max(0, Math.min(255, value));

const isValidHex = (value: string) => /^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(value);

const hexToRgb = (hex?: string | null) => {
  const input = typeof hex === 'string' && isValidHex(hex) ? hex : DEFAULT_COMPANY_THEME.primary;
  const normalized = String(input ?? DEFAULT_COMPANY_THEME.primary)
    .replace('#', '')
    .trim();
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return { r: 15, g: 40, b: 71 };
  }

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
};

const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }) =>
  `#${[r, g, b]
    .map((channel) => clamp(channel).toString(16).padStart(2, '0'))
    .join('')}`;

const getLuminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const [sr, sg, sb] = [r, g, b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * sr + 0.7152 * sg + 0.0722 * sb;
};

const getReadableTextColor = (hex: string) =>
  getLuminance(hex) > 0.55 ? '#111827' : '#ffffff';

const mix = (hexA: string, hexB: string, weight: number) => {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return rgbToHex({
    r: Math.round(a.r * (1 - weight) + b.r * weight),
    g: Math.round(a.g * (1 - weight) + b.g * weight),
    b: Math.round(a.b * (1 - weight) + b.b * weight),
  });
};

const toRgbTriplet = (hex?: string | null) => {
  const { r, g, b } = hexToRgb(hex);
  return `${r} ${g} ${b}`;
};

const buildScale = (baseHex: string) => ({
  50: mix(baseHex, '#ffffff', 0.94),
  100: mix(baseHex, '#ffffff', 0.84),
  200: mix(baseHex, '#ffffff', 0.7),
  300: mix(baseHex, '#ffffff', 0.52),
  400: mix(baseHex, '#ffffff', 0.34),
  500: mix(baseHex, '#ffffff', 0.18),
  600: baseHex,
  700: mix(baseHex, '#000000', 0.12),
  800: mix(baseHex, '#000000', 0.24),
  900: mix(baseHex, '#000000', 0.36),
});

export interface AppliedCompanyTheme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  primaryScale: Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>;
  secondaryScale: Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>;
}

export const buildCompanyTheme = (
  profile?: Pick<CompanyProfile, 'primary_color' | 'secondary_color'> | null,
): AppliedCompanyTheme => {
  const primary = profile?.primary_color?.trim() || DEFAULT_COMPANY_THEME.primary;
  const secondary = profile?.secondary_color?.trim() || DEFAULT_COMPANY_THEME.secondary;
  const background = mix(primary, '#ffffff', 0.98);
  const surface = mix(primary, '#ffffff', 0.94);
  const text = getReadableTextColor(background);
  const textSecondary = mix(text, background, text === '#ffffff' ? 0.3 : 0.55);
  const border = mix(primary, '#e2e8f0', 0.25);

  return {
    primary,
    secondary,
    background,
    surface,
    text,
    textSecondary,
    border,
    primaryScale: buildScale(primary) as AppliedCompanyTheme['primaryScale'],
    secondaryScale: buildScale(secondary) as AppliedCompanyTheme['secondaryScale'],
  };
};

export const applyCompanyThemeToDocument = (theme: Partial<AppliedCompanyTheme>) => {
  const base = buildCompanyTheme({
    primary_color: theme.primary || DEFAULT_COMPANY_THEME.primary,
    secondary_color: theme.secondary || DEFAULT_COMPANY_THEME.secondary,
  });
  const resolved: AppliedCompanyTheme & { onPrimary: string } = {
    ...base,
    ...theme,
    primary: theme.primary || base.primary,
    secondary: theme.secondary || base.secondary,
    background: theme.background || base.background,
    surface: theme.surface || base.surface,
    text: theme.text || base.text,
    textSecondary: theme.textSecondary || base.textSecondary,
    border: theme.border || base.border,
    primaryScale: {
      ...base.primaryScale,
      ...(theme.primaryScale || {}),
    } as AppliedCompanyTheme['primaryScale'],
    secondaryScale: {
      ...base.secondaryScale,
      ...(theme.secondaryScale || {}),
    } as AppliedCompanyTheme['secondaryScale'],
    onPrimary: getReadableTextColor(theme.primary || base.primary),
  };
  const root = document.documentElement;
  const set = (name: string, value: string) => root.style.setProperty(name, value);

  set('--color-primary', resolved.primary);
  set('--color-primary-rgb', toRgbTriplet(resolved.primary));
  set('--color-primary-light', resolved.primaryScale[400]);
  set('--color-primary-dark', resolved.primaryScale[800]);
  set('--color-on-primary', resolved.onPrimary);
  set('--color-on-primary-rgb', toRgbTriplet(resolved.onPrimary));

  set('--color-secondary', resolved.secondary);
  set('--color-secondary-rgb', toRgbTriplet(resolved.secondary));
  set('--color-background', resolved.background);
  set('--color-background-rgb', toRgbTriplet(resolved.background));
  set('--color-surface', resolved.surface);
  set('--color-surface-rgb', toRgbTriplet(resolved.surface));
  set('--color-text', resolved.text);
  set('--color-text-rgb', toRgbTriplet(resolved.text));
  set('--color-text-secondary', resolved.textSecondary);
  set('--color-text-secondary-rgb', toRgbTriplet(resolved.textSecondary));
  set('--color-border', resolved.border);
  set('--color-border-rgb', toRgbTriplet(resolved.border));

  (
    Object.entries(resolved.primaryScale) as unknown as Array<
      [keyof AppliedCompanyTheme['primaryScale'], string]
    >
  ).forEach(([shade, value]) => {
    set(`--color-indigo-${shade}`, value);
    set(`--color-indigo-${shade}-rgb`, toRgbTriplet(value));
    set(`--color-primary-${shade}`, value);
    set(`--color-primary-${shade}-rgb`, toRgbTriplet(value));
  });

  (
    Object.entries(resolved.secondaryScale) as unknown as Array<
      [keyof AppliedCompanyTheme['secondaryScale'], string]
    >
  ).forEach(([shade, value]) => {
    set(`--color-secondary-${shade}`, value);
    set(`--color-secondary-${shade}-rgb`, toRgbTriplet(value));
  });
};

export const applyDefaultCompanyTheme = () =>
  applyCompanyThemeToDocument(buildCompanyTheme());
