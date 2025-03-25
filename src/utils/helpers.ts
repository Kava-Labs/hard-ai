import type { ERC20Record } from '../types/chain';
import {
  ChatMessage,
  ConversationHistory,
  GroupedConversations,
  GroupedSearchHistories,
  SearchableChatHistories,
} from '../types';

/**
 * Determines the time group label for a given timestamp
 * @param timestamp - Unix timestamp in milliseconds
 * @returns A string representing the time group (e.g., 'Today', 'Yesterday', 'Last week')
 */
export const getTimeGroup = (timestamp: number): string => {
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - timestamp) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'Last week';
  if (diffDays <= 14) return '2 weeks ago';
  if (diffDays <= 30) return 'Last month';
  return 'Older';
};

/**
 * Groups an array of conversations by time periods and sorts them by timestamp
 * @param conversations - A record of conversation histories keyed by their id
 * @returns An object with time period keys and arrays of conversations as values
 */
export const groupConversationsByTime = (
  conversations: Record<string, ConversationHistory>,
): GroupedConversations => {
  return Object.values(conversations)
    .sort((a, b) => b.lastSaved - a.lastSaved)
    .reduce<GroupedConversations>((groups, conversation) => {
      const timeGroup = getTimeGroup(conversation.lastSaved);
      if (!groups[timeGroup]) {
        groups[timeGroup] = [];
      }
      groups[timeGroup].push(conversation);
      return groups;
    }, {});
};

/**
 * Formats a conversation title by removing surrounding quotes and truncating if necessary
 * @param title - The original conversation title
 * @param maxLength - Maximum length before truncation (not including ellipsis)
 * @returns Formatted title with quotes removed and truncated if longer than maxLength
 * @example
 * // Returns "Hello World"
 * formatConversationTitle('"Hello World"', 20)
 *
 * // Returns "This is a very lo...."
 * formatConversationTitle("This is a very long title", 15)
 */
export const formatConversationTitle = (title: string, maxLength: number) => {
  let formattedTitle = title;

  // Remove quotes from beginning and end
  if (formattedTitle.startsWith(`"`) || formattedTitle.startsWith(`'`)) {
    formattedTitle = formattedTitle.slice(1);
  }
  if (formattedTitle.endsWith(`"`) || formattedTitle.endsWith(`'`)) {
    formattedTitle = formattedTitle.slice(0, -1);
  }

  if (formattedTitle.length > maxLength) {
    formattedTitle = formattedTitle.slice(0, maxLength) + '....';
  }

  return formattedTitle;
};

export const deepCopy = <T>(obj: T) => {
  return window.structuredClone
    ? window.structuredClone(obj)
    : JSON.parse(JSON.stringify(obj));
};

export const getERC20Record = (
  denom: string,
  records: Record<string, ERC20Record>,
): ERC20Record | null => {
  if (records[denom]) return records[denom];
  if (records[denom.toUpperCase()]) return records[denom.toUpperCase()];

  for (const record of Object.values(records)) {
    if (record.displayName === denom) return record;
    if (record.displayName === denom.toUpperCase()) return record;
    if (record.displayName.toUpperCase() === denom.toUpperCase()) return record;
  }

  return null;
};

export const extractTextContent = (msg: ChatMessage): string => {
  if (typeof msg.content === 'string') {
    return msg.content;
  }

  if (Array.isArray(msg.content)) {
    return msg.content
      .filter((item) => item.type === 'text')
      .map((item) => item.text)
      .join(' ');
  }

  return '';
};

export const groupAndFilterConversations = (
  conversations: SearchableChatHistories,
  searchTerm = '',
): GroupedSearchHistories => {
  // Initialize result object with all possible time groups
  const result: GroupedSearchHistories = {
    Today: [],
    Yesterday: [],
    'Last week': [],
    '2 weeks ago': [],
    'Last month': [],
    Older: [],
  };

  if (!conversations) return result;

  const lowercaseSearchTerm = searchTerm.toLowerCase();

  Object.values(conversations).forEach((conversation) => {
    const titleMatches = conversation.title
      .toLowerCase()
      .includes(lowercaseSearchTerm);

    const messageMatches = conversation.messages.some((message) => {
      const textContent = extractTextContent(message);
      return textContent.toLowerCase().includes(lowercaseSearchTerm);
    });

    if (searchTerm && !titleMatches && !messageMatches) {
      return;
    }

    const timeGroup = getTimeGroup(conversation.lastSaved);

    const history = {
      messages: conversation.messages,
      title: conversation.title,
      lastSaved: conversation.lastSaved,
    };

    result[timeGroup].push(history);
  });

  // Sort the conversations in each time group
  Object.keys(result).forEach((group) => {
    result[group].sort((a, b) => b.lastSaved - a.lastSaved);
  });

  // Remove time groups with empty arrays
  Object.keys(result).forEach((group) => {
    if (result[group].length === 0) {
      delete result[group];
    }
  });

  return result;
};
