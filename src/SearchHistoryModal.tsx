import styles from './SearchHistoryModal.module.css';
import { ModalWrapper } from './ModalWrapper';
import { useRef, useState } from 'react';
import { SearchHistoryModalBody } from './SearchHistoryModalBody';
import { SearchableChatHistories } from './types';
import { groupAndFilterConversations } from './utils/helpers';

interface SearchHistoryProps {
  searchableHistory: SearchableChatHistories;
  onSelectConversation: (id: string) => void;
  isSearchHistoryOpen: boolean;
  onCloseSearchHistory: () => void;
}

export const SearchHistoryModal = ({
  searchableHistory,
  onSelectConversation,
  isSearchHistoryOpen,
  onCloseSearchHistory,
}: SearchHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  const handleSearchTermChange = (text: string) => {
    setSearchTerm(text);
  };

  const handleClose = () => {
    onCloseSearchHistory();
    setSearchTerm('');
  };

  const groupedConversations = groupAndFilterConversations(
    searchableHistory,
    searchTerm,
  );

  return (
    <div className={styles.container}>
      {isSearchHistoryOpen && (
        <ModalWrapper modalRef={modalRef} onClose={handleClose}>
          <SearchHistoryModalBody
            inputValue={searchTerm}
            groupedConversations={groupedConversations}
            onSelectConversation={onSelectConversation}
            handleSearchTermChange={handleSearchTermChange}
            onClose={handleClose}
          />
        </ModalWrapper>
      )}
    </div>
  );
};
