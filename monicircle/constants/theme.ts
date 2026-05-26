import { colors } from './colors'

export const theme = {
  colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  radius: {
    sm: 8,
    md: 10,
    lg: 12,
    xl: 16,
    xxl: 20,
    full: 999,
  },
  font: {
    size: {
      xs: 10,
      sm: 11,
      md: 13,
      lg: 15,
      xl: 18,
      xxl: 22,
      xxxl: 26,
      hero: 32,
    },
    weight: {
      regular: '400' as const,
      medium: '500' as const,
      bold: '600' as const,
    },
  },
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
  },
}

export type Theme = typeof theme

// Named exports for screens that import these directly
export const spacing = theme.spacing;
export const radius = theme.radius;
export const fontSize = theme.font.size;
export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
