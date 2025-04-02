import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchHistoryModalBody } from './SearchHistoryModalBody';
import { GroupedSearchHistories, SearchableChatHistory } from './types';

//  rather than set up and tear down mocks, let's move this into the lib so we don't need to '
//  temporarily mock helpers
describe.skip('SearchHistoryModalBody', () => {
  const mockHistory: SearchableChatHistory = {
    id: 'conv-123',
    title: 'Test Conversation',
    messages: [{ role: 'user', content: 'This is a test' }],
    lastSaved: 1234000000,
  };

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
    const groupedConversations: GroupedSearchHistories = {
      Today: [mockHistory],
    };

    render(
      <SearchHistoryModalBody
        {...props}
        groupedConversations={groupedConversations}
        searchTerm="test"
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
        searchTerm="conversation"
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
        searchTerm="nonexistent"
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
        searchTerm="test"
      />,
    );

    const searchInput = screen.getByPlaceholderText('Search conversations...');

    fireEvent.keyDown(searchInput, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('highlights matching text in conversation titles', () => {
    const history: SearchableChatHistory = {
      ...mockHistory,
      title: 'Test Conversation About Bitcoin',
      messages: [{ role: 'user', content: 'This is about something else' }],
    };

    const searchTerm = 'Bitcoin';
    const expectedTitle = 'Test Conversation About <strong>Bitcoin</strong>';

    const groupedConversations: GroupedSearchHistories = {
      Today: [history],
    };

    render(
      <SearchHistoryModalBody
        {...props}
        groupedConversations={groupedConversations}
        searchTerm={searchTerm}
      />,
    );

    const titleElement = screen.getByText(/Test Conversation About/);
    expect(titleElement.innerHTML).toBe(expectedTitle);
  });

  it('highlights matching text in conversation snippets', () => {
    const history: SearchableChatHistory = {
      ...mockHistory,
      title: 'Simple Conversation',
      messages: [{ role: 'user', content: 'This is about Ethereum' }],
    };

    const searchTerm = 'Ethereum';
    const expectedSnippet = 'This is about <strong>Ethereum</strong>';

    const groupedConversations: GroupedSearchHistories = {
      Today: [history],
    };

    render(
      <SearchHistoryModalBody
        {...props}
        groupedConversations={groupedConversations}
        searchTerm={searchTerm}
      />,
    );

    const snippetElement = screen.getByText(/This is about/);
    expect(snippetElement.innerHTML).toBe(expectedSnippet);
  });

  it('handles case-insensitive highlighting', () => {
    const history: SearchableChatHistory = {
      ...mockHistory,
      title: 'Tokenomics discussion',
      messages: [{ role: 'user', content: 'This is about DeFi.' }],
    };

    const searchTerm = 'TOKENOMICS';
    const expectedTitle = '<strong>Tokenomics</strong> discussion';

    const groupedConversations: GroupedSearchHistories = {
      Today: [history],
    };

    render(
      <SearchHistoryModalBody
        {...props}
        groupedConversations={groupedConversations}
        searchTerm={searchTerm}
      />,
    );

    const titleElement = screen.getByText(/discussion/);
    expect(titleElement.innerHTML).toBe(expectedTitle);
  });

  it('highlights same search term in both title and content with special characters', () => {
    const history: SearchableChatHistory = {
      ...mockHistory,
      title: 'Working with Artificial Intelligence',
      messages: [
        { role: 'user', content: 'How do I use artificial intelligence?' },
      ],
    };

    const searchTerm = 'artificial';
    const expectedTitle =
      'Working with <strong>Artificial</strong> Intelligence';
    const expectedSnippet =
      'do I use <strong>artificial</strong> intelligence?';

    const groupedConversations: GroupedSearchHistories = {
      Today: [history],
    };

    render(
      <SearchHistoryModalBody
        groupedConversations={groupedConversations}
        onSelectConversation={onSelectConversation}
        handleSearchTermChange={handleSearchTermChange}
        onClose={onClose}
        searchTerm={searchTerm}
      />,
    );

    const titleElement = screen.getByText(/Working with/);
    expect(titleElement.innerHTML).toBe(expectedTitle);

    const snippetElement = screen.getByText(/do I use/);
    expect(snippetElement.innerHTML).toBe(expectedSnippet);
  });
});
