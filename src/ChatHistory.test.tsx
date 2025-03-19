import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChatHistory } from './ChatHistory';
import { ConversationHistories } from './types';

// Mock the ChatHistoryItem component
vi.mock('./ChatHistoryItem', () => ({
  ChatHistoryItem: ({ conversation, onHistoryItemClick, isSelected }) => (
    <div
      data-testid={`chat-item-${conversation.id}`}
      data-selected={isSelected}
      onClick={onHistoryItemClick}
    >
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

    // The div should be empty when there are no conversations
    const chatHistoryDiv = screen.getByRole('generic');
    expect(chatHistoryDiv.children.length).toBe(0);
  });

  it('should display conversations sorted by lastSaved time', () => {
    const mockHistories: ConversationHistories = {
      'conv-2025-03-15-001': {
        id: 'conv-2025-03-15-001',
        model: 'gpt-4-turbo',
        title: 'Project Planning Discussion',
        conversation: [
          { role: 'system', content: 'You are a helpful AI assistant.' },
          {
            role: 'user',
            content: 'Can you help me plan a new web application project?',
          },
        ],
        lastSaved: Date.now() - 100000, // Older conversation
        tokensRemaining: 6453,
      },
      'conv-2025-03-16-002': {
        id: 'conv-2025-03-16-002',
        model: 'claude-3-opus',
        title: 'Recipe Ideas for Dinner Party',
        conversation: [
          {
            role: 'system',
            content: 'You are Claude, a helpful AI assistant.',
          },
          { role: 'user', content: "I'm hosting a dinner party this weekend." },
        ],
        lastSaved: Date.now(), // Newer conversation
        tokensRemaining: 4821,
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

    // Both conversations should be displayed
    expect(screen.getByText('Project Planning Discussion')).toBeInTheDocument();
    expect(
      screen.getByText('Recipe Ideas for Dinner Party'),
    ).toBeInTheDocument();

    // Check order - newer conversation should be rendered first
    const items = screen.getAllByText(
      /Project Planning Discussion|Recipe Ideas for Dinner Party/,
    );
    expect(items[0].textContent).toBe('Recipe Ideas for Dinner Party');
    expect(items[1].textContent).toBe('Project Planning Discussion');
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

    const activeItem = screen.getByTestId('chat-item-conv-2025-03-19-001');
    const inactiveItem = screen.getByTestId('chat-item-conv-2025-03-19-002');

    expect(activeItem.getAttribute('data-selected')).toBe('true');
    expect(inactiveItem.getAttribute('data-selected')).toBe('false');
  });

  it('should pass the correct props to ChatHistoryItem components', () => {
    const mockHistories: ConversationHistories = {
      'conv-2025-03-19-001': {
        id: 'conv-2025-03-19-001',
        model: 'gpt-4-turbo',
        title: 'Test Conversation',
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
        activeConversationId="conv-2025-03-19-001"
      />,
    );

    // Check that the component passes all required props to ChatHistoryItem
    const chatItem = screen.getByTestId('chat-item-conv-2025-03-19-001');
    expect(chatItem).toBeInTheDocument();
    expect(chatItem).toHaveTextContent('Test Conversation');
    expect(chatItem.getAttribute('data-selected')).toBe('true');
  });
});
