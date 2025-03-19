import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Conversation, ChatMessage } from './Conversation';
import { MessageHistoryStore } from './stores/messageHistoryStore';
import { TextStreamStore } from './stores/textStreamStore';

const getAllByRole = (container: HTMLElement, role: string) => {
  return Array.from(container.querySelectorAll(`[data-chat-role="${role}"]`));
};

describe('Conversation Component', () => {
  it('renders an empty conversation when no messages are provided', () => {
    const { container } = render(
      <Conversation
        isRequesting={false}
        messageStore={new TextStreamStore()}
        progressStore={new TextStreamStore()}
        errorStore={new TextStreamStore()}
        messageHistoryStore={new MessageHistoryStore()}
      />,
    );
    expect(container.firstChild).toHaveClass('_conversationContainer_768897');
    expect(container.firstChild?.childNodes.length).toBe(0);
  });

  it.skip('renders assistant message correctly', () => {
    const messages: ChatMessage[] = [
      { role: 'assistant', content: 'Hello, human!' },
    ];
    const messageHistoryStore = new MessageHistoryStore();
    messageHistoryStore.setMessages(messages);

    const { container } = render(
      <Conversation
        isRequesting={false}
        messageStore={new TextStreamStore()}
        progressStore={new TextStreamStore()}
        errorStore={new TextStreamStore()}
        messageHistoryStore={messageHistoryStore}
      />,
    );

    const assistantMessages = getAllByRole(container, 'assistant');
    expect(assistantMessages).toHaveLength(1);
    expect(assistantMessages[0]).toHaveTextContent('Hello, human!');
    expect(screen.getByAltText('Hard AI logo')).toBeInTheDocument();
  });

  it.skip('renders a conversation', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Hello AI!' },
      { role: 'assistant', content: 'Hello human!' },
      { role: 'user', content: 'What can you do?' },
      { role: 'assistant', content: 'I can help with many tasks.' },
    ];
    const messageHistoryStore = new MessageHistoryStore();
    messageHistoryStore.setMessages(messages);
    const { container } = render(
      <Conversation
        isRequesting={false}
        messageStore={new TextStreamStore()}
        progressStore={new TextStreamStore()}
        errorStore={new TextStreamStore()}
        messageHistoryStore={messageHistoryStore}
      />,
    );

    const userMessages = getAllByRole(container, 'user');
    expect(userMessages).toHaveLength(2);
    expect(userMessages[0]).toHaveTextContent('Hello AI!');
    expect(userMessages[1]).toHaveTextContent('What can you do?');

    const assistantMessages = getAllByRole(container, 'assistant');
    expect(assistantMessages).toHaveLength(2);
    expect(assistantMessages[0]).toHaveTextContent('Hello human!');
    expect(assistantMessages[1]).toHaveTextContent(
      'I can help with many tasks.',
    );
    expect(screen.getAllByAltText('Hard AI logo')).toHaveLength(2);
  });
});
