import { memo, useState, useRef, useCallback, useEffect } from 'react';
import ButtonIcon from './ButtonIcon';
import { EllipsisVertical, Pencil, X, Trash2 } from 'lucide-react';
import styles from './ChatHistoryItem.module.css';
import { ConversationHistory } from './types';

export interface ChatHistoryItemProps {
  conversation: ConversationHistory;
  onHistoryItemClick: () => void;
  deleteConversation: (id: string) => void;
  updateConversationTitle: (id: string, newTitle: string) => void;
  isMenuOpen: boolean;
  handleMenuOpen: (isMenuOpen: boolean) => void;
  isEditingTitle: boolean;
  toggleEditingTitle: (isEditing: boolean) => void;
  isSelected?: boolean;
}

export const ChatHistoryItem = memo(
  ({
    conversation,
    onHistoryItemClick,
    deleteConversation,
    updateConversationTitle,
    isMenuOpen,
    handleMenuOpen,
    isEditingTitle,
    toggleEditingTitle,
    isSelected = false,
  }: ChatHistoryItemProps) => {
    const { id, title } = conversation;
    const [editInputValue, setEditInputValue] = useState(title);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleMenuClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isEditingTitle) {
        toggleEditingTitle(false);
        setEditInputValue(title);
      }
      handleMenuOpen(!isMenuOpen);
    };

    const handleSaveTitle = useCallback(() => {
      const trimmedTitle = editInputValue.trim();
      if (trimmedTitle === '') {
        setEditInputValue(title);
        toggleEditingTitle(false);
        return;
      }

      if (trimmedTitle !== title) {
        updateConversationTitle(id, trimmedTitle);
      }

      toggleEditingTitle(false);
    }, [
      editInputValue,
      title,
      toggleEditingTitle,
      updateConversationTitle,
      id,
    ]);

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteConversation(id);
      handleMenuOpen(false);
    };

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditInputValue(title);
      toggleEditingTitle(!isEditingTitle);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        handleSaveTitle();
      } else if (e.key === 'Escape') {
        setEditInputValue(title);
        toggleEditingTitle(false);
      }
    };

    useEffect(() => {
      if (isEditingTitle && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isEditingTitle]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;

        if (containerRef.current && !containerRef.current.contains(target)) {
          handleMenuOpen(false);
          if (isEditingTitle) {
            handleSaveTitle();
          }
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, [handleMenuOpen, handleSaveTitle, isEditingTitle]);

    return (
      <div
        ref={containerRef}
        className={`${styles.chatHistoryItem} ${isSelected ? styles.selected : ''}`}
      >
        <div className={styles.chatHistoryContent}>
          <div
            className={styles.titleContainer}
            onClick={isEditingTitle ? undefined : onHistoryItemClick}
          >
            {isEditingTitle ? (
              <input
                ref={inputRef}
                type="text"
                value={editInputValue}
                aria-label="Edit Title Input"
                onChange={(e) => setEditInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className={styles.chatHistoryTitleInput}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              />
            ) : (
              <small>{title}</small>
            )}
          </div>
          <ButtonIcon
            className={styles.menuIcon}
            icon={EllipsisVertical}
            size={20}
            data-menu-button="true"
            aria-label="Chat Options"
            onClick={handleMenuClick}
          />
        </div>
        <div
          className={`${styles.buttonContainer} ${isMenuOpen ? styles.show : ''}`}
        >
          <button
            className={styles.menuButton}
            onClick={handleEdit}
            aria-label={isEditingTitle ? 'Cancel Rename Title' : 'Rename Title'}
          >
            {isEditingTitle ? (
              <>
                <X size={16} />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Pencil size={16} />
                <span>Rename</span>
              </>
            )}
          </button>
          <button
            className={`${styles.menuButton} ${styles.deleteButton}`}
            data-delete="true"
            onClick={handleDelete}
            aria-label="Delete Chat"
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    );
  },
);
