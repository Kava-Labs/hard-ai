import styles from './Conversation.module.css';
import { memo } from 'react';
import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from 'openai/resources/index';
import AssistantMessage from './AssistantMessage';
import { Content } from './Content';
import {
  MessageHistoryStore,
  useMessageHistoryStore,
} from './stores/messageHistoryStore';

export type ChatMessage =
  | ChatCompletionMessageParam
  | ChatCompletionToolMessageParam
  | ChatCompletionAssistantMessageParam;

export interface ConversationProps {
  messageHistoryStore: MessageHistoryStore;
}

const ConversationComponent = ({ messageHistoryStore }: ConversationProps) => {
  const messages = useMessageHistoryStore(messageHistoryStore);

  return (
    <div className={styles.conversationContainer}>
      {messages.map((message, index) => {
        if (message.role === 'user') {
          return (
            <div key={index} className={styles.userInputContainer}>
              <Content
                role={message.role}
                content={message.content as string}
              />
            </div>
          );
        }

        if (message.role === 'assistant' && message.content) {
          return (
            <AssistantMessage key={index} content={message.content as string} />
          );
        }

        return null;
      })}
    </div>
  );
};

export const Conversation = memo(ConversationComponent);
