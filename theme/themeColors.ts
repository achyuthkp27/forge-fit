import { useTheme } from './themeContext';

export const useThemeColors = () => {
  const { theme } = useTheme();
  
  // Define color palette for both themes
  const colors = {
    dark: {
      background: '#0D0D0D',
      cardBackground: '#18181B',
      primary: '#F97316',
      secondary: '#EA580C',
      textPrimary: '#FFFFFF',
      textSecondary: '#71717A',
      border: '#27272A',
      accent: '#F97316',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
    },
    light: {
      background: '#FFFFFF',
      cardBackground: '#F3F4F6',
      primary: '#F97316',
      secondary: '#EA580C',
      textPrimary: '#111827',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      accent: '#F97316',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
    }
  };
  
  return colors[theme];
};