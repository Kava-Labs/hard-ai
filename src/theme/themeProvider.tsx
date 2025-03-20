import React, { ReactNode, useInsertionEffect } from 'react';
import { theme } from './themes';
import { ThemeContext } from './themeContext';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  useInsertionEffect(() => {
    const root = document.documentElement;
    Object.entries(theme).forEach(([section, values]) => {
      if (typeof values === 'object') {
        Object.entries(values).forEach(([key, value]) => {
          root.style.setProperty(`--${section}-${key}`, value as string);
        });
      }
    });
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme: theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
