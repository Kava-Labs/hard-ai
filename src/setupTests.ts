import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

vi.mock('lib-kava-ai', async () => {
  return {
    useIsMobileLayout: vi.fn(),
  };
});
afterEach(() => {
  cleanup();
});
