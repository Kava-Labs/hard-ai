import styles from './App.module.css';
import hardAILogo from './assets/hardAILogo.svg';
import { ChatHistory } from './ChatHistory';
import { ConversationHistories } from './types';
import { SideBarControls } from './SideBarControls';
import { useIsMobileLayout } from './theme/useIsMobileLayout';

export interface SideBarProps {
  activeConversationId: string | null;
  conversationHistories: ConversationHistories;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onUpdateConversationTitle: (id: string, newTitle: string) => void;
  onOpenSearchModal: () => void;
  onCloseClick: () => void;
  isSideBarOpen: boolean;
}

export const SideBar = ({
  activeConversationId,
  conversationHistories,
  onSelectConversation,
  onDeleteConversation,
  onUpdateConversationTitle,
  onOpenSearchModal,
  onCloseClick,
  isSideBarOpen,
}: SideBarProps) => {
  const isMobileLayout = useIsMobileLayout();
  const isMobileSideBarOpen = isSideBarOpen && isMobileLayout;
  const isDesktopSideBarOpen = isSideBarOpen && !isMobileLayout;
  const sideBarStyles = `${styles.sidebar} ${isMobileSideBarOpen ? styles.isOpen : ''} ${isDesktopSideBarOpen ? '' : styles.isHidden}`;

  const hasNoConversationHistory =
    Object.keys(conversationHistories).length === 0;

  return (
    <div className={sideBarStyles}>
      <div className={styles.sidebarHeader}>
        <img src={hardAILogo} alt="Hard AI logo" height={18} />
        <div className={styles.buttonGroup}>
          <SideBarControls
            isDisabled={hasNoConversationHistory}
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
