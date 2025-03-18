import { memo } from 'react';
import ButtonIcon from './ButtonIcon';
import { EllipsisVertical } from 'lucide-react';
import styles from './ChatHistoryItem.module.css';
import { ConversationHistory } from './types';

interface ChatHistoryItemProps {
  conversation: ConversationHistory;
}

export const ChatHistoryItem = memo(
  ({ conversation }: ChatHistoryItemProps) => {
    const { title } = conversation;

    return (
      <div className={`${styles.chatHistoryItem} ${styles.selected}`}>
        <div className={styles.chatHistoryContent}>
          <div className={styles.titleContainer}>
            <small>{title}</small>
          </div>
          <ButtonIcon
            className={styles.menuIcon}
            icon={EllipsisVertical}
            size={20}
            data-menu-button="true"
            aria-label="Chat Options"
            onClick={() => ({})}
          />
        </div>
      </div>
    );
  },
);
