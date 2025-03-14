import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { App } from './App';

describe('App Component', () => {
  it('renders "Hard AI" text', () => {
    const wrapper = render(<App />);

    const diamondLogo = wrapper.getByRole('img', { name: 'Hard Diamond logo' });
    const hardAILogo = wrapper.getByRole('img', { name: 'Hard AI logo' });

    expect(diamondLogo).toBeInTheDocument();
    expect(hardAILogo).toBeInTheDocument();
  });
});
