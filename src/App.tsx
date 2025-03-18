import { LandingContent } from './LandingContent';
import { ChatInput } from './ChatInput';
import styles from './App.module.css';
import { useIsMobileLayout } from './theme/useIsMobileLayout';
import { MobileSideBar } from './MobileSideBar';
import { useRef, useState } from 'react';
import { ChatHistory } from './ChatHistory';
import hardDiamondLogo from './assets/hardDiamondLogo.svg';
import { DesktopSideBar } from './DesktopSideBar';
import { NavBar } from './NavBar';
import { ConversationContainer } from './ConversationContainer';

export const App = () => {
  const [isMobileSideBarOpen, setIsMobileSideBarOpen] = useState(false);
  const [isDesktopSideBarOpen, setIsDesktopSideBarOpen] = useState(true);

  const isMobileLayout = useIsMobileLayout();
  const showMobileSideBar = isMobileLayout && isMobileSideBarOpen;
  const showDesktopSideBar = !isMobileLayout && isDesktopSideBarOpen;
  const sideBarStyles = `${styles.sidebar} ${isMobileSideBarOpen ? styles.isOpen : ''} ${isDesktopSideBarOpen ? '' : styles.isHidden}`;

  const containerRef = useRef<HTMLDivElement>(null);

  const hasMessages = false;
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
          <ChatHistory />
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.chatview} data-testid="chatview">
          <div ref={containerRef} className={styles.scrollContainer}>
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
                data-testid="controls"
              >
                {!hasMessages && <LandingContent />}

                <ChatInput />
              </div>
            </div>
          </div>
        </div>

        {/*<div className={styles.chatview}>*/}
        {/*  <div className={styles.chatHeader}>*/}
        {/*    <NavBar*/}
        {/*      onMobileMenuClick={() => setIsMobileSideBarOpen(true)}*/}
        {/*      onDesktopMenuClick={() => setIsDesktopSideBarOpen(true)}*/}
        {/*      isDesktopSideBarOpen={isDesktopSideBarOpen}*/}
        {/*    />*/}
        {/*  </div>*/}
        {/*  <div className={styles.controlsContainer}>*/}
        {/*    <div className={styles.chatContainer}>*/}
        {/*      <div className={`${styles.chatContent} ${styles.fullHeight}`}>*/}
        {/*        <ConversationContainer />*/}
        {/*        /!*<LandingContent />*!/*/}
        {/*        <ChatInput />*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*</div>*/}
      </div>
    </div>
  );
};
