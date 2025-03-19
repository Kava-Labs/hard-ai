import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from 'openai/resources/index';

export type ConversationHistory = {
  id: string;
  model: string;
  title: string;
  conversation: ChatCompletionMessageParam[];
  lastSaved: number;
  tokensRemaining: number;
};

export type ConversationHistories = Record<string, ConversationHistory>;

export interface ReasoningAssistantMessage {
  role: 'assistant';
  content: string;
  reasoningContent?: string;
}

export type ChatMessage =
  | ChatCompletionMessageParam
  | ChatCompletionToolMessageParam
  | ChatCompletionAssistantMessageParam
  | ReasoningAssistantMessage;
