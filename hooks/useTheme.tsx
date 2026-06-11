import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { darkColors, lightColors, type ColorPalette } from '@/constants/colors';
import { darkTheme, lightTheme, type FlatTheme } from '@/constants/theme';
import { makeProTheme, type ProThemeType } from '@/constants/proTheme';

export type AppearanceMode = 'system' | 'light' | 'dark';
export type ColorScheme = 'light' | 'dark';

const STORAGE_KEY = 'settings.appearance';

type ThemeContextValue = {
  mode: AppearanceMode;
  scheme: ColorScheme;
  colors: ColorPalette;
  theme: FlatTheme;
  setMode: (mode: AppearanceMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<AppearanceMode>('system');

  // Hydrate the saved preference once on mount.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value === 'light' || value === 'dark' || value === 'system') {
        setModeState(value);
      }
    });
  }, []);

  const setMode = useCallback((next: AppearanceMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const scheme: ColorScheme =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      scheme,
      colors: scheme === 'dark' ? darkColors : lightColors,
      theme: scheme === 'dark' ? darkTheme : lightTheme,
      setMode
    }),
    [mode, scheme, setMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Access the live theme. Returns both the nested `colors` palette (pro side /
 * shared UI) and the flat `theme` palette (customer side / auth), plus the
 * current scheme and a `setMode` setter wired to the Appearance settings.
 *
 * Falls back to the light palettes when used outside a provider so isolated
 * component tests keep working.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx;
  return {
    mode: 'system',
    scheme: 'light',
    colors: lightColors,
    theme: lightTheme,
    setMode: () => undefined
  };
}

/** Live pro design-system theme (responds to dark mode). */
export function useProTheme(): ProThemeType {
  const { colors } = useTheme();
  return useMemo(() => makeProTheme(colors), [colors]);
}
