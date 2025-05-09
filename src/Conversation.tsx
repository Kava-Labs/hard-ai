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
import { ToolCallStream } from './stores/toolCallStreamStore';
import { ToolCallRegistry } from './toolcalls/chain';
import { ToolMessageContainer } from './toolcalls/components/ToolCallMessageContainer';
import { BrainIcon } from 'lucide-react';

export type ChatMessage =
  | ChatCompletionMessageParam
  | ChatCompletionToolMessageParam
  | ChatCompletionAssistantMessageParam;

export interface ConversationProps {
  messages: ChatMessage[];
  assistantStream: string;
  errorText: string;
  isRequesting: boolean;
  onRendered: () => void;
  toolCallStreams: Array<ToolCallStream>;
  toolCallRegistry: ToolCallRegistry<unknown>;
  isOperationValidated: boolean;
}

const ConversationComponent = ({
  messages,
  isRequesting,
  errorText,
  assistantStream,
  onRendered,
  toolCallStreams,
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
              toolCallRegistry={toolCallRegistry}
            />
          );
        }

        return null;
      })}

      {isRequesting && (
        <div className={styles.assistantOutputContainer}>
          <div className={styles.assistantContainer}>
            {assistantStream.length === 0 ? (
              <div className={`${styles.brainIconContainer} ${styles.pulsing}`}>
                <BrainIcon
                  className={`${styles.brainIcon} ${styles.pulsing}`}
                  aria-label="Progress Icon"
                />
              </div>
            ) : (
              <Content
                content={assistantStream}
                role="assistant"
                onRendered={onRendered}
              />
            )}
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
        toolCallStreams={toolCallStreams}
        toolCallRegistry={toolCallRegistry}
      />
    </div>
  );
};

export const Conversation = memo(ConversationComponent);
