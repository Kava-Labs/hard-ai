import { memo, useMemo } from 'react';
import { ChatHistoryItem } from './ChatHistoryItem';
import styles from './ChatHistory.module.css';
import { ConversationHistories } from './types';
import { groupConversationsByTime } from './utils/helpers';
import { Bot } from 'lucide-react';

interface ChatHistoryProps {
  chatHistories: ConversationHistories;
  onSelectConversation: (id: string) => void;
  activeConversationId: string | null;
  onDeleteConversation: (id: string) => void;
  onUpdateConversationTitle: (id: string, newTitle: string) => void;
}

export const ChatHistory = memo(
  ({
    chatHistories,
    onSelectConversation,
    activeConversationId,
    onDeleteConversation,
    onUpdateConversationTitle,
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
                      deleteConversation={onDeleteConversation}
                      updateConversationTitle={onUpdateConversationTitle}
                      isSelected={activeConversationId === conversation.id}
                    />
                  ))}
                </div>
              </div>
            ),
          )
        )}
      </div>
    );
  },
);
