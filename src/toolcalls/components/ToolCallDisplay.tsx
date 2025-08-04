import React, { useState } from 'react';
import { ChatCompletionMessageToolCall } from 'openai/resources/index';
import { ToolCallRegistry } from '../chain';
import { InProgressComponentProps } from '../chain';
import { ToolCallStream } from '../../stores/toolCallStreamStore';
import { useScrollToBottom } from '../../useScrollToBottom';
import styles from './DisplayCards.module.css';
import { WebSearchAnnotation } from './WebSearchAnnotation';
import { ToolResultStore, ToolResult } from '../../stores/toolResultStore';

interface ToolCallDisplayProps {
  toolCall: ChatCompletionMessageToolCall | ToolCallStream;
  status: 'completed' | 'in-progress';
  onRendered?: () => void;
  isOperationValidated?: boolean;
  toolResultStore?: ToolResultStore;
}

interface ToolCallsDisplayProps {
  toolCalls: ChatCompletionMessageToolCall[];
  toolCallRegistry: ToolCallRegistry<unknown>;
  toolResultStore?: ToolResultStore;
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

const isWebSearchTool = (toolName: string): boolean => {
  return toolName === 'exa_mcp-web_search_exa';
};

const formatResponseContent = (
  content: string,
): { type: 'json' | 'text'; formatted: string } => {
  try {
    const parsed = JSON.parse(content);
    return {
      type: 'json',
      formatted: JSON.stringify(parsed, null, 2),
    };
  } catch {
    return {
      type: 'text',
      formatted: content,
    };
  }
};

const ToolResponseSection = ({
  toolResult,
}: {
  toolResult: ToolResult | undefined;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!toolResult) return null;

  const hasResponse = toolResult.result && toolResult.result.trim();
  const hasError = toolResult.isError && toolResult.error;

  if (!hasResponse && !hasError) return null;

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  return (
    <div className={styles.toolResponse}>
      <div className={styles.toolResponseHeader}>
        <button
          className={styles.collapseButton}
          onClick={toggleExpanded}
          type="button"
        >
          <svg
            className={styles.chevronIcon}
            style={{
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          View Response
        </button>
      </div>
      {isExpanded && (
        <div className={styles.toolResponseContent}>
          {hasError ? (
            <div>
              <div className={styles.sectionLabel}>Error</div>
              <div className={styles.toolResponseJson}>{toolResult.error}</div>
              {toolResult.stackTrace && (
                <div style={{ marginTop: 'var(--spacing-md)' }}>
                  <div className={styles.sectionLabel}>Stack Trace</div>
                  <div className={styles.toolResponseJson}>
                    {toolResult.stackTrace}
                  </div>
                </div>
              )}
            </div>
          ) : hasResponse ? (
            (() => {
              const { type, formatted } = formatResponseContent(
                toolResult.result,
              );
              return (
                <div
                  className={
                    type === 'json'
                      ? styles.toolResponseJson
                      : styles.toolResponseText
                  }
                >
                  {formatted}
                </div>
              );
            })()
          ) : (
            <div className={styles.toolResponseEmpty}>No response data</div>
          )}
        </div>
      )}
    </div>
  );
};

export const ToolCallDisplay = ({
  toolCall,
  status,
  onRendered,
  isOperationValidated,
  toolResultStore,
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
  const toolName = toolCall.function.name || '';

  // Get tool result for error checking and web search annotations
  const toolResult = toolResultStore?.getResult(toolCall.id);
  const hasError = toolResult?.isError;

  let statusText: string;
  let statusClass: string;

  if (status === 'in-progress') {
    statusText = 'In Progress';
    statusClass = styles.inProgress;
  } else if (hasError) {
    statusText = `Error: ${toolDisplayName} - ${toolResult?.error || 'Unknown error'}`;
    statusClass = styles.error;
  } else {
    statusText = `Completed: ${toolDisplayName}`;
    statusClass = styles.complete;
  }
  const testId =
    status === 'in-progress'
      ? 'in-progress-tool-display'
      : 'completed-tool-display';
  const showWebSearchAnnotation =
    status === 'completed' && isWebSearchTool(toolName) && toolResult?.result;

  return (
    <div data-testid={testId} className={styles.inprogressContainer}>
      <div className={styles.transactionCard}>
        <div className={styles.statusSection}>
          <h3 className={styles.sectionLabel}>Tool Call</h3>
          <div className={styles.statusIndicator}>
            <div>
              <p className={`${styles.statusText} ${statusClass}`}>
                {statusText}
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
              {showWebSearchAnnotation && (
                <div className={styles.searchResults}>
                  <WebSearchAnnotation toolResult={toolResult.result} />
                </div>
              )}
            </div>
          </div>
          {status === 'completed' && !isWebSearchTool(toolName) && (
            <ToolResponseSection toolResult={toolResult} />
          )}
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
  toolResultStore,
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
          toolResultStore={toolResultStore}
        />
      ))}
    </div>
  );
};
