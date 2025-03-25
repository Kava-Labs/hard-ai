import styles from './SearchHistoryModal.module.css';
import { useRef } from 'react';
import { useIsMobileLayout } from './theme/useIsMobileLayout';
import ButtonIcon from './ButtonIcon';
import { X } from 'lucide-react';
import { SearchableChatHistories } from './types';
import {
  formatContentSnippet,
  formatConversationTitle,
  groupAndFilterConversations,
} from './utils/helpers';

interface SearchModalBodyProps {
  searchableHistory: SearchableChatHistories;
  onSelectConversation: (id: string) => void;
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  onClose: () => void;
}

export const SearchHistoryModalBody = ({
  searchableHistory,
                                         onSelectConversation,
  searchTerm,
  setSearchTerm,
  onClose,
}: SearchModalBodyProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const groupedConversations = groupAndFilterConversations(
    searchableHistory,
    searchTerm,
  );

  const isMobileLayout = useIsMobileLayout();
  return (
    <>
      <div className={styles.searchInputWrapper}>
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {/*Mobile design uses the close icon within ModalWrapper*/}
        {!isMobileLayout && (
          <ButtonIcon
            className={styles.searchCloseIcon}
            icon={X}
            aria-label="Close search modal"
            onClick={onClose}
          />
        )}
      </div>

      <div className={styles.results}>
        {Object.keys(groupedConversations).length === 0 ? (
          <div className={styles.noResults}>No results</div>
        ) : (
          Object.entries(groupedConversations).map(
            ([timeGroup, conversations]) => (
              <div key={timeGroup} className={styles.timeGroup}>
                <small className={styles.timeGroupTitle}>{timeGroup}</small>
                {conversations.map((conversation, index) => (
                  <div
                    data-testid="search-chat-history-entry"
                    key={index}
                    className={styles.conversationItem}
                    onClick={() => onSelectConversation(conversation.)}
                  >
                    <p
                      data-testid="search-history-title"
                      className={styles.conversationTitle}
                      dangerouslySetInnerHTML={{
                        __html: formatConversationTitle(conversation.title, 50),
                      }}
                    />
                    <p
                      data-testid="search-history-content"
                      className={styles.conversationSnippet}
                      dangerouslySetInnerHTML={{
                        __html: formatContentSnippet(conversation, searchTerm),
                      }}
                    />
                  </div>
                ))}
              </div>
            ),
          )
        )}
      </div>
    </>
  );
};
