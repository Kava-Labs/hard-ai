import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

vi.mock('lib-kava-ai', () => ({
  useIsMobileLayout: vi.fn().mockReturnValue(false),
}));

afterEach(() => {
  cleanup();
});
