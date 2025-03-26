import styles from './App.module.css';
import hardAILogo from './assets/hardAILogo.svg';
import { ChatHistory } from './ChatHistory';
import { ConversationHistories } from './types';
import { SideBarControls } from './SideBarControls';

export interface SideBarProps {
  conversationHistories: ConversationHistories;
  onSelectConversation: (id: string) => void;
  activeConversationId: string | null;
  onDeleteConversation: (id: string) => void;
  onUpdateConversationTitle: (id: string, newTitle: string) => void;
  onOpenSearchModal: () => void;
  onCloseClick: () => void;
  isMobileSideBarOpen: boolean;
  isDesktopSideBarOpen: boolean;
  isSearchHistoryOpen: boolean;
}

export const SideBar = ({
  conversationHistories,
  onSelectConversation,
  activeConversationId,
  onDeleteConversation,
  onUpdateConversationTitle,
  onOpenSearchModal,
  onCloseClick,
  isMobileSideBarOpen,
  isDesktopSideBarOpen,
}: SideBarProps) => {
  const sideBarStyles = `${styles.sidebar} ${isMobileSideBarOpen ? styles.isOpen : ''} ${isDesktopSideBarOpen ? '' : styles.isHidden}`;

  return (
    <div className={sideBarStyles}>
      <div className={styles.sidebarHeader}>
        <img src={hardAILogo} alt="Hard AI logo" height={18} />
        <div className={styles.buttonGroup}>
          <SideBarControls
            onCloseClick={onCloseClick}
            onOpenSearchModal={onOpenSearchModal}
          />
        </div>
      </div>

      <div className={styles.sidebarContent}>
        <ChatHistory
          chatHistories={conversationHistories}
          onSelectConversation={onSelectConversation}
          activeConversationId={activeConversationId}
          onDeleteConversation={onDeleteConversation}
          onUpdateConversationTitle={onUpdateConversationTitle}
        />
      </div>
    </div>
  );
};
