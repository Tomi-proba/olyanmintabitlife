import { useColorScheme } from 'react-native';
import { darkPalette, lightPalette, type Palette } from './colors';
import { useAppStore } from '../../state/store';

export interface Theme {
  isDark: boolean;
  colors: Palette;
}

export function useTheme(): Theme {
  const systemScheme = useColorScheme();
  const preference = useAppStore((s) => s.themePreference);
  const isDark = preference === 'system' ? systemScheme === 'dark' : preference === 'dark';
  return { isDark, colors: isDark ? darkPalette : lightPalette };
}
