import React, { ReactNode, useEffect } from 'react';
import { baseTheme } from './themes';
import { ThemeContext } from './themeContext';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Apply CSS variables dynamically
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(baseTheme).forEach(([section, values]) => {
      if (typeof values === 'object') {
        Object.entries(values).forEach(([key, value]) => {
          root.style.setProperty(`--${section}-${key}`, value as string);
        });
      }
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: baseTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
