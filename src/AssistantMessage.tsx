import styles from './Conversation.module.css';
import { Content } from './Content';
import { ChatCompletionMessageToolCall } from 'openai/resources/index';
import { ToolCallRegistry } from './toolcalls/chain';
import { ToolCallsDisplay } from './toolcalls/components/ToolCallsDisplay';

interface AssistantMessageProps {
  content: string | null;
  toolCalls?: ChatCompletionMessageToolCall[];
  toolCallRegistry?: ToolCallRegistry<unknown>;
}

const AssistantMessage = ({
  content,
  toolCalls,
  toolCallRegistry,
}: AssistantMessageProps) => {
  return (
    <div className={styles.assistantOutputContainer}>
      <div className={styles.assistantContainer}>
        {content && <Content role="assistant" content={content} />}
        {toolCalls && toolCallRegistry && (
          <ToolCallsDisplay
            toolCalls={toolCalls}
            toolCallRegistry={toolCallRegistry}
          />
        )}
      </div>
    </div>
  );
};

export default AssistantMessage;
