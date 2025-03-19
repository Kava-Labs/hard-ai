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
  conversation: ChatCompletionMessageParam[];
  lastSaved: number;
  tokensRemaining: number;
};


export type ConversationHistories = Record<string, ConversationHistory>;

export type ChatMessage =
  | ChatCompletionMessageParam
  | ChatCompletionToolMessageParam
  | ChatCompletionAssistantMessageParam;
