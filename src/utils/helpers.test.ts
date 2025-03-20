import { afterEach, beforeEach, describe, it, vi, expect } from 'vitest';
import {
  formatConversationTitle,
  getTimeGroup,
  groupConversationsByTime,
} from './helpers';
import { ConversationHistories } from '../types';

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
