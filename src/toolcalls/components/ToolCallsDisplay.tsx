import React from 'react';
import { ChatCompletionMessageToolCall } from 'openai/resources/index';
import { ToolCallRegistry } from '../chain';
import styles from './DisplayCards.module.css';

interface ToolCallsDisplayProps {
  toolCalls: ChatCompletionMessageToolCall[];
  toolCallRegistry: ToolCallRegistry<unknown>;
}

interface ToolCallDisplayProps {
  toolCall: ChatCompletionMessageToolCall;
}

const ToolCallDisplay = ({ toolCall }: ToolCallDisplayProps) => {
  const args = JSON.parse(toolCall.function.arguments || '{}');

  // Get a clean display name for the tool
  const getToolDisplayName = (toolName: string): string => {
    // Handle MCP tools
    if (toolName.startsWith('exa_mcp-')) {
      return toolName.replace('exa_mcp-', '').replace(/_/g, ' ');
    }

    // Handle other patterns
    return toolName.replace(/_/g, ' ');
  };

  const toolDisplayName = getToolDisplayName(toolCall.function.name);

  return (
    <div className={styles.inprogressContainer}>
      <div className={styles.transactionCard}>
        <div className={styles.statusSection}>
          <h3 className={styles.sectionLabel}>Tool Call</h3>
          <div className={styles.statusIndicator}>
            <div>
              <p className={`${styles.statusText} ${styles.complete}`}>
                Completed: {toolDisplayName}
              </p>
              {Object.keys(args).length > 0 && (
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '14px',
                    color: 'var(--colors-textMuted)',
                  }}
                >
                  {Object.entries(args).map(([key, value]) => (
                    <div key={key} style={{ marginBottom: '4px' }}>
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

export const ToolCallsDisplay = ({
  toolCalls,
  toolCallRegistry,
}: ToolCallsDisplayProps) => {
  if (!toolCalls || toolCalls.length === 0) {
    return null;
  }

  return (
    <div>
      {toolCalls.map((toolCall) => (
        <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
      ))}
    </div>
  );
};
