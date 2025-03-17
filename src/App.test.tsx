import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { App } from './App';

describe('App Component', () => {
  it('renders "Hard AI" text', () => {
    const wrapper = render(<App />);

    const hardAILogo = wrapper.getByRole('img', { name: 'Hard AI logo' });
    const welcomeText = wrapper.getByText('How can I help you with Web3?');

    expect(hardAILogo).toBeInTheDocument();
    expect(welcomeText).toBeInTheDocument();
  });
});
