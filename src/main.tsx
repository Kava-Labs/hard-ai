import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './theme/global.css';
import { App } from './App';
import { ThemeProvider } from './theme/themeProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
