import {
  memo,
  useState,
  useRef,
  useEffect,
  useCallback,
  useOptimistic,
} from 'react';
import ButtonIcon from './ButtonIcon';
import { EllipsisVertical, Pencil, X, Trash2 } from 'lucide-react';
import styles from './ChatHistoryItem.module.css';
import { ConversationHistory } from './types';

export interface ChatHistoryItemProps {
  conversation: ConversationHistory;
  onHistoryItemClick: () => void;
  deleteConversation: (id: string) => void;
  updateConversationTitle: (id: string, updatedTitle: string) => void;
  isSelected?: boolean;
}

export const ChatHistoryItem = memo(
  ({
    conversation,
    onHistoryItemClick,
    deleteConversation,
    updateConversationTitle,
    isSelected = false,
  }: ChatHistoryItemProps) => {
    const { id, title } = conversation;
    const [editingTitle, setEditingTitle] = useState(false);
    const [editInputValue, setEditInputValue] = useState(title);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [optimisticTitle, setOptimisticTitle] = useOptimistic(
      title,
      (_currentState, newTitle: string) => newTitle,
    );

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleMenuClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (editingTitle) {
        setEditingTitle(false);
      }
      setIsMenuOpen((prev) => !prev);
    };

    const handleSaveTitle = useCallback(
      (currentTitle: string) => {
        const trimmedTitle = currentTitle.trim();
        if (trimmedTitle === '') {
          setEditInputValue(title);
          setEditingTitle(false);
          return;
        }

        if (trimmedTitle !== title) {
          //  Apply UI change first
          setOptimisticTitle(trimmedTitle);
          //  Then fire off request to db
          updateConversationTitle(id, trimmedTitle);
        }

        setEditingTitle(false);
      },
      [title, setOptimisticTitle, updateConversationTitle, id],
    );

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteConversation(id);
      setIsMenuOpen(false);
    };

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (editingTitle) {
        setEditingTitle(false);
      } else {
        setEditingTitle(true);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        handleSaveTitle(editInputValue);
      } else if (e.key === 'Escape') {
        setEditInputValue(title);
        setEditingTitle(false);
      }
    };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;

        if (containerRef.current && !containerRef.current.contains(target)) {
          setIsMenuOpen(false);

          if (editingTitle) {
            handleSaveTitle(editInputValue);
          }
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, [editInputValue, editingTitle, handleSaveTitle]);

    return (
      <div
        ref={containerRef}
        className={`${styles.chatHistoryItem} ${isSelected ? styles.selected : ''}`}
      >
        <div className={styles.chatHistoryContent}>
          <div
            className={styles.titleContainer}
            onClick={editingTitle ? undefined : onHistoryItemClick}
          >
            {editingTitle ? (
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
                autoFocus
              />
            ) : (
              <small>{optimisticTitle}</small>
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
            aria-label={editingTitle ? 'Cancel Rename Title' : 'Rename Title'}
          >
            {editingTitle ? (
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
