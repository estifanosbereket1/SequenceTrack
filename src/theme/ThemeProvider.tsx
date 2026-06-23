import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from './colors';
import { typography } from './typography';

type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  colors: typeof lightColors;
  typography: typeof typography;
  colorScheme: ColorScheme;
  toggleColorScheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: lightColors,
  typography,
  colorScheme: 'light',
  toggleColorScheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme() as ColorScheme;
  const [manualScheme, setManualScheme] = useState<ColorScheme | null>(null);

  const colorScheme = manualScheme ?? systemColorScheme ?? 'light';

  const colors = useMemo(() => (
    colorScheme === 'dark' ? darkColors : lightColors
  ), [colorScheme]);

  const toggleColorScheme = useCallback(() => {
    setManualScheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const value = useMemo(() => ({
    colors,
    typography,
    colorScheme,
    toggleColorScheme,
  }), [colors, colorScheme, toggleColorScheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
