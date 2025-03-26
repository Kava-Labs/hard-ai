import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { App } from './App';

describe('App Component', () => {
  it('renders "Hard AI" text', () => {
    const wrapper = render(<App />);

    const hardAILogos = wrapper.getAllByRole('img', {
      name: 'Hard AI logo',
    });
    const welcomeText = wrapper.getByText('How can I help you with Web3?');

    expect(hardAILogos).toHaveLength(2);
    expect(welcomeText).toBeInTheDocument();
  });
});
