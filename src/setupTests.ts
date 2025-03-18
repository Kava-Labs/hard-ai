import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

vi.mock('./theme/useIsMobileLayout', () => ({
  useIsMobileLayout: vi.fn().mockReturnValue(false),
}));

afterEach(() => {
  cleanup();
});
