import React, { ReactNode, useEffect } from 'react';
import { theme } from './themes';
import { ThemeContext } from './themeContext';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Apply CSS variables dynamically
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme).forEach(([section, values]) => {
      if (typeof values === 'object') {
        Object.entries(values).forEach(([key, value]) => {
          root.style.setProperty(`--${section}-${key}`, value as string);
        });
      }
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
