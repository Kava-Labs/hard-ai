import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App Component', () => {
  it('renders "Hard AI" text', () => {
    render(<App />);
    expect(screen.getByText('Hard AI')).toBeInTheDocument();
  });
});
