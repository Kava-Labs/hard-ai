import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from 'openai/resources/index';
import type { MessageHistoryStore } from './stores/messageHistoryStore';
import type { TextStreamStore } from './stores/textStreamStore';
import OpenAI from 'openai/index';

export type ActiveChat = {
  id: string;
  isRequesting: boolean;
  isConversationStarted: boolean;
  model: string;
  abortController: AbortController;
  client: OpenAI;

  messageHistoryStore: MessageHistoryStore;
  messageStore: TextStreamStore;
  progressStore: TextStreamStore;
  errorStore: TextStreamStore;
};

export type ConversationHistory = {
  id: string;
  model: string;
  title: string;
  lastSaved: number;
  tokensRemaining: number;
};

export type ConversationHistories = Record<string, ConversationHistory>;

export type ChatMessage =
  | ChatCompletionMessageParam
  | ChatCompletionToolMessageParam
  | ChatCompletionAssistantMessageParam;

export type MessageHistory = { id: string; messages: ChatMessage[] };

export type SearchableChatHistories = Record<
  string,
  { title: string; messages: ChatMessage[] }
>;
