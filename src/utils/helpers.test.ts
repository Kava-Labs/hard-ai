import { afterEach, beforeEach, describe, it, vi, expect } from 'vitest';
import {
  formatContentSnippet,
  formatConversationTitle,
  getTimeGroup,
  groupAndFilterConversations,
  groupConversationsByTime,
} from './helpers';
import {
  ConversationHistories,
  SearchableChatHistories,
  SearchableChatHistory,
} from '../types';

describe('getTimeGroup', () => {
  beforeEach(() => {
    // establish a fixed date for testing
    const now = new Date('2024-02-13T12:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "Today" for same day timestamps', () => {
    const today = new Date('2024-02-13T10:00:00Z').getTime();
    expect(getTimeGroup(today)).toBe('Today');
  });

  it('should return "Yesterday" for previous day timestamps', () => {
    const yesterday = new Date('2024-02-12T10:00:00Z').getTime();
    expect(getTimeGroup(yesterday)).toBe('Yesterday');
  });

  it('should return "Last week" for timestamps within 7 days', () => {
    const sixDaysAgo = new Date('2024-02-07T10:00:00Z').getTime();
    expect(getTimeGroup(sixDaysAgo)).toBe('Last week');
  });

  it('should return "2 weeks ago" for timestamps within 14 days', () => {
    const twelveDaysAgo = new Date('2024-02-01T10:00:00Z').getTime();
    expect(getTimeGroup(twelveDaysAgo)).toBe('2 weeks ago');
  });

  it('should return "Last month" for timestamps within 30 days', () => {
    const twentyFiveDaysAgo = new Date('2024-01-19T10:00:00Z').getTime();
    expect(getTimeGroup(twentyFiveDaysAgo)).toBe('Last month');
  });

  it('should return "Older" for timestamps older than 30 days', () => {
    const longLongAgo = new Date('2023-01-04T10:00:00Z').getTime();
    expect(getTimeGroup(longLongAgo)).toBe('Older');
  });
});

describe('groupConversationsByTime', () => {
  let mockHistories: ConversationHistories;
  const now = new Date('2024-02-13T12:00:00Z').getTime();

  beforeEach(() => {
    vi.spyOn(Date.prototype, 'getTime').mockImplementation(() => now);

    mockHistories = {
      '1': {
        id: '1',
        title: 'Today Chat',
        lastSaved: now - 1000 * 60 * 60 * 2, // 2 hours ago
        model: 'gpt-4o-mini',
        tokensRemaining: 128000,
      },
      '2': {
        id: '2',
        title: 'Yesterday Chat',
        lastSaved: now - 1000 * 60 * 60 * 25, // 25 hours ago
        model: 'gpt-4o-mini',
        tokensRemaining: 128000,
      },
      '3': {
        id: '3',
        title: 'Last Week Chat',
        lastSaved: now - 1000 * 60 * 60 * 24 * 5, // 5 days ago
        model: 'gpt-4o-mini',
        tokensRemaining: 128000,
      },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should group conversations by time period', () => {
    const grouped = groupConversationsByTime(mockHistories);

    expect(Object.keys(grouped)).toEqual(['Today', 'Yesterday', 'Last week']);
    expect(grouped['Today'][0].title).toBe('Today Chat');
    expect(grouped['Yesterday'][0].title).toBe('Yesterday Chat');
    expect(grouped['Last week'][0].title).toBe('Last Week Chat');
  });

  it('should sort conversations by timestamp within groups', () => {
    const anotherTodayChat = {
      id: '4',
      title: 'Another Today Chat',
      lastSaved: now - 1000 * 60 * 60, // 1 hour ago
      conversation: [],
      model: 'gpt-4o-mini',
      tokensRemaining: 128000,
    };

    mockHistories['4'] = anotherTodayChat;

    const grouped = groupConversationsByTime(mockHistories);
    expect(grouped['Today'][0].title).toBe('Another Today Chat');
    expect(grouped['Today'][1].title).toBe('Today Chat');
  });

  it('should handle empty conversations array', () => {
    const grouped = groupConversationsByTime({});
    expect(grouped).toEqual({});
  });
});

describe('formatConversationTitle', () => {
  it('should remove double quotes from beginning and end', () => {
    expect(formatConversationTitle('"Hello World"', 20)).toBe('Hello World');
  });

  it('should remove single quotes from beginning and end', () => {
    expect(formatConversationTitle("'Hello World'", 20)).toBe('Hello World');
  });

  it('should handle mixed quotes', () => {
    expect(formatConversationTitle('"Hello World\'', 20)).toBe('Hello World');
    expect(formatConversationTitle('\'Hello World"', 20)).toBe('Hello World');
  });

  it('should not remove quotes from middle of string', () => {
    expect(formatConversationTitle('Hello "World" Test', 20)).toBe(
      'Hello "World" Test',
    );
  });

  it('should truncate strings longer than maxLength', () => {
    expect(formatConversationTitle('This is a very long title', 10)).toBe(
      'This is a ....',
    );
  });

  it('should not modify strings shorter than maxLength', () => {
    expect(formatConversationTitle('Short', 10)).toBe('Short');
  });

  it('should handle strings with exactly maxLength', () => {
    expect(formatConversationTitle('1234567890', 10)).toBe('1234567890');
  });

  it('should handle strings with quotes and requiring truncation', () => {
    expect(
      formatConversationTitle('"This is a very long quoted title"', 10),
    ).toBe('This is a ....');
  });
});

describe('groupAndFilterConversations', () => {
  const now = new Date('2024-02-13T12:00:00Z').getTime();

  const mockSearchHistories: SearchableChatHistories = {
    1: {
      title: 'Bitcoin Discussion',
      lastSaved: now - 1000 * 60 * 60 * 2,
      messages: [{ role: 'user', content: 'Can I have bitcoin advice?' }],
    },
    2: {
      title: 'Ethereum Chat',
      lastSaved: now - 1000 * 60 * 60 * 25,
      messages: [{ role: 'user', content: 'Where can I buy ETH?' }],
    },
    3: {
      title: 'Blockchain Overview',
      lastSaved: now - 1000 * 60 * 60 * 24 * 5,
      messages: [
        { role: 'user', content: 'What is the history of blockchain?' },
      ],
    },
    4: {
      title: 'Party planning tips',
      lastSaved: now - 1000 * 60 * 60 * 24 * 6,
      messages: [{ role: 'user', content: 'I need help planning.' }],
    },
  };

  beforeEach(() => {
    vi.spyOn(Date.prototype, 'getTime').mockImplementation(() => now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should filter conversations based on search term', () => {
    const filtered = groupAndFilterConversations(
      mockSearchHistories,
      'bitcoin',
    );
    expect(Object.keys(filtered)).toEqual(['Today']);
    expect(filtered['Today'][0].title).toBe('Bitcoin Discussion');
  });

  it('should be case insensitive when filtering', () => {
    const filtered = groupAndFilterConversations(mockSearchHistories, 'ADVICE');
    expect(filtered['Today'][0].title).toBe('Bitcoin Discussion');
  });

  it('should handle partial matches', () => {
    const filtered = groupAndFilterConversations(
      mockSearchHistories,
      '  block',
    );
    expect(filtered['Last week'][0].title).toBe('Blockchain Overview');
  });

  it('should return all conversations when search term is empty', () => {
    const filtered = groupAndFilterConversations(mockSearchHistories, '');

    expect(filtered['Today'][0].title).toBe('Bitcoin Discussion');
    expect(filtered['Yesterday'][0].title).toBe('Ethereum Chat');
    expect(filtered['Last week'][0].title).toBe('Blockchain Overview');
    expect(filtered['Last week'][1].title).toBe('Party planning tips');
  });

  it('handles multiple content matches', () => {
    const filtered = groupAndFilterConversations(mockSearchHistories, 'can');
    expect(filtered['Today'][0].title).toBe('Bitcoin Discussion');
    expect(filtered['Yesterday'][0].title).toBe('Ethereum Chat');
  });

  it('handles missing search', () => {
    const filtered = groupAndFilterConversations(mockSearchHistories, '1');
    expect(filtered).toStrictEqual({});
  });

  it('should return conversations from the correct time groups and remove any empty groups', () => {
    const filtered = groupAndFilterConversations(
      mockSearchHistories,
      'discussion',
    );
    expect(filtered['Today'][0].title).toBe('Bitcoin Discussion');
    expect(filtered['Yesterday']).toBeUndefined();
    expect(filtered['Last week']).toBeUndefined();
  });
});

describe('formatContentSnippet', () => {
  const mockSearchableHistory: SearchableChatHistory = {
    title: 'Test Conversation',
    lastSaved: Date.now(),
    messages: [
      {
        role: 'system',
        content: 'System prompt that should be ignored',
      },
      {
        role: 'user',
        content: 'First user message',
      },
      {
        role: 'assistant',
        content: 'First assistant response with searchable content',
      },
      {
        role: 'user',
        content: 'Second user message with different content',
      },
    ],
  };

  it('returns snippet starting with search term when found at start of message', () => {
    const result = formatContentSnippet(mockSearchableHistory, 'First');
    expect(result).toBe('First user message');
  });

  it('includes up to 3 words before search term when found mid-message', () => {
    const historyWithMidMatch: SearchableChatHistory = {
      ...mockSearchableHistory,
      messages: [
        {
          role: 'assistant',
          content: 'The quick brown fox jumps over the lazy dog',
        },
      ],
    };
    const result = formatContentSnippet(historyWithMidMatch, 'jumps');
    expect(result).toBe('quick brown fox jumps over the lazy dog');
  });

  it('includes fewer preceding words if not enough before match', () => {
    const historyWithShortPrefix: SearchableChatHistory = {
      ...mockSearchableHistory,
      messages: [
        {
          role: 'assistant',
          content: 'quick brown jumps over',
        },
      ],
    };
    const result = formatContentSnippet(historyWithShortPrefix, 'jumps');
    expect(result).toBe('quick brown jumps over');
  });

  it('returns first user message when no search term is provided', () => {
    const result = formatContentSnippet(mockSearchableHistory);
    expect(result).toBe('First user message');
  });

  it('returns empty string when no messages match and no user messages exist', () => {
    const emptyHistory: SearchableChatHistory = {
      title: 'Empty Conversation',
      lastSaved: Date.now(),
      messages: [
        {
          role: 'system',
          content: 'System prompt only',
        },
      ],
    };
    const result = formatContentSnippet(emptyHistory, 'nonexistent');
    expect(result).toBe('');
  });

  it('is case insensitive for search matches', () => {
    const historyWithMidMatch: SearchableChatHistory = {
      ...mockSearchableHistory,
      messages: [
        {
          role: 'assistant',
          content: 'The quick brown fox jumps over the lazy dog',
        },
      ],
    };
    const result = formatContentSnippet(historyWithMidMatch, 'JUMPS');
    expect(result).toBe('quick brown fox jumps over the lazy dog');
  });

  it('truncates long matches to 100 characters', () => {
    const longHistory: SearchableChatHistory = {
      ...mockSearchableHistory,
      messages: [
        {
          role: 'assistant',
          content: 'preceding words match ' + 'a'.repeat(200),
        },
      ],
    };
    const result = formatContentSnippet(longHistory, 'match');
    expect(result.length).toBe(100);
    expect(result).toContain('preceding words match');
  });

  it('finds matches in any message, not just the first one', () => {
    const result = formatContentSnippet(mockSearchableHistory, 'different');
    expect(result).toBe('user message with different content');
  });

  it('handles search term at the end of content', () => {
    const historyWithEndMatch: SearchableChatHistory = {
      ...mockSearchableHistory,
      messages: [
        {
          role: 'assistant',
          content: 'This is the end',
        },
      ],
    };
    const result = formatContentSnippet(historyWithEndMatch, 'end');
    expect(result).toBe('This is the end');
  });

  it('correctly handles multiple occurrences of search term and returns first match', () => {
    const historyWithMultipleMatches: SearchableChatHistory = {
      ...mockSearchableHistory,
      messages: [
        {
          role: 'user',
          content: 'First mention of search term is here',
        },
        {
          role: 'assistant',
          content: 'Second mention of search term comes after',
        },
      ],
    };
    const result = formatContentSnippet(
      historyWithMultipleMatches,
      'search term',
    );
    expect(result).toBe('First mention of search term is here');
  });

  it('returns snippet when search term spans multiple words', () => {
    const result = formatContentSnippet(mockSearchableHistory, 'user message');
    expect(result).toBe('First user message');
  });
});
