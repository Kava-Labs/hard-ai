import styles from './SearchHistoryModal.module.css';
import { ModalWrapper } from './ModalWrapper';
import { useRef, useState } from 'react';
import { SearchHistoryModalBody } from './SearchHistoryModalBody';
import { SearchableChatHistories } from './types';
import { groupAndFilterConversations } from 'lib-kava-ai';

interface SearchHistoryProps {
  searchableHistory: SearchableChatHistories;
  onSelectConversation: (id: string) => void;
  onCloseSearchHistory: () => void;
}

export const SearchHistoryModal = ({
  searchableHistory,
  onSelectConversation,
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
      <ModalWrapper modalRef={modalRef} onClose={handleClose}>
        <SearchHistoryModalBody
          groupedConversations={groupedConversations}
          onSelectConversation={onSelectConversation}
          handleSearchTermChange={handleSearchTermChange}
          onClose={handleClose}
          searchTerm={searchTerm}
        />
      </ModalWrapper>
    </div>
  );
};
