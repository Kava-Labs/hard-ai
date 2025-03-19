import { LandingContent } from './LandingContent';
import { ChatInput } from './ChatInput';
import styles from './App.module.css';
import { useIsMobileLayout } from './theme/useIsMobileLayout';
import { MobileSideBar } from './MobileSideBar';
import { useMemo, useState } from 'react';
import hardDiamondLogo from './assets/hardDiamondLogo.svg';
import { DesktopSideBar } from './DesktopSideBar';
import { NavBar } from './NavBar';
import { ConversationContainer } from './ConversationContainer';
import { ChatHistoryContainer } from './ChatHistoryContainer';
import { ConversationHistory } from './types';
import { mockConversationHistory } from './mocks/conversationHistory';

export const App = () => {
  const [isMobileSideBarOpen, setIsMobileSideBarOpen] = useState(false);
  const [isDesktopSideBarOpen, setIsDesktopSideBarOpen] = useState(true);

  const conversations: ConversationHistory[] = mockConversationHistory;

  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  const hasActiveConversation = activeConversationId !== null;

  const activeConversationMessages = useMemo(() => {
    if (!activeConversationId) return [];

    const activeConversation = conversations.find(
      (c) => c.id === activeConversationId,
    );
    if (!activeConversation) return [];

    return activeConversation.conversation;
  }, [activeConversationId, conversations]);

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
          <ChatHistoryContainer
            conversations={conversations}
            onSelectConversation={(id: string) => setActiveConversationId(id)}
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
                  <ConversationContainer
                    messages={activeConversationMessages}
                  />
                )}
              </div>
              <div
                className={`${styles.controlsContainer} ${hasActiveConversation ? styles.positionSticky : ''}`}
              >
                {!hasActiveConversation && <LandingContent />}
                <ChatInput />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
