import {
  ChatMessage,
  ConversationHistory,
  MessageHistory,
  SearchableChatHistories,
} from '../types';

/**
 * Merges conversation data with their respective messages, excluding conversations without messages.
 * @param messageHistory - Array of objects containing conversation IDs and their messages.
 * @param conversationHistory - Array of objects containing conversation IDs and their titles (and other metadata).
 * @returns An object indexed by conversation ID containing titles and associated messages to be used in search.
 */
export function mergeTitleAndMessages(
  messageHistory: MessageHistory[],
  conversationHistory: ConversationHistory[],
): SearchableChatHistories {
  //  Build the map of conversation IDs to the that conversation's messages
  const messagesMap = messageHistory.reduce<Record<string, ChatMessage[]>>(
    (acc, entry) => {
      acc[entry.id] = entry.messages;
      return acc;
    },
    {},
  );

  //  Add the titles to the map so we can load/search all conversation text
  return conversationHistory.reduce<SearchableChatHistories>((acc, entry) => {
    if (messagesMap[entry.id]) {
      acc[entry.id] = {
        id: entry.id,
        title: entry.title,
        messages: messagesMap[entry.id],
        lastSaved: entry.lastSaved,
      };
    }
    return acc;
  }, {});
}
