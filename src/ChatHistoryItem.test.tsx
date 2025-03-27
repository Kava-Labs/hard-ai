import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChatHistoryItem, ChatHistoryItemProps } from './ChatHistoryItem';
import { ConversationHistory } from './types';

describe('ChatHistoryItem Component', () => {
  const mockConversation: ConversationHistory = {
    id: 'conv-2025-03-19-001',
    model: 'gpt-4-turbo',
    title: 'Test Conversation',
    lastSaved: Date.now(),
    tokensRemaining: 6453,
  };

  const mockProps: ChatHistoryItemProps = {
    conversation: mockConversation,
    onHistoryItemClick: vi.fn(),
    deleteConversation: vi.fn(),
    updateConversationTitle: vi.fn(),
    isSelected: false,
    isMenuOpen: false,
    isEditingTitle: false,
    toggleEditingTitle: vi.fn(),
    handleMenuOpen: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly with the given title', () => {
    render(<ChatHistoryItem {...mockProps} />);

    expect(screen.getByText('Test Conversation')).toBeInTheDocument();
  });

  it('should apply selected class when isSelected is true', () => {
    const { container } = render(
      <ChatHistoryItem {...mockProps} isSelected={true} />,
    );

    expect(container.firstChild).toHaveClass(
      '_chatHistoryItem_ad1974 _selected_ad1974',
    );
  });

  it('should call onHistoryItemClick when title is clicked', () => {
    render(<ChatHistoryItem {...mockProps} />);

    fireEvent.click(screen.getByText('Test Conversation'));

    expect(mockProps.onHistoryItemClick).toHaveBeenCalledTimes(1);
  });

  it('should open menu when menu button is clicked', () => {
    render(<ChatHistoryItem {...mockProps} />);

    const menuButton = screen.getByRole('button', { name: 'Chat Options' });
    fireEvent.click(menuButton);

    expect(screen.getByRole('button', { name: 'Rename Title' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Delete Chat' })).toBeVisible();
  });
});
