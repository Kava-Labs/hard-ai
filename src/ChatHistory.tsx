import styles from './ChatHistory.module.css';
import { Bot } from 'lucide-react';
import { ConversationHistory } from './types';
import { useMemo } from 'react';
import { groupConversationsByTime } from './utils/helpers';
import { ChatHistoryItem } from './ChatHistoryItem';

interface ChatHistoryProps {
  conversations: ConversationHistory[];
}

export const ChatHistory = ({ conversations }: ChatHistoryProps) => {
  const groupedHistories = useMemo(
    () => groupConversationsByTime(conversations),
    [conversations],
  );

  return (
    <div className={styles.chatHistoryContainer}>
      {conversations.length === 0 ? (
        <div className={styles.emptyState}>
          <Bot className={styles.emptyStateIcon} size={24} />
          <small className={styles.emptyStateText}>
            Start a new chat to begin
          </small>
        </div>
      ) : (
        Object.entries(groupedHistories).map(([timeGroup, groupConversations]) => (
          <div key={timeGroup} className={styles.timeGroup}>
            <small className={styles.timeGroupTitle}>{timeGroup}</small>
            <div className={styles.timeGroupContent}>
              {groupConversations.map((conversation) => (
                <ChatHistoryItem
                  key={conversation.id}
                  conversation={conversation}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ChatHistory;
