import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Conversation, ChatMessage } from './Conversation';

vi.mock('./Content', () => ({
  Content: ({ content, role }: { content: string; role: string }) => (
    <div data-testid={`${role}-content`}>{content}</div>
  ),
}));

describe('Conversation Component', () => {
  it('renders an empty conversation when no messages are provided', () => {
    const { container } = render(
      <Conversation
        isRequesting={false}
        messages={[]}
        progressText=""
        errorText=""
        assistantStream=""
        onRendered={vi.fn()}
      />,
    );
    expect(container.firstChild).toHaveClass('_conversationContainer_768897');
    expect(container.firstChild?.childNodes.length).toBe(0);
  });

  it('renders assistant message correctly', () => {
    const messages: ChatMessage[] = [
      { role: 'assistant', content: 'Hello, human!' },
    ];

    render(
      <Conversation
        isRequesting={false}
        messages={messages}
        progressText=""
        errorText=""
        assistantStream=""
        onRendered={vi.fn()}
      />,
    );

    expect(screen.getByTestId('assistant-content')).toHaveTextContent(
      'Hello, human!',
    );
    expect(screen.getByAltText('Hard AI logo')).toBeInTheDocument();
  });

  it('renders a conversation', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Hello AI!' },
      { role: 'assistant', content: 'Hello human!' },
      { role: 'user', content: 'What can you do?' },
      { role: 'assistant', content: 'I can help with many tasks.' },
    ];

    render(
      <Conversation
        isRequesting={false}
        messages={messages}
        progressText=""
        errorText=""
        assistantStream=""
        onRendered={vi.fn()}
      />,
    );

    const userMessages = screen.getAllByTestId('user-content');
    expect(userMessages).toHaveLength(2);

    const assistantMessages = screen.getAllByTestId('assistant-content');
    expect(assistantMessages).toHaveLength(2);

    const assistantLogos = screen.getAllByAltText('Hard AI logo');
    expect(assistantLogos).toHaveLength(2);

    expect(userMessages[0]).toHaveTextContent('Hello AI!');
    expect(userMessages[1]).toHaveTextContent('What can you do?');
    expect(assistantMessages[0]).toHaveTextContent('Hello human!');
    expect(assistantMessages[1]).toHaveTextContent(
      'I can help with many tasks.',
    );
  });
});
