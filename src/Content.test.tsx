import { render, screen, waitFor } from '@testing-library/react';
import { describe, vi, beforeEach, it, expect } from 'vitest';
import { Content, ContentComponent } from './Content';
import { sanitizeContent } from './utils/sanitize';

vi.mock('./utils/sanitize');

describe('Content Component', () => {
  const mockContent = 'Test content';
  const mockSanitizedContent = '<p>Test content</p>';

  beforeEach(() => {
    vi.clearAllMocks();

    (sanitizeContent as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSanitizedContent,
    );

    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders sanitized content correctly', async () => {
    render(<ContentComponent content={mockContent} role="user" />);

    expect(sanitizeContent).toHaveBeenCalledWith(mockContent);

    await waitFor(() => {
      const contentElement = document.querySelector('[data-chat-role="user"]');
      const spanElement = contentElement?.querySelector('span');
      expect(spanElement).toHaveProperty('innerHTML', mockSanitizedContent);
    });
  });

  it('handles empty content', async () => {
    render(<ContentComponent content="" role="user" />);

    expect(sanitizeContent).not.toHaveBeenCalled();

    await waitFor(() => {
      const contentElement = document.querySelector('[data-chat-role="user"]');
      expect(contentElement).toBeInTheDocument();
      expect(contentElement?.innerHTML.trim()).toBe('');
    });
  });

  it('displays error message when sanitization fails', async () => {
    (sanitizeContent as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Sanitization failed'),
    );

    render(<ContentComponent content={mockContent} role="user" />);

    await waitFor(() => {
      const errorElement = screen.getByText('Error: Could not render content!');
      expect(errorElement).toBeInTheDocument();
    });

    expect(console.error).toHaveBeenCalled();
  });

  it('memoizes correctly', async () => {
    const { rerender } = render(<Content content={mockContent} role="user" />);

    await waitFor(() => {
      expect(sanitizeContent).toHaveBeenCalledTimes(1);
    });

    //  Rerender with the same props
    rerender(<Content content={mockContent} role="user" />);

    expect(sanitizeContent).toHaveBeenCalledTimes(1);

    //  Rerender with different props
    rerender(<Content content="New content" role="user" />);

    expect(sanitizeContent).toHaveBeenCalledTimes(2);
  });
});
