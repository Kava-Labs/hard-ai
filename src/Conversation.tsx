import styles from './Conversation.module.css';
import { memo } from 'react';
import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from 'openai/resources/index';
import AssistantMessage from './AssistantMessage';
import { Content } from './Content';
import { ToolCallProgressCards } from './ToolCallProgressCards';
import { TextStreamStore } from './stores/textStreamStore';
import { ToolCallStreamStore } from './stores/toolCallStreamStore';
import { ToolCallRegistry } from './toolcalls/chain';
import { ToolMessageContainer } from './toolcalls/components/ToolCallMessageContainer';

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
  onRendered: () => void;
  progressStore: TextStreamStore;
  toolCallStreamStore: ToolCallStreamStore;
  toolCallRegistry: ToolCallRegistry<unknown>;
  isOperationValidated: boolean;
}

const ConversationComponent = ({
  messages,
  isRequesting,
  progressText,
  errorText,
  assistantStream,
  onRendered,

  progressStore,
  toolCallStreamStore,
  toolCallRegistry,
  isOperationValidated,
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

        if (message.role === 'tool') {
          return (
            <ToolMessageContainer
              key={index}
              message={message}
              prevMessage={
                messages[index - 1] as ChatCompletionAssistantMessageParam
              }
              onRendered={onRendered}
              toolCallRegistry={toolCallRegistry}
            />
          );
        }

        return null;
      })}

      {isRequesting && (
        <div className={styles.assistantOutputContainer}>
          <div className={styles.assistantContainer}>
            {progressText.length ? (
              <div className={styles.progressStream}>
                <Content
                  content={progressText}
                  role="assistant"
                  onRendered={onRendered}
                />
              </div>
            ) : null}
            <Content
              content={assistantStream}
              role="assistant"
              onRendered={onRendered}
            />
          </div>
        </div>
      )}

      {errorText.length > 0 && (
        <div className={styles.assistantOutputContainer}>
          <div className={styles.assistantContainer}>
            <Content
              content={errorText}
              role="assistant"
              onRendered={onRendered}
            />
          </div>
        </div>
      )}

      <ToolCallProgressCards
        isOperationValidated={isOperationValidated}
        onRendered={onRendered}
        progressStore={progressStore}
        toolCallStreamStore={toolCallStreamStore}
        toolCallRegistry={toolCallRegistry}
      />
    </div>
  );
};

export const Conversation = memo(ConversationComponent);
