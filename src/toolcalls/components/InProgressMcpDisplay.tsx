import styles from './DisplayCards.module.css';
import { InProgressComponentProps } from '../chain';
import { useScrollToBottom } from '../../useScrollToBottom';

export const InProgressMcpDisplay = ({
  toolCall,
  onRendered,
  isOperationValidated,
}: InProgressComponentProps) => {
  useScrollToBottom(onRendered, isOperationValidated);

  // Handle both string and object arguments, and partial streaming
  let args: Record<string, unknown> = {};
  try {
    if (typeof toolCall.function.arguments === 'string') {
      args = JSON.parse(toolCall.function.arguments || '{}');
    } else if (
      typeof toolCall.function.arguments === 'object' &&
      toolCall.function.arguments !== null
    ) {
      args = toolCall.function.arguments as Record<string, unknown>;
    }
  } catch (error) {
    // If parsing fails (e.g., partial JSON), show what we have
    console.warn('Failed to parse tool call arguments:', error);
    args = {};
  }

  // Get a clean display name for the tool
  const getToolDisplayName = (toolName: string): string => {
    // Handle MCP tools
    if (toolName.startsWith('exa_mcp-')) {
      return toolName.replace('exa_mcp-', '').replace(/_/g, ' ');
    }

    // Handle other patterns
    return toolName.replace(/_/g, ' ');
  };

  const toolDisplayName = getToolDisplayName(
    toolCall.function.name || 'unknown tool',
  );

  return (
    <div
      data-testid="in-progress-mcp-display"
      className={styles.inprogressContainer}
    >
      <div className={styles.transactionCard}>
        <div className={styles.statusSection}>
          <h3 className={styles.sectionLabel}>Tool Call</h3>
          <div className={styles.statusIndicator}>
            <div>
              <p className={`${styles.statusText} ${styles.inProgress}`}>
                In Progress: {toolDisplayName}
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
