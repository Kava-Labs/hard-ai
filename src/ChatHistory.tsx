import { memo } from 'react';
import { ChatHistoryItem } from './ChatHistoryItem';
import styles from './ChatHistory.module.css';
import { ConversationHistories } from './types';

interface ChatHistoryProps {
  chatHistories: ConversationHistories;
  onSelectConversation: (id: string) => void;
  activeConversationId?: string | null;
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
    const sortedHistories = Object.values(chatHistories).sort(
      (a, b) => b.lastSaved - a.lastSaved,
    );

    return (
      <div className={styles.chatHistory}>
        {sortedHistories.map((conversation) => (
          <ChatHistoryItem
            key={conversation.id}
            conversation={conversation}
            onHistoryItemClick={() => onSelectConversation(conversation.id)}
            deleteConversation={onDeleteConversation}
            updateConversationTitle={onUpdateConversationTitle}
            isSelected={activeConversationId === conversation.id}
          />
        ))}
      </div>
    );
  },
);
