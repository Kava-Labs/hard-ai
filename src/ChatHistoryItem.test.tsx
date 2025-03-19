import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChatHistoryItem } from './ChatHistoryItem';
import userEvent from '@testing-library/user-event';
import { ConversationHistory } from './types';

describe('ChatHistoryItem Component', () => {
  const mockConversation: ConversationHistory = {
    id: 'conv-2025-03-19-001',
    model: 'gpt-4-turbo',
    title: 'Test Conversation',
    conversation: [
      { role: 'system', content: 'You are a helpful AI assistant.' },
      { role: 'user', content: 'Hello!' },
    ],
    lastSaved: Date.now(),
    tokensRemaining: 6453,
  };

  const mockProps = {
    conversation: mockConversation,
    onHistoryItemClick: vi.fn(),
    deleteConversation: vi.fn(),
    updateConversationTitle: vi.fn(),
    isSelected: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly with the given title', () => {
    render(<ChatHistoryItem {...mockProps} />);

    expect(screen.getByTestId('chat-history-entry')).toHaveTextContent(
      'Test Conversation',
    );
  });

  it('should apply selected class when isSelected is true', () => {
    const { container } = render(
      <ChatHistoryItem {...mockProps} isSelected={true} />,
    );

    expect(container.firstChild).toHaveClass('selected');
  });

  it('should call onHistoryItemClick when title is clicked', () => {
    render(<ChatHistoryItem {...mockProps} />);

    fireEvent.click(screen.getByTestId('chat-history-entry'));

    expect(mockProps.onHistoryItemClick).toHaveBeenCalledTimes(1);
  });

  it('should open menu when menu button is clicked', async () => {
    render(<ChatHistoryItem {...mockProps} />);

    const menuButton = screen.getByRole('button', { name: 'Chat Options' });
    await userEvent.click(menuButton);

    expect(screen.getByRole('button', { name: 'Rename Title' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Delete Chat' })).toBeVisible();
  });

  it('should enter edit mode when rename button is clicked', async () => {
    render(<ChatHistoryItem {...mockProps} />);

    // Open menu
    const menuButton = screen.getByRole('button', { name: 'Chat Options' });
    await userEvent.click(menuButton);

    // Click rename
    const renameButton = screen.getByRole('button', { name: 'Rename Title' });
    await userEvent.click(renameButton);

    // Check if input is rendered and has correct value
    const input = screen.getByRole('Edit Title Input');
    expect(input).toBeVisible();
    expect(input).toHaveValue('Test Conversation');
  });

  it('should update input value as user types', async () => {
    render(<ChatHistoryItem {...mockProps} />);

    // Open menu
    const menuButton = screen.getByRole('button', { name: 'Chat Options' });
    await userEvent.click(menuButton);

    // Click rename
    const renameButton = screen.getByRole('button', { name: 'Rename Title' });
    await userEvent.click(renameButton);

    // Type in the input
    const input = screen.getByRole('Edit Title Input');
    await userEvent.clear(input);
    await userEvent.type(input, 'Updated Title');

    expect(input).toHaveValue('Updated Title');
  });

  it('should save title when Enter key is pressed', async () => {
    render(<ChatHistoryItem {...mockProps} />);

    // Open menu
    const menuButton = screen.getByRole('button', { name: 'Chat Options' });
    await userEvent.click(menuButton);

    // Click rename
    const renameButton = screen.getByRole('button', { name: 'Rename Title' });
    await userEvent.click(renameButton);

    // Type in the input and press Enter
    const input = screen.getByRole('Edit Title Input');
    await userEvent.clear(input);
    await userEvent.type(input, 'Updated Title{enter}');

    expect(mockProps.updateConversationTitle).toHaveBeenCalledWith(
      'conv-2025-03-19-001',
      'Updated Title',
    );
  });

  it('should not save empty title but revert to original', async () => {
    render(<ChatHistoryItem {...mockProps} />);

    // Open menu
    const menuButton = screen.getByRole('button', { name: 'Chat Options' });
    await userEvent.click(menuButton);

    // Click rename
    const renameButton = screen.getByRole('button', { name: 'Rename Title' });
    await userEvent.click(renameButton);

    // Clear input and press Enter
    const input = screen.getByRole('Edit Title Input');
    await userEvent.clear(input);
    await userEvent.type(input, '{enter}');

    // Should not update with empty title
    expect(mockProps.updateConversationTitle).not.toHaveBeenCalled();

    // Should revert to showing original title
    expect(screen.getByTestId('chat-history-entry')).toHaveTextContent(
      'Test Conversation',
    );
  });

  it('should cancel editing when Escape key is pressed', async () => {
    render(<ChatHistoryItem {...mockProps} />);

    // Open menu
    const menuButton = screen.getByRole('button', { name: 'Chat Options' });
    await userEvent.click(menuButton);

    // Click rename
    const renameButton = screen.getByRole('button', { name: 'Rename Title' });
    await userEvent.click(renameButton);

    // Type in the input and press Escape
    const input = screen.getByRole('Edit Title Input');
    await userEvent.clear(input);
    await userEvent.type(input, 'Updated Title{escape}');

    // Should not save
    expect(mockProps.updateConversationTitle).not.toHaveBeenCalled();

    // Should exit edit mode
    expect(screen.queryByRole('Edit Title Input')).not.toBeInTheDocument();

    // Should still show original title
    expect(screen.getByTestId('chat-history-entry')).toHaveTextContent(
      'Test Conversation',
    );
  });

  it('should delete conversation when delete button is clicked', async () => {
    render(<ChatHistoryItem {...mockProps} />);

    // Open menu
    const menuButton = screen.getByRole('button', { name: 'Chat Options' });
    await userEvent.click(menuButton);

    // Click delete
    const deleteButton = screen.getByRole('button', { name: 'Delete Chat' });
    await userEvent.click(deleteButton);

    expect(mockProps.deleteConversation).toHaveBeenCalledWith(
      'conv-2025-03-19-001',
    );
  });

  it('should not update title if the trimmed value is the same as the original', async () => {
    render(<ChatHistoryItem {...mockProps} />);

    // Open menu
    const menuButton = screen.getByRole('button', { name: 'Chat Options' });
    await userEvent.click(menuButton);

    // Click rename
    const renameButton = screen.getByRole('button', { name: 'Rename Title' });
    await userEvent.click(renameButton);

    // Type in the input with spaces but same content and press Enter
    const input = screen.getByRole('Edit Title Input');
    await userEvent.clear(input);
    await userEvent.type(input, '  Test Conversation  {enter}');

    // Should not update with the same title
    expect(mockProps.updateConversationTitle).not.toHaveBeenCalled();
  });

  it('should close the menu when clicking outside', async () => {
    const { container } = render(
      <div>
        <div data-testid="outside-element">Outside Element</div>
        <ChatHistoryItem {...mockProps} />
      </div>,
    );

    // Open menu
    const menuButton = screen.getByRole('button', { name: 'Chat Options' });
    await userEvent.click(menuButton);

    // Verify menu is open
    expect(screen.getByRole('button', { name: 'Rename Title' })).toBeVisible();

    // Click outside the component
    await userEvent.click(screen.getByTestId('outside-element'));

    // Check if menu buttons are still visible (they shouldn't be)
    const menuButtons = container.querySelector('.show');
    expect(menuButtons).toBeNull();
  });

  it('should save title when clicking outside while in edit mode', async () => {
    render(
      <div>
        <div data-testid="outside-element">Outside Element</div>
        <ChatHistoryItem {...mockProps} />
      </div>,
    );

    // Open menu
    const menuButton = screen.getByRole('button', { name: 'Chat Options' });
    await userEvent.click(menuButton);

    // Click rename
    const renameButton = screen.getByRole('button', { name: 'Rename Title' });
    await userEvent.click(renameButton);

    // Change input value
    const input = screen.getByRole('Edit Title Input');
    await userEvent.clear(input);
    await userEvent.type(input, 'New Title from Outside Click');

    // Click outside
    await userEvent.click(screen.getByTestId('outside-element'));

    // Verify title was updated
    expect(mockProps.updateConversationTitle).toHaveBeenCalledWith(
      'conv-2025-03-19-001',
      'New Title from Outside Click',
    );
  });

  it('should show Cancel button when in edit mode', async () => {
    render(<ChatHistoryItem {...mockProps} />);

    // Open menu
    const menuButton = screen.getByRole('button', { name: 'Chat Options' });
    await userEvent.click(menuButton);

    // Click rename
    const renameButton = screen.getByRole('button', { name: 'Rename Title' });
    await userEvent.click(renameButton);

    // Reopen menu
    await userEvent.click(menuButton);

    // Check if Cancel button is shown instead of Rename
    expect(
      screen.getByRole('button', { name: 'Cancel Rename Title' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Rename Title' }),
    ).not.toBeInTheDocument();
  });

  it('should cancel editing when cancel button is clicked', async () => {
    render(<ChatHistoryItem {...mockProps} />);

    // Open menu
    const menuButton = screen.getByRole('button', { name: 'Chat Options' });
    await userEvent.click(menuButton);

    // Click rename
    const renameButton = screen.getByRole('button', { name: 'Rename Title' });
    await userEvent.click(renameButton);

    // Change input value
    const input = screen.getByRole('Edit Title Input');
    await userEvent.clear(input);
    await userEvent.type(input, 'Updated Title');

    // Reopen menu
    await userEvent.click(menuButton);

    // Click cancel
    const cancelButton = screen.getByRole('button', {
      name: 'Cancel Rename Title',
    });
    await userEvent.click(cancelButton);

    // Should not save
    expect(mockProps.updateConversationTitle).not.toHaveBeenCalled();

    // Should exit edit mode
    expect(screen.queryByRole('Edit Title Input')).not.toBeInTheDocument();

    // Should show original title
    expect(screen.getByTestId('chat-history-entry')).toHaveTextContent(
      'Test Conversation',
    );
  });
});
