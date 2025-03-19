import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChatHistory } from './ChatHistory';
import { ConversationHistories } from './types';
import { ChatHistoryItemProps } from './ChatHistoryItem';

vi.mock('./ChatHistoryItem', () => ({
  ChatHistoryItem: ({
    conversation,
    onHistoryItemClick,
    isSelected,
  }: ChatHistoryItemProps) => (
    <div data-selected={isSelected} onClick={onHistoryItemClick}>
      {conversation.title}
    </div>
  ),
}));

describe('ChatHistory Component', () => {
  const mockOnSelectConversation = vi.fn();
  const mockOnDeleteConversation = vi.fn();
  const mockOnUpdateConversationTitle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display empty chat history when no conversations exist', () => {
    render(
      <ChatHistory
        chatHistories={{}}
        onSelectConversation={mockOnSelectConversation}
        onDeleteConversation={mockOnDeleteConversation}
        onUpdateConversationTitle={mockOnUpdateConversationTitle}
      />,
    );

    expect(screen.getByText('Start a new chat to begin')).toBeInTheDocument();
  });

  it('should display conversations grouped by time', () => {
    // Create mock history data with different timestamps
    const today = Date.now();
    const yesterday = today - 86400000; // 24 hours ago
    const older = today - 172800000; // 48 hours ago

    const mockHistories: ConversationHistories = {
      'conv-today': {
        id: 'conv-today',
        model: 'gpt-4-turbo',
        title: 'Today Conversation',
        conversation: [
          { role: 'system', content: 'You are a helpful AI assistant.' },
          { role: 'user', content: 'Hello!' },
        ],
        lastSaved: today,
        tokensRemaining: 6453,
      },
      'conv-yesterday': {
        id: 'conv-yesterday',
        model: 'claude-3-opus',
        title: 'Yesterday Conversation',
        conversation: [
          {
            role: 'system',
            content: 'You are Claude, a helpful AI assistant.',
          },
          { role: 'user', content: 'I have a question from yesterday.' },
        ],
        lastSaved: yesterday,
        tokensRemaining: 4821,
      },
      'conv-older': {
        id: 'conv-older',
        model: 'claude-3-opus',
        title: 'Older Conversation',
        conversation: [
          {
            role: 'system',
            content: 'You are Claude, a helpful AI assistant.',
          },
          { role: 'user', content: 'This is an older conversation.' },
        ],
        lastSaved: older,
        tokensRemaining: 5000,
      },
    };

    render(
      <ChatHistory
        chatHistories={mockHistories}
        onSelectConversation={mockOnSelectConversation}
        onDeleteConversation={mockOnDeleteConversation}
        onUpdateConversationTitle={mockOnUpdateConversationTitle}
      />,
    );

    // Check for time group headers
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    expect(screen.getByText('Last week')).toBeInTheDocument();

    // Check for conversation titles
    expect(screen.getByText('Today Conversation')).toBeInTheDocument();
    expect(screen.getByText('Yesterday Conversation')).toBeInTheDocument();
    expect(screen.getByText('Older Conversation')).toBeInTheDocument();
  });

  it('should call onSelectConversation with correct ID when conversation is clicked', () => {
    const mockHistories: ConversationHistories = {
      'conv-2025-03-19-001': {
        id: 'conv-2025-03-19-001',
        model: 'gpt-4-turbo',
        title: 'Today Conversation',
        conversation: [
          { role: 'system', content: 'You are a helpful AI assistant.' },
          { role: 'user', content: 'Hello!' },
        ],
        lastSaved: Date.now(),
        tokensRemaining: 6453,
      },
    };

    render(
      <ChatHistory
        chatHistories={mockHistories}
        onSelectConversation={mockOnSelectConversation}
        onDeleteConversation={mockOnDeleteConversation}
        onUpdateConversationTitle={mockOnUpdateConversationTitle}
      />,
    );

    fireEvent.click(screen.getByText('Today Conversation'));
    expect(mockOnSelectConversation).toHaveBeenCalledWith(
      'conv-2025-03-19-001',
    );
  });

  it('should properly set isSelected prop for active conversation', () => {
    const mockHistories: ConversationHistories = {
      'conv-2025-03-19-001': {
        id: 'conv-2025-03-19-001',
        model: 'gpt-4-turbo',
        title: 'Active Conversation',
        conversation: [
          { role: 'system', content: 'You are a helpful AI assistant.' },
          { role: 'user', content: 'Hello!' },
        ],
        lastSaved: Date.now(),
        tokensRemaining: 6453,
      },
      'conv-2025-03-19-002': {
        id: 'conv-2025-03-19-002',
        model: 'claude-3-opus',
        title: 'Inactive Conversation',
        conversation: [
          { role: 'system', content: 'You are a helpful AI assistant.' },
          { role: 'user', content: 'Hello!' },
        ],
        lastSaved: Date.now() - 10000,
        tokensRemaining: 6453,
      },
    };

    render(
      <ChatHistory
        chatHistories={mockHistories}
        onSelectConversation={mockOnSelectConversation}
        onDeleteConversation={mockOnDeleteConversation}
        onUpdateConversationTitle={mockOnUpdateConversationTitle}
        activeConversationId="conv-2025-03-19-001"
      />,
    );

    // Get elements by test id
    const activeItem = screen.getByText('Active Conversation');
    const inactiveItem = screen.getByText('Inactive Conversation');

    expect(activeItem.getAttribute('data-selected')).toBe('true');
    expect(inactiveItem.getAttribute('data-selected')).toBe('false');
  });

  it('should render conversations within their proper time groups', () => {
    const mockHistories: ConversationHistories = {
      'conv-today-1': {
        id: 'conv-today-1',
        model: 'gpt-4-turbo',
        title: 'First Today Conversation',
        conversation: [],
        lastSaved: Date.now(),
        tokensRemaining: 6000,
      },
      'conv-today-2': {
        id: 'conv-today-2',
        model: 'gpt-4-turbo',
        title: 'Second Today Conversation',
        conversation: [],
        lastSaved: Date.now() - 3600000, // 1 hour ago
        tokensRemaining: 6000,
      },
      'conv-yesterday': {
        id: 'conv-yesterday',
        model: 'claude-3-opus',
        title: 'Yesterday Conversation',
        conversation: [],
        lastSaved: Date.now() - 86400000, // 24 hours ago
        tokensRemaining: 5000,
      },
    };

    render(
      <ChatHistory
        chatHistories={mockHistories}
        onSelectConversation={mockOnSelectConversation}
        onDeleteConversation={mockOnDeleteConversation}
        onUpdateConversationTitle={mockOnUpdateConversationTitle}
      />,
    );

    //  Get an array of the elements that match either the expected time labels or titles
    //  Verify that they are collected in the expected order (i.e. grouped correctly)

    expect(
      screen.getAllByText(
        /Today|Yesterday|First Today Conversation|Second Today Conversation|Yesterday Conversation/,
      )[0].textContent,
    ).toBe('Today');
    expect(
      screen.getAllByText(
        /Today|Yesterday|First Today Conversation|Second Today Conversation|Yesterday Conversation/,
      )[1].textContent,
    ).toBe('First Today Conversation');
    expect(
      screen.getAllByText(
        /Today|Yesterday|First Today Conversation|Second Today Conversation|Yesterday Conversation/,
      )[2].textContent,
    ).toBe('Second Today Conversation');
    expect(
      screen.getAllByText(
        /Today|Yesterday|First Today Conversation|Second Today Conversation|Yesterday Conversation/,
      )[3].textContent,
    ).toBe('Yesterday');
    expect(
      screen.getAllByText(
        /Today|Yesterday|First Today Conversation|Second Today Conversation|Yesterday Conversation/,
      )[4].textContent,
    ).toBe('Yesterday Conversation');
  });
});
