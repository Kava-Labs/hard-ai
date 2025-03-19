import { LandingContent } from './LandingContent';
import { ChatInput } from './ChatInput';
import styles from './App.module.css';
import { useIsMobileLayout } from './theme/useIsMobileLayout';
import { MobileSideBar } from './MobileSideBar';
import { useState } from 'react';
import hardDiamondLogo from './assets/hardDiamondLogo.svg';
import { DesktopSideBar } from './DesktopSideBar';
import { NavBar } from './NavBar';
import { ChatHistory } from './ChatHistory';
import { useChat } from './useChat';
import { ConversationHistories } from './types';
import { ConversationWrapper } from './ConversationWrapper';

export const App = () => {
  const [isMobileSideBarOpen, setIsMobileSideBarOpen] = useState(false);
  const [isDesktopSideBarOpen, setIsDesktopSideBarOpen] = useState(true);

  const {
    activeChat,
    savedConversations,
    handleChatCompletion,
    handleCancel,
    onSelectConversation,
  } = useChat();

  const hasActiveConversation = activeChat.isConversationStarted === true;

  const isMobileLayout = useIsMobileLayout();
  const showMobileSideBar = isMobileLayout && isMobileSideBarOpen;
  const showDesktopSideBar = !isMobileLayout && isDesktopSideBarOpen;
  const sideBarStyles = `${styles.sidebar} ${isMobileSideBarOpen ? styles.isOpen : ''} ${isDesktopSideBarOpen ? '' : styles.isHidden}`;

  return (
    <div className={styles.app}>
      <div className={sideBarStyles}>
        <div className={styles.sidebarHeader}>
          <img src={hardDiamondLogo} alt="Hard Diamond logo" height={40} />
          <div className={styles.buttonGroup}>
            {showMobileSideBar && (
              <MobileSideBar
                onCloseClick={() => setIsMobileSideBarOpen(false)}
              />
            )}
            {showDesktopSideBar && (
              <DesktopSideBar
                onCloseClick={() => setIsDesktopSideBarOpen(false)}
              />
            )}
          </div>
        </div>

        <div className={styles.sidebarContent}>
          <ChatHistory
            chatHistories={savedConversations.reduce((acc, cur) => {
              acc[cur.id] = cur;
              return acc;
            }, {} as ConversationHistories)}
            onSelectConversation={onSelectConversation}
          />
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.chatview}>
          <div className={styles.scrollContainer}>
            <div className={styles.chatHeader}>
              <NavBar
                onMobileMenuClick={() => setIsMobileSideBarOpen(true)}
                onDesktopMenuClick={() => setIsDesktopSideBarOpen(true)}
                isDesktopSideBarOpen={isDesktopSideBarOpen}
              />
            </div>
            <div className={styles.chatContainer}>
              <div
                className={`${styles.chatContent} ${hasActiveConversation ? styles.fullHeight : ''}`}
              >
                {hasActiveConversation && (
                  <ConversationWrapper activeChat={activeChat} />
                )}
              </div>
              <div
                className={`${styles.controlsContainer} ${hasActiveConversation ? styles.positionSticky : ''}`}
              >
                {!hasActiveConversation && <LandingContent />}
                <ChatInput
                  handleChatCompletion={handleChatCompletion}
                  handleCancel={handleCancel}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};