// Flat colour palette used across the customer side, auth screens and customer
// components. Mirrors the inline `const Theme = {...}` objects those files used
// to declare locally — now centralised so dark mode can swap the values.
//
// Screens read the live palette from `useTheme().theme`. The static `lightTheme`
// keeps unmigrated screens rendering correctly.

export type FlatTheme = {
  navy: string;
  navyMid: string;
  amber: string;
  amberLight: string;
  amberBorder: string;
  blue: string;
  blueLight: string;
  violet: string;
  violetLight: string;
  cream: string;
  creamCard: string;
  textDark: string;
  textMid: string;
  textLight: string;
  border: string;
  white: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
};

export const lightTheme: FlatTheme = {
  navy: '#0F2057',
  navyMid: '#1A3580',
  amber: '#F5B800',
  amberLight: '#FFF8D6',
  amberBorder: '#F5B80040',
  blue: '#1B6FE8',
  blueLight: '#E8F0FF',
  violet: '#7C6BFF',
  violetLight: '#EFECFF',
  cream: '#F7F5F0',
  creamCard: '#FFFFFF',
  textDark: '#0A0F1E',
  textMid: '#4A5578',
  textLight: '#8E97B5',
  border: '#E2E6F0',
  white: '#FFFFFF',
  success: '#1A7A4A',
  successLight: '#E8F5EE',
  warning: '#C07A00',
  warningLight: '#FFF3E0',
  error: '#C23232',
  errorLight: '#FFF0F0'
};

export const darkTheme: FlatTheme = {
  navy: '#0F2057',     // brand — gradient headers + on-amber icons
  navyMid: '#1A3580',
  amber: '#F5B800',
  amberLight: '#3A2F12',
  amberBorder: '#F5B80055',
  blue: '#3B82F6',
  blueLight: '#16233B',
  violet: '#9A8CFF',
  violetLight: '#241F3D',
  cream: '#0B1020',    // screen background
  creamCard: '#161C2E', // card background
  textDark: '#F4F6FB',
  textMid: '#AEB6CE',
  textLight: '#7E88A5',
  border: '#2A3147',
  white: '#FFFFFF',
  success: '#34D399',
  successLight: '#12281C',
  warning: '#FBBF4D',
  warningLight: '#2E2410',
  error: '#F87171',
  errorLight: '#2E1515'
};

// Static light palette for not-yet-migrated screens.
export const Theme = lightTheme;
