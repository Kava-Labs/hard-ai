import { LandingContent } from './components/LandingContent';
import { ChatInput } from './components/ChatInput';
import styles from './App.module.css';
import { useIsMobileLayout } from './theme/useIsMobileLayout';
import { MobileSideBar } from './components/MobileSideBar';
import { useState } from 'react';
import hardDiamondLogo from './assets/hardDiamondLogo.svg';
import { DesktopSideBar } from './components/DesktopSideBar';
import { NavBar } from './components/NavBar';
import { ConversationContainer } from './components/ConversationContainer';
import { ChatHistoryContainer } from './components/ChatHistoryContainer';

export const App = () => {
  const [isMobileSideBarOpen, setIsMobileSideBarOpen] = useState(false);
  const [isDesktopSideBarOpen, setIsDesktopSideBarOpen] = useState(true);

  const isMobileLayout = useIsMobileLayout();
  const showMobileSideBar = isMobileLayout && isMobileSideBarOpen;
  const showDesktopSideBar = !isMobileLayout && isDesktopSideBarOpen;
  const sideBarStyles = `${styles.sidebar} ${isMobileSideBarOpen ? styles.isOpen : ''} ${isDesktopSideBarOpen ? '' : styles.isHidden}`;

  const [hasMessages, setHasMessages] = useState<boolean>(false);

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
          <ChatHistoryContainer />
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
                className={`${styles.chatContent} ${hasMessages ? styles.fullHeight : ''}`}
              >
                {hasMessages && <ConversationContainer />}
              </div>
              <div
                className={`${styles.controlsContainer} ${hasMessages ? styles.positionSticky : ''}`}
              >
                {!hasMessages && <LandingContent />}
                <ChatInput setHasMessages={setHasMessages} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
