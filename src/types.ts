import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from 'openai/resources/index';
import type { MessageHistoryStore } from './stores/messageHistoryStore';
import type { TextStreamStore } from './stores/textStreamStore';
import OpenAI from 'openai/index';
import { ToolCallStreamStore } from './stores/toolCallStreamStore';

export type ActiveChat = {
  id: string;
  isRequesting: boolean;
  isConversationStarted: boolean;
  model: string;
  abortController: AbortController;
  client: OpenAI;
  isOperationValidated: boolean;

  toolCallStreamStore: ToolCallStreamStore;
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

//  type returned from the conversation messages store
export type MessageHistory = { id: string; messages: ChatMessage[] };

//  we need to be able to search all text and sort by time
export type SearchableChatHistory = {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastSaved: number;
};

//  type returned from getSearchableHistory
export type SearchableChatHistories = Record<string, SearchableChatHistory>;

//  Record of searchable histories, indexed by the time group (Today, Yesterday, etc.)
export type GroupedSearchHistories = Record<string, SearchableChatHistory[]>;
