import styles from './SearchHistoryModal.module.css';
import { ModalWrapper } from './ModalWrapper';
import { useEffect, useRef, useState } from 'react';
import { SearchHistoryModalBody } from './SearchHistoryModalBody';
import { SearchableChatHistories } from './types';

interface SearchHistoryProps {
  searchableHistory: SearchableChatHistories;
  isSearchHistoryOpen: boolean;
  setIsSearchHistoryOpen: (i: boolean) => void;
  setIsMobileSideBarOpen: (i: boolean) => void;
}

export const SearchHistoryModal = ({
  searchableHistory,
  isSearchHistoryOpen,
  setIsSearchHistoryOpen,
  setIsMobileSideBarOpen,
}: SearchHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  //  todo - do we need this?
  useEffect(() => {
    if (isSearchHistoryOpen) {
      // Focus input when modal opens
      inputRef.current?.focus();
      //  mobile sidebar is closed by default and that contains the component that mounts the search modal,
      //  but if a user has opened chat history search from a larger screen, then we should update that so search modal
      //  stays open on screen resize
      setIsMobileSideBarOpen(true);
    }
  }, [isSearchHistoryOpen, setIsMobileSideBarOpen]);

  const handleClose = () => {
    setIsSearchHistoryOpen(false);
    setSearchTerm('');
  };
  return (
    <div className={styles.container}>
      {isSearchHistoryOpen && (
        <ModalWrapper modalRef={modalRef} onClose={handleClose}>
          <SearchHistoryModalBody
            searchableHistory={searchableHistory}
            onConversationSelect={() => ({})}
            setIsOpen={setIsSearchHistoryOpen}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onClose={handleClose}
          />
        </ModalWrapper>
      )}
    </div>
  );
};
