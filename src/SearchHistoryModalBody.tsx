import styles from './SearchHistoryModal.module.css';
import { useRef } from 'react';
import { useIsMobileLayout } from './theme/useIsMobileLayout';
import ButtonIcon from './ButtonIcon';
import { X } from 'lucide-react';
import { GroupedSearchHistories } from './types';
import { formatContentSnippet, formatConversationTitle } from './utils/helpers';
import { highlightMatch } from 'lib-kava-ai';

interface SearchModalBodyProps {
  groupedConversations: GroupedSearchHistories;
  onSelectConversation: (id: string) => void;
  handleSearchTermChange: (searchTerm: string) => void;
  onClose: () => void;
  searchTerm: string;
}

export const SearchHistoryModalBody = ({
  groupedConversations,
  onSelectConversation,
  handleSearchTermChange,
  onClose,
  searchTerm,
}: SearchModalBodyProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key === 'Enter') {
      //  if there's only one remaining search match, allow it to be selected with the enter key
      const allConversations = Object.values(groupedConversations).flat();
      if (allConversations.length === 1) {
        onSelectConversation(allConversations[0].id);
        onClose();
      }
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
          value={searchTerm}
          onChange={(e) => handleSearchTermChange(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        {/*Mobile design uses the close icon within ModalWrapper*/}
        <ButtonIcon
          className={isMobileLayout ? styles.hidden : styles.searchCloseIcon}
          icon={X}
          aria-label="Close search modal"
          onClick={onClose}
        />
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
                        __html: highlightMatch(
                          formatConversationTitle(conversation.title, 50),
                          searchTerm,
                        ),
                      }}
                    />
                    <p
                      className={styles.conversationSnippet}
                      dangerouslySetInnerHTML={{
                        __html: highlightMatch(
                          formatContentSnippet(conversation, searchTerm),
                          searchTerm,
                        ),
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
