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
import { TextStreamStore, useTextStreamStore } from './stores/textStreamStore';

export type ChatMessage =
  | ChatCompletionMessageParam
  | ChatCompletionToolMessageParam
  | ChatCompletionAssistantMessageParam;

export interface ConversationProps {
  messageHistoryStore: MessageHistoryStore;
  progressStore: TextStreamStore;
  messageStore: TextStreamStore;
  errorStore: TextStreamStore;
  isRequesting: boolean;
}

const ConversationComponent = ({
  messageHistoryStore,
  isRequesting,
  progressStore,
  errorStore,
  messageStore,
}: ConversationProps) => {
  const messages = useMessageHistoryStore(messageHistoryStore);
  const errorText = useTextStreamStore(errorStore);

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
        <StreamingMessage
          progressStore={progressStore}
          messageStore={messageStore}
        />
      )}

      {errorText.length > 0 && (
        <div className={styles.assistantOutputContainer}>
          <div className={styles.assistantContainer}>
            <Content content={errorText} role="assistant" />
          </div>
        </div>
      )}
    </div>
  );
};

const StreamingMessage = ({
  progressStore,
  messageStore,
}: {
  progressStore: TextStreamStore;
  messageStore: TextStreamStore;
}) => {
  const progressText = useTextStreamStore(progressStore);
  const assistantStream = useTextStreamStore(messageStore);

  return (
    <div className={styles.assistantOutputContainer}>
      <div className={styles.assistantContainer}>
        {progressText.length ? (
          <Content content={progressText} role="assistant" />
        ) : null}
        {<Content content={assistantStream} role="assistant" />}
      </div>
    </div>
  );
};

export const Conversation = memo(ConversationComponent);
