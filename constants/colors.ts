// Nested colour palette used across the pro side and shared UI components.
//
// `Colors` remains the static light palette so any screen that has not yet been
// migrated to `useTheme()` keeps rendering correctly. Screens that opt into dark
// mode read the live palette from `useTheme().colors`, whose shape is identical
// to this object (see `lightColors` / `darkColors` below).

export type ColorPalette = {
  amber: { primary: string; light: string; dark: string; text: string };
  navy: { primary: string; light: string; text: string };
  blue: { primary: string; light: string; mid: string; border: string; text: string };
  success: string;
  error: string;
  warning: string;
  white: string;
  surface: string;
  surfaceAlt: string;
  bg: string;
  offWhite: string;
  lightGray: string;
  midGray: string;
  darkGray: string;
  border: string;
  text: { primary: string; secondary: string; muted: string; white: string };
};

export const lightColors: ColorPalette = {
  amber: {
    primary: '#F5A623',
    light: '#FEF3C7',
    dark: '#D97706',
    text: '#92400E'
  },
  navy: {
    primary: '#0D1B3E',
    light: '#1E3A6E',
    text: '#0D1B3E'
  },
  blue: {
    primary: '#2563EB',
    light: '#EFF6FF',
    mid: '#3B82F6',
    border: '#BFDBFE',
    text: '#1D4ED8'
  },
  success: '#10B981',
  error: '#EF4444',
  warning: '#F97316',
  white: '#FFFFFF',
  // Semantic surfaces — prefer these over `white`/`offWhite` for new code so
  // dark mode resolves correctly.
  surface: '#FFFFFF',
  surfaceAlt: '#F3F4F6',
  bg: '#F9FAFB',
  offWhite: '#F9FAFB',
  lightGray: '#F3F4F6',
  midGray: '#9CA3AF',
  darkGray: '#374151',
  border: '#E5E7EB',
  text: {
    primary: '#0D1B3E',
    secondary: '#374151',
    muted: '#9CA3AF',
    white: '#FFFFFF'
  }
};

export const darkColors: ColorPalette = {
  amber: {
    primary: '#F5A623', // brand accent stays vivid on dark surfaces
    light: '#3A2E12',   // tinted chip background
    dark: '#FBBF4D',    // used as text/icon — lighten for contrast
    text: '#FCD9A0'
  },
  navy: {
    primary: '#0D1B3E', // kept dark — drives gradient headers + on-amber icons
    light: '#1E3A6E',
    text: '#E8ECF6'     // navy.text is used as foreground text — lighten it
  },
  blue: {
    primary: '#3B82F6',
    light: '#16233B',
    mid: '#60A5FA',
    border: '#26345A',
    text: '#93C5FD'
  },
  success: '#34D399',
  error: '#F87171',
  warning: '#FB923C',
  white: '#FFFFFF', // on-gradient text + knobs stay white
  surface: '#161C2E',
  surfaceAlt: '#1E2640',
  bg: '#0B1020',
  offWhite: '#0B1020',
  lightGray: '#1E2438',
  midGray: '#8A93AD',
  darkGray: '#C7CEDE',
  border: '#2A3147',
  text: {
    primary: '#F4F6FB',
    secondary: '#C7CEDE',
    muted: '#8A93AD',
    white: '#FFFFFF'
  }
};

// Static light palette for not-yet-migrated screens.
export const Colors = lightColors;
