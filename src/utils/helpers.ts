import type { ERC20Record, CoinRecord } from '../toolcalls/chain';
import {
  ChatMessage,
  GroupedSearchHistories,
  SearchableChatHistories,
  SearchableChatHistory,
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
 * @param conversations - A record of conversation histories keyed by their id, can be either ConversationHistories or SearchableChatHistories
 * @returns An object with time period keys (e.g., "Today", "Yesterday") and arrays of conversations as values
 */
export const groupConversationsByTime = <T extends { lastSaved: number }>(
  conversations: Record<string, T>,
): Record<string, T[]> => {
  return Object.values(conversations)
    .sort((a, b) => b.lastSaved - a.lastSaved)
    .reduce<Record<string, T[]>>((groups, conversation) => {
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

export const getCoinRecord = (
  denom: string,
  records: Record<string, CoinRecord>,
) => {
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
/**
 * Groups and filters conversations based on their timestamp and an optional search term.
 *
 * This function organizes conversations into time-based groups (Today, Yesterday, etc.)
 * and can filter them based on a search term that matches either the conversation title
 * or any message content.
 *
 * @param conversations - Collection of conversations to process
 * @param searchTerm - Optional term to filter conversations (matches title or message content)
 * @returns An object with time groups as keys and arrays of matching conversations as values
 */
export const groupAndFilterConversations = (
  conversations: SearchableChatHistories,
  searchTerm = '',
): GroupedSearchHistories => {
  const groupedFilteredResults: GroupedSearchHistories = {};

  if (!conversations) return groupedFilteredResults;

  const isSearching = searchTerm.trim() !== '';
  const searchRegex = isSearching ? new RegExp(searchTerm.trim(), 'i') : null;

  Object.values(conversations).forEach((conversation) => {
    //  If we aren't searching, return all histories, sorted by time
    if (isSearching && searchRegex) {
      //  Primary search is for title match
      const titleMatches = searchRegex.test(conversation.title);

      //  Secondary search is for content matches
      if (!titleMatches) {
        const messageMatches = conversation.messages.some((message) => {
          const textContent = extractTextContent(message);
          return searchRegex.test(textContent);
        });

        //  if we haven't found any title or content matches, return (triggers 'No results')
        if (!messageMatches) return;
      }
    }

    const timeGroup = getTimeGroup(conversation.lastSaved);

    //  Initialize the time group if it doesn't exist yet
    if (!groupedFilteredResults[timeGroup]) {
      groupedFilteredResults[timeGroup] = [];
    }

    groupedFilteredResults[timeGroup].push(conversation);
  });

  for (const tGroup in groupedFilteredResults) {
    //  Only sort if the group has more than one entry
    if (groupedFilteredResults[tGroup].length > 1) {
      groupedFilteredResults[tGroup].sort((a, b) => b.lastSaved - a.lastSaved);
    }
  }

  return groupedFilteredResults;
};

const removeSystemMessages = (messages: ChatMessage[]) => {
  return messages.filter((msg) => msg.role !== 'system');
};

/**
 * Formats a content snippet from a conversation history based on a search term
 *
 * @param conversation - The search history object containing messages to search through
 * @param searchTerm - Optional term to search for within messages (defaults to empty string)
 * @returns A formatted string snippet showing the context around the search match, or the first user message if no match
 *
 * @notes
 * - If a search term is provided, it returns up to 100 characters including the match and up to 3 preceding words
 * - If no search term is provided or no matches found, it returns the first 100 characters of the first user message
 * - System messages are ignored in the search
 */
export const formatContentSnippet = (
  conversation: SearchableChatHistory,
  searchTerm: string = '',
): string => {
  const messages = removeSystemMessages(conversation.messages);

  if (searchTerm.trim() !== '') {
    for (const message of messages) {
      const content = extractTextContent(message);
      const searchRegex = new RegExp(searchTerm, 'i');
      const match = content.match(searchRegex);

      //  If a match is found
      if (match && match.index !== undefined) {
        const searchIndex = match.index;
        //  Find start of snippet considering up to 3 words before match
        let snippetStart = searchIndex;
        if (searchIndex > 0) {
          const beforeMatch = content.slice(0, searchIndex).trim();
          const precedingWords = beforeMatch.split(' ').slice(-3);
          snippetStart = searchIndex - (precedingWords.join(' ').length + 1);
          if (snippetStart < 0) snippetStart = 0;
        }

        return content.slice(snippetStart, snippetStart + 100).trim();
      }
    }
  }

  //  Fallback to the first user message if no search term or no matches
  const firstUserMessage = messages.find((msg) => msg.role === 'user');
  if (firstUserMessage) {
    const content = extractTextContent(firstUserMessage);
    return content.slice(0, 100);
  }

  return '';
};

/**
 * Wraps matched text in a string with <strong> tags, preserving case
 * @param text - The full text to search within
 * @param searchTerm - The term to wrap in bold tags
 * @returns The text with matched terms wrapped in <strong> tags if searchTerm is at least 2 characters, otherwise returns original text
 */
export const highlightMatch = (
  text: string,
  searchTerm: string = '',
): string => {
  if (!searchTerm || searchTerm.length < 2) return text;

  const regex = new RegExp(`(${searchTerm})`, 'gi');
  //  '$1' preserves the casing of the match
  return text.replace(regex, '<strong>$1</strong>');
};
