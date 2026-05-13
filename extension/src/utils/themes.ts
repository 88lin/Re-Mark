import type { ThemeName } from '../types';

export interface ThemeOption {
  value: ThemeName;
  code: string;
  name: string;
  description: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    value: 'brutalist',
    code: 'B',
    name: 'Neo-Brutalist',
    description: 'High Contrast'
  },
  {
    value: 'editorial',
    code: 'C',
    name: 'Soft Editorial',
    description: 'Warm Minimal'
  },
  {
    value: 'terminal',
    code: 'E',
    name: 'Terminal Synthwave',
    description: 'CRT Retro'
  },
  {
    value: 'minimal',
    code: 'F',
    name: 'Japanese Minimalism',
    description: 'Serif Calm'
  },
  {
    value: 'glass',
    code: 'G',
    name: 'Glassmorphism Light',
    description: 'Translucent UI'
  }
];
