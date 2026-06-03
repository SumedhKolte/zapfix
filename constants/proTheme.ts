import { Colors } from './colors';

export const ProTheme = {
  colors: {
    background: Colors.offWhite,
    card: Colors.white,
    surface: Colors.lightGray,
    border: Colors.border,
    navy: Colors.navy.primary,
    navyMid: Colors.navy.light,
    amber: Colors.amber.primary,
    amberLight: Colors.amber.light,
    amberDark: Colors.amber.dark,
    blue: Colors.blue.primary,
    blueLight: Colors.blue.light,
    success: Colors.success,
    warning: Colors.warning,
    error: Colors.error,
    text: {
      primary: Colors.text.primary,
      secondary: Colors.text.secondary,
      muted: Colors.midGray,
      inverse: Colors.white,
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
      shadowColor: Colors.navy.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
    lifted: {
      shadowColor: Colors.navy.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 5,
    },
  },
  gradient: {
    header: [Colors.navy.primary, Colors.navy.light, Colors.blue.primary],
    headerSoft: [Colors.navy.primary, Colors.navy.light],
  },
  type: {
    title: { fontSize: 16, fontWeight: '800' as const },
    section: { fontSize: 14, fontWeight: '800' as const },
    label: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.4 },
    body: { fontSize: 13, fontWeight: '600' as const },
    caption: { fontSize: 11, fontWeight: '600' as const },
  },
};
