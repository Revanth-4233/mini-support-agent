/**
 * Centralized theme — colors, spacing, typography, and shadows.
 * Used across all components for visual consistency.
 */

export const COLORS = {
  // Primary palette — deep indigo / violet
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  primaryDark: '#5A4BD1',

  // Accent
  accent: '#00CEC9',
  accentLight: '#81ECEC',

  // Backgrounds
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#25253D',
  card: '#212140',

  // Chat bubbles
  bubbleOwn: '#6C5CE7',
  bubbleOther: '#25253D',
  bubbleOwnText: '#FFFFFF',
  bubbleOtherText: '#E0E0F0',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0C0',
  textMuted: '#6B6B8D',
  textOnPrimary: '#FFFFFF',

  // Status
  success: '#00B894',
  error: '#FF6B6B',
  warning: '#FDCB6E',
  info: '#74B9FF',

  // Online indicator
  online: '#00B894',
  offline: '#636E72',

  // Borders & dividers
  border: '#2D2D50',
  divider: '#1E1E35',

  // Input
  inputBackground: '#1A1A2E',
  inputBorder: '#2D2D50',
  inputText: '#FFFFFF',
  placeholder: '#6B6B8D',

  // Misc
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  title: 32,
};

export const FONT_WEIGHT = {
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
};

export const BORDER_RADIUS = {
  sm: 6,
  md: 12,
  lg: 18,
  xl: 24,
  round: 50,
};

export const SHADOWS = {
  small: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
};
