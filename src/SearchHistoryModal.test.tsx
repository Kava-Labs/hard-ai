import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchHistoryModalBody } from './SearchHistoryModalBody';
import { GroupedSearchHistories, SearchableChatHistory } from './types';

describe('SearchHistoryModalBody', () => {
  const onSelectConversation = vi.fn();
  const handleSearchTermChange = vi.fn();
  const onClose = vi.fn();

  const props = {
    onSelectConversation,
    onClose,
    handleSearchTermChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should select the only conversation when Enter key is pressed', () => {
    const singleConversation: SearchableChatHistory = {
      id: 'conv-123',
      title: 'Test Conversation',
      messages: [{ role: 'user', content: 'This is a test' }],
      lastSaved: 1234000000,
    };

    const groupedConversations: GroupedSearchHistories = {
      Today: [singleConversation],
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
        {
          id: 'conv-123',
          title: 'First Conversation',
          messages: [{ role: 'user', content: 'This is a test' }],
          lastSaved: 1234000000,
        },
        {
          id: 'conv-456',
          title: 'Second Conversation',
          messages: [{ role: 'user', content: 'This is a test' }],
          lastSaved: 1234000001,
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
      Today: [
        {
          id: 'conv-123',
          title: 'Test Conversation',
          messages: [{ role: 'user', content: 'This is a test' }],
          lastSaved: 1234000000,
        },
      ],
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
