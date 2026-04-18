/**
 * TripTalk Design System
 * Professional color palette, spacing, and visual constants
 */

export const colors = {
  // Primary
  orange: {
    DEFAULT: '#E86C4A',
    hover: '#D35A38',
    light: '#FFF4F0',
  },

  // Neutrals
  gray: {
    900: '#1A1A1A',
    700: '#404040',
    500: '#737373',
    400: '#A3A3A3',
    300: '#D4D4D4',
    200: '#E5E5E5',
    100: '#F5F5F5',
    50: '#FAFAFA',
  },

  // Backgrounds
  bg: {
    page: '#FFF8F2', // Warm beige
    card: '#FFFFFF',
    hover: '#F5F5F5',
  },

  // Messages
  message: {
    user: '#A3D9D3', // Light blue
    assistant: '#E86C4A', // Orange
  },

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
} as const;

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  full: '9999px',
} as const;

export const typography = {
  // Headings
  h1: 'text-4xl font-bold',
  h2: 'text-3xl font-bold',
  h3: 'text-2xl font-semibold',
  h4: 'text-xl font-semibold',
  h5: 'text-lg font-medium',

  // Body
  body: 'text-base',
  bodyLarge: 'text-lg',
  bodySmall: 'text-sm',

  // Misc
  caption: 'text-xs uppercase tracking-wide',
  label: 'text-sm font-medium',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
} as const;

export const layout = {
  sidebarWidth: '240px',
  contentPadding: '32px',
  cardPadding: '24px',
  maxContentWidth: '1400px',
} as const;
