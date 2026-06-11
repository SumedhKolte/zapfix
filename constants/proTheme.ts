import { lightColors, type ColorPalette } from './colors';

// Builds the pro design-system theme from a live colour palette so it responds
// to dark mode. Use the `useProTheme()` hook in components; the static
// `ProTheme` export (light) remains for any non-reactive usage.
export const makeProTheme = (c: ColorPalette) => ({
  colors: {
    background: c.bg,
    card: c.surface,
    surface: c.surfaceAlt,
    border: c.border,
    navy: c.navy.primary,
    navyMid: c.navy.light,
    amber: c.amber.primary,
    amberLight: c.amber.light,
    amberDark: c.amber.dark,
    blue: c.blue.primary,
    blueLight: c.blue.light,
    success: c.success,
    warning: c.warning,
    error: c.error,
    text: {
      primary: c.text.primary,
      secondary: c.text.secondary,
      muted: c.midGray,
      inverse: c.white,
    },
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    pill: 999,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  shadow: {
    card: {
      shadowColor: c.navy.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
    lifted: {
      shadowColor: c.navy.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 5,
    },
  },
  gradient: {
    header: [c.navy.primary, c.navy.light, c.blue.primary],
    headerSoft: [c.navy.primary, c.navy.light],
  },
  type: {
    title: { fontSize: 16, fontWeight: '800' as const },
    section: { fontSize: 14, fontWeight: '800' as const },
    label: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.4 },
    body: { fontSize: 13, fontWeight: '600' as const },
    caption: { fontSize: 11, fontWeight: '600' as const },
  },
});

export type ProThemeType = ReturnType<typeof makeProTheme>;

export const ProTheme = makeProTheme(lightColors);
