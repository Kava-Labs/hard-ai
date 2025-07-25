import React from 'react';
import { ChatCompletionMessageToolCall } from 'openai/resources/index';
import { ToolCallRegistry } from '../chain';
import { InProgressComponentProps } from '../chain';
import { ToolCallStream } from '../../stores/toolCallStreamStore';
import { useScrollToBottom } from '../../useScrollToBottom';
import styles from './DisplayCards.module.css';

interface ToolCallDisplayProps {
  toolCall: ChatCompletionMessageToolCall | ToolCallStream;
  status: 'completed' | 'in-progress';
  onRendered?: () => void;
  isOperationValidated?: boolean;
}

interface ToolCallsDisplayProps {
  toolCalls: ChatCompletionMessageToolCall[];
  toolCallRegistry: ToolCallRegistry<unknown>;
}

const parseToolCallArguments = (
  args: string | Record<string, unknown>,
): Record<string, unknown> => {
  try {
    if (typeof args === 'string') {
      return JSON.parse(args || '{}');
    } else if (typeof args === 'object' && args !== null) {
      return args as Record<string, unknown>;
    }
  } catch (error) {
    console.warn('Failed to parse tool call arguments:', error);
  }

  return {};
};

const getToolDisplayName = (toolName: string): string => {
  // Remove the prefixes in MCP tool names
  if (toolName.startsWith('exa_mcp-')) {
    return toolName.replace('exa_mcp-', '').replace(/_/g, ' ');
  }

  return toolName.replace(/_/g, ' ');
};

export const ToolCallDisplay = ({
  toolCall,
  status,
  onRendered,
  isOperationValidated,
}: ToolCallDisplayProps) => {
  // Auto-scroll to bottom only for in-progress tool calls to keep UI updated
  // onRendered: callback to scroll when component renders
  // isOperationValidated: dependency to re-trigger scroll when validation state changes
  useScrollToBottom(
    status === 'in-progress' && onRendered ? onRendered : () => {},
    status === 'in-progress' && isOperationValidated !== undefined
      ? isOperationValidated
      : false,
  );

  const args = parseToolCallArguments(toolCall.function.arguments);
  const toolDisplayName = getToolDisplayName(
    toolCall.function.name || 'unknown tool',
  );

  const statusText = status === 'in-progress' ? 'In Progress' : 'Completed';
  const statusClass =
    status === 'in-progress' ? styles.inProgress : styles.complete;
  const testId =
    status === 'in-progress'
      ? 'in-progress-tool-display'
      : 'completed-tool-display';

  return (
    <div data-testid={testId} className={styles.inprogressContainer}>
      <div className={styles.transactionCard}>
        <div className={styles.statusSection}>
          <h3 className={styles.sectionLabel}>Tool Call</h3>
          <div className={styles.statusIndicator}>
            <div>
              <p className={`${styles.statusText} ${statusClass}`}>
                {statusText}: {toolDisplayName}
              </p>
              {Object.keys(args).length > 0 && (
                <div className={styles.toolCallArgs}>
                  {Object.entries(args).map(([key, value]) => (
                    <div key={key} className={styles.toolCallArg}>
                      <strong>{key}:</strong>{' '}
                      {typeof value === 'string'
                        ? value
                        : JSON.stringify(value)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const InProgressToolCallDisplay = (props: InProgressComponentProps) => (
  <ToolCallDisplay
    toolCall={props.toolCall}
    status="in-progress"
    onRendered={props.onRendered}
    isOperationValidated={props.isOperationValidated}
  />
);

export const ToolCallsDisplay = ({
  toolCalls,
  toolCallRegistry: _toolCallRegistry,
}: ToolCallsDisplayProps) => {
  if (!toolCalls || toolCalls.length === 0) {
    return null;
  }

  return (
    <div>
      {toolCalls.map((toolCall) => (
        <ToolCallDisplay
          key={toolCall.id}
          toolCall={toolCall}
          status="completed"
        />
      ))}
    </div>
  );
};
