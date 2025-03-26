import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchHistoryModalBody } from './SearchHistoryModalBody';
import { GroupedSearchHistories, SearchableChatHistory } from './types';

describe('SearchHistoryModalBody', () => {
  const mockHistory: SearchableChatHistory = {
    id: 'conv-123',
    title: 'Test Conversation',
    messages: [{ role: 'user', content: 'This is a test' }],
    lastSaved: 1234000000,
  };

  const onSelectConversation = vi.fn();
  const handleSearchTermChange = vi.fn();
  const onClose = vi.fn();
  const searchTerm = 'This';

  const props = {
    onSelectConversation,
    onClose,
    handleSearchTermChange,
    searchTerm,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should select the only conversation when Enter key is pressed', () => {
    const groupedConversations: GroupedSearchHistories = {
      Today: [mockHistory],
    };

    render(
      <SearchHistoryModalBody
        {...props}
        groupedConversations={groupedConversations}
        inputValue="test"
      />,
    );

    const searchInput = screen.getByPlaceholderText('Search conversations...');

    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(onSelectConversation).toHaveBeenCalledWith('conv-123');
    expect(onClose).toHaveBeenCalled();
  });

  it('should not select any conversation when Enter key is pressed with multiple results', () => {
    const groupedConversations: GroupedSearchHistories = {
      Today: [
        mockHistory,
        {
          id: 'conv-456',
          title: 'Second Conversation',
          lastSaved: 1234000001,
          messages: [{ role: 'user', content: 'hello?' }],
        },
      ],
    };

    render(
      <SearchHistoryModalBody
        {...props}
        groupedConversations={groupedConversations}
        inputValue="conversation"
      />,
    );

    const searchInput = screen.getByPlaceholderText('Search conversations...');

    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(onSelectConversation).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should not select any conversation when Enter key is pressed with no results', () => {
    const groupedConversations: GroupedSearchHistories = {};

    render(
      <SearchHistoryModalBody
        {...props}
        groupedConversations={groupedConversations}
        inputValue="nonexistent"
      />,
    );

    const searchInput = screen.getByPlaceholderText('Search conversations...');

    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(onSelectConversation).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should close the modal when Escape key is pressed', () => {
    const groupedConversations: GroupedSearchHistories = {
      Today: [mockHistory],
    };

    render(
      <SearchHistoryModalBody
        {...props}
        groupedConversations={groupedConversations}
        inputValue="test"
      />,
    );

    const searchInput = screen.getByPlaceholderText('Search conversations...');

    fireEvent.keyDown(searchInput, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });
});
