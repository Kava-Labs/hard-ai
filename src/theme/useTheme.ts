import { useContext } from 'react';
import { ThemeContext } from './themeContext';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');

  const {
    theme: { layout, colors, typography, spacing, borderRadius, logo },
  } = context;

  return { layout, colors, typography, spacing, borderRadius, logo };
};
