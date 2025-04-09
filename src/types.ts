import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from 'openai/resources/index';
import type { MessageHistoryStore } from './stores/messageHistoryStore';
import type { TextStreamStore } from 'lib-kava-ai';
import OpenAI from 'openai/index';
import { ToolCallStreamStore } from './stores/toolCallStreamStore';
import { EIP6963ProviderInfo } from './stores/walletStore';

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

//  we need to be able to search all text and sort by time
export type SearchableChatHistory = {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastSaved: number;
};

//  type returned from getSearchableHistory
export type SearchableChatHistories = Record<string, SearchableChatHistory>;

export type DisplayedWalletProviderInfo = Partial<
  Pick<EIP6963ProviderInfo, 'name' | 'icon'>
>;
