import styles from './App.module.css';
import hardAILogo from './assets/hardAILogo.svg';
import { MobileSideBar } from './MobileSideBar';
import { DesktopSideBar } from './DesktopSideBar';
import { ChatHistory } from './ChatHistory';
import { useIsMobileLayout } from './theme/useIsMobileLayout';
import { ConversationHistories } from './types';

export interface SideBarProps {
  conversationHistories: ConversationHistories;
  onSelectConversation: (id: string) => void;
  activeConversationId: string | null;
  onDeleteConversation: (id: string) => void;
  onUpdateConversationTitle: (id: string, newTitle: string) => void;
  onDesktopCloseClick: () => void;
  onMobileCloseClick: () => void;
  isMobileSideBarOpen: boolean;
  isDesktopSideBarOpen: boolean;
  isSearchHistoryOpen: boolean;
  onClickSearchHistory: () => void;
}

export const SideBar = ({
  conversationHistories,
  onSelectConversation,
  activeConversationId,
  onDeleteConversation,
  onUpdateConversationTitle,
  onMobileCloseClick,
  onDesktopCloseClick,
  isMobileSideBarOpen,
  isDesktopSideBarOpen,
  isSearchHistoryOpen,
  onClickSearchHistory,
}: SideBarProps) => {
  const isMobileLayout = useIsMobileLayout();
  const showMobileSideBar = isMobileLayout && isMobileSideBarOpen;
  const showDesktopSideBar = !isMobileLayout && isDesktopSideBarOpen;
  const sideBarStyles = `${styles.sidebar} ${isMobileSideBarOpen ? styles.isOpen : ''} ${isDesktopSideBarOpen ? '' : styles.isHidden}`;
  return (
    <div className={sideBarStyles}>
      <div className={styles.sidebarHeader}>
        <img src={hardAILogo} alt="Hard AI logo" height={18} />
        <div className={styles.buttonGroup}>
          {showMobileSideBar && (
            <MobileSideBar
              isSearchHistoryOpen={isSearchHistoryOpen}
              onClickSearchHistory={onClickSearchHistory}
              onCloseClick={onMobileCloseClick}
            />
          )}
          {showDesktopSideBar && (
            <DesktopSideBar
              isSearchHistoryOpen={isSearchHistoryOpen}
              onClickSearchHistory={onClickSearchHistory}
              onCloseClick={onDesktopCloseClick}
            />
          )}
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
