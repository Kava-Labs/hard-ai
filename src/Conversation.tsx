import styles from './Conversation.module.css';
import { memo, useCallback, useEffect } from 'react';
import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from 'openai/resources/index';
import AssistantMessage from './AssistantMessage';
import { Content } from './Content';

export type ChatMessage =
  | ChatCompletionMessageParam
  | ChatCompletionToolMessageParam
  | ChatCompletionAssistantMessageParam;

export interface ConversationProps {
  messages: ChatMessage[];
  progressText: string;
  assistantStream: string;
  errorText: string;
  isRequesting: boolean;
}

const ConversationComponent = ({
  messages,
  isRequesting,
  progressText,
  errorText,
  assistantStream,
}: ConversationProps) => {
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

      {isRequesting && (
        <div className={styles.assistantOutputContainer}>
          <div className={styles.assistantContainer}>
            {progressText.length ? (
              <Content
                content={progressText}
                role="assistant"
                onRendered={onRendered}
              />
            ) : null}
            {
              <Content
                content={assistantStream}
                role="assistant"
                onRendered={onRendered}
              />
            }
          </div>
        </div>
      )}

      {errorText.length > 0 && (
        <div className={styles.assistantOutputContainer}>
          <div className={styles.assistantContainer}>
            <Content
              content={errorText}
              role="assistant"
              onRendered={handleContentRendered}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const Conversation = memo(ConversationComponent);
