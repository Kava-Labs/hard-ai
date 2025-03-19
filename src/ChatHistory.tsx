import styles from './ChatHistory.module.css';
import { Bot } from 'lucide-react';
import { ConversationHistory } from './types';
import { useMemo } from 'react';
import { groupConversationsByTime } from './utils/helpers';
import { ChatHistoryItem } from './ChatHistoryItem';

interface ChatHistoryProps {
  chatHistories: Record<string, ConversationHistory>;
  onSelectConversation: (id: string) => void;
}

export const ChatHistory = ({
  chatHistories,
  onSelectConversation,
}: ChatHistoryProps) => {
  const groupedHistories = useMemo(
    () => groupConversationsByTime(chatHistories),
    [chatHistories],
  );

  return (
    <div className={styles.chatHistoryContainer}>
      {Object.values(chatHistories).length === 0 ? (
        <div className={styles.emptyState}>
          <Bot className={styles.emptyStateIcon} size={24} />
          <small className={styles.emptyStateText}>
            Start a new chat to begin
          </small>
        </div>
      ) : (
        Object.entries(groupedHistories).map(
          ([timeGroup, groupConversations]) => (
            <div key={timeGroup} className={styles.timeGroup}>
              <small className={styles.timeGroupTitle}>{timeGroup}</small>
              <div className={styles.timeGroupContent}>
                {groupConversations.map((conversation) => (
                  <ChatHistoryItem
                    key={conversation.id}
                    conversation={conversation}
                    onHistoryItemClick={() =>
                      onSelectConversation(conversation.id)
                    }
                  />
                ))}
              </div>
            </div>
          ),
        )
      )}
    </div>
  );
};
