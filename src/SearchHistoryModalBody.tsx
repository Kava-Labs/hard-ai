import styles from './SearchHistoryModal.module.css';
import { useRef } from 'react';
import { useIsMobileLayout } from './theme/useIsMobileLayout';
import ButtonIcon from './ButtonIcon';
import { X } from 'lucide-react';
import { GroupedSearchHistories } from './types';
import { formatContentSnippet, formatConversationTitle } from './utils/helpers';

interface SearchModalBodyProps {
  groupedConversations: GroupedSearchHistories;
  onSelectConversation: (id: string) => void;
  handleSearchTermChange: (searchTerm: string) => void;
  inputValue: string;
  onClose: () => void;
}

export const SearchHistoryModalBody = ({
  groupedConversations,
  onSelectConversation,
  handleSearchTermChange,
  inputValue,
  onClose,
}: SearchModalBodyProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const onHistoryItemClick = (id: string) => {
    onSelectConversation(id);
    onClose();
  };

  const isMobileLayout = useIsMobileLayout();
  return (
    <>
      <div className={styles.searchInputWrapper}>
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          placeholder="Search conversations..."
          value={inputValue}
          onChange={(e) => handleSearchTermChange(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
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
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={styles.conversationItem}
                    onClick={() => onHistoryItemClick(conversation.id)}
                  >
                    <p
                      className={styles.conversationTitle}
                      dangerouslySetInnerHTML={{
                        __html: formatConversationTitle(conversation.title, 50),
                      }}
                    />
                    <p
                      className={styles.conversationSnippet}
                      dangerouslySetInnerHTML={{
                        __html: formatContentSnippet(conversation, inputValue),
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
