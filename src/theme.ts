import { useColorScheme } from 'react-native';

const light = {
  bg: '#f7f7fb',
  surface: '#ffffff',
  text: '#16181d',
  muted: '#5b6270',
  line: '#e3e6eb',
  accent: '#5b4bff',
  accentSoft: '#eeecff',
  onAccent: '#ffffff',
  warn: '#c2321f',
  good: '#0f8a5f',
};

const dark: typeof light = {
  bg: '#0f1015',
  surface: '#181a22',
  text: '#eceef2',
  muted: '#9aa1ad',
  line: '#2a2f3a',
  accent: '#a59bff',
  accentSoft: '#24204a',
  onAccent: '#14104a',
  warn: '#ff7a66',
  good: '#4fd1a1',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
