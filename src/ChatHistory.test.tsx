import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChatHistory } from './ChatHistory';
import { groupConversationsByTime } from './utils/helpers';
import { ConversationHistories } from './types';

vi.mock('./utils/helpers', () => ({
  groupConversationsByTime: vi.fn(),
}));

describe('ChatHistory Component', () => {
  const mockOnSelectConversation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display empty state when no conversations exist', () => {
    render(
      <ChatHistory
        chatHistories={{}}
        onSelectConversation={mockOnSelectConversation}
      />,
    );

    expect(screen.getByText('Start a new chat to begin')).toBeInTheDocument();
  });

  it('should group and display conversations when they exist', () => {
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
        lastSaved: Date.now(),
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
        lastSaved: Date.now(),
        tokensRemaining: 4821,
      },
    };

    const mockGroupedConversations = {
      Today: Object.values(mockHistories),
    };

    (groupConversationsByTime as Mock).mockReturnValue(
      mockGroupedConversations,
    );

    render(
      <ChatHistory
        chatHistories={mockHistories}
        onSelectConversation={mockOnSelectConversation}
      />,
    );

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Project Planning Discussion')).toBeInTheDocument();
    expect(
      screen.getByText('Recipe Ideas for Dinner Party'),
    ).toBeInTheDocument();
  });

  it('should handle multiple time groups', () => {
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
      'conv-2025-03-18-001': {
        id: 'conv-2025-03-18-001',
        model: 'claude-3-opus',
        title: 'Yesterday Conversation',
        conversation: [
          {
            role: 'system',
            content: 'You are Claude, a helpful AI assistant.',
          },
          { role: 'user', content: 'Hi there!' },
        ],
        lastSaved: Date.now() - 86400000, // 1 day ago
        tokensRemaining: 4821,
      },
    };

    const mockGroupedConversations = {
      Today: [mockHistories['conv-2025-03-19-001']],
      Yesterday: [mockHistories['conv-2025-03-18-001']],
    };

    (groupConversationsByTime as Mock).mockReturnValue(
      mockGroupedConversations,
    );

    render(
      <ChatHistory
        chatHistories={mockHistories}
        onSelectConversation={mockOnSelectConversation}
      />,
    );

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    expect(screen.getByText('Yesterday Conversation')).toBeInTheDocument();
    expect(screen.getByText('Today Conversation')).toBeInTheDocument();
  });

  it('should call onSelectConversation with correct ID when conversation is clicked', async () => {
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

    const mockGroupedConversations = {
      Today: [mockHistories['conv-2025-03-19-001']],
    };

    (groupConversationsByTime as Mock).mockReturnValue(
      mockGroupedConversations,
    );

    render(
      <ChatHistory
        chatHistories={mockHistories}
        onSelectConversation={mockOnSelectConversation}
      />,
    );

    fireEvent.click(screen.getByText('Today Conversation'));
    expect(mockOnSelectConversation).toHaveBeenCalledWith(
      'conv-2025-03-19-001',
    );
  });

  it('should properly memoize the grouped conversations', () => {
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

    const mockGroupedConversations = {
      Today: [mockHistories['conv-2025-03-19-001']],
    };

    (groupConversationsByTime as Mock).mockReturnValue(
      mockGroupedConversations,
    );

    const { rerender } = render(
      <ChatHistory
        chatHistories={mockHistories}
        onSelectConversation={mockOnSelectConversation}
      />,
    );

    //  First render should call the grouping function
    expect(groupConversationsByTime).toHaveBeenCalledTimes(1);

    //  Rerender with the same props
    rerender(
      <ChatHistory
        chatHistories={mockHistories}
        onSelectConversation={mockOnSelectConversation}
      />,
    );

    //  Function should not be called again due to memoization
    expect(groupConversationsByTime).toHaveBeenCalledTimes(1);

    const updatedMockHistories: ConversationHistories = {
      ...mockHistories,
      'conv-2025-03-19-002': {
        id: 'conv-2025-03-19-002',
        model: 'claude-3-opus',
        title: 'New Conversation',
        conversation: [
          {
            role: 'system',
            content: 'You are Claude, a helpful AI assistant.',
          },
          { role: 'user', content: 'Hello Claude!' },
        ],
        lastSaved: Date.now(),
        tokensRemaining: 4821,
      },
    };

    //  Rerender with new conversations
    rerender(
      <ChatHistory
        chatHistories={updatedMockHistories}
        onSelectConversation={mockOnSelectConversation}
      />,
    );

    //  Function should be called again
    expect(groupConversationsByTime).toHaveBeenCalledTimes(2);
  });
});
