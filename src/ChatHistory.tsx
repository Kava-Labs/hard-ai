import styles from './ChatHistory.module.css';
import { Bot } from 'lucide-react';

export const ChatHistory = () => {
  return (
    <div className={styles.chatHistoryContainer}>
      <div className={styles.emptyState}>
        <Bot className={styles.emptyStateIcon} size={24} />
        <small className={styles.emptyStateText}>
          Start a new chat to begin
        </small>
      </div>
    </div>
  );
};
