import styles from './SideBar.module.css';
import hardDiamondLogo from './assets/hardDiamondLogo.svg';
import { MobileSideBar } from './MobileSideBar';
import { DesktopSideBar } from './DesktopSideBar';
import { ChatHistory } from './ChatHistory';
import { useIsMobileLayout } from './theme/useIsMobileLayout';
import { ConversationHistories } from './types';

interface SideBarContainerProps {
  conversationHistories: ConversationHistories;
  onSelectConversation: (id: string) => void;
  activeConversationId: string | null;
  onDeleteConversation: (id: string) => void;
  onUpdateConversationTitle: (id: string, newTitle: string) => void;
  onDesktopCloseClick: () => void;
  onMobileCloseClick: () => void;
  isMobileSideBarOpen: boolean;
  isDesktopSideBarOpen: boolean;
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
}: SideBarContainerProps) => {
  const isMobileLayout = useIsMobileLayout();
  const showMobileSideBar = isMobileLayout && isMobileSideBarOpen;
  const showDesktopSideBar = !isMobileLayout && isDesktopSideBarOpen;
  const sideBarStyles = `${styles.sidebar} ${isMobileSideBarOpen ? styles.isOpen : ''} ${isDesktopSideBarOpen ? '' : styles.isHidden}`;
  return (
    <div className={sideBarStyles}>
      <div className={styles.sidebarHeader}>
        <img src={hardDiamondLogo} alt="Hard Diamond logo" height={40} />
        <div className={styles.buttonGroup}>
          {showMobileSideBar && (
            <MobileSideBar onCloseClick={onMobileCloseClick} />
          )}
          {showDesktopSideBar && (
            <DesktopSideBar onCloseClick={onDesktopCloseClick} />
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
