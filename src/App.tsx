import { LandingContent } from './LandingContent';
import { ChatInput } from './ChatInput';
import styles from './App.module.css';
import { useIsMobileLayout } from './theme/useIsMobileLayout';
import { MobileSideBar } from './MobileSideBar';
import { useState } from 'react';
import { ChatHistory } from './ChatHistory';
import hardDiamondLogo from './assets/hardDiamondLogo.svg';
import { DesktopSideBar } from './DesktopSideBar';
import { NavBar } from './NavBar';

export const App = () => {
  const isMobileLayout = useIsMobileLayout();
  const [isMobileSideBarOpen, setIsMobileSideBarOpen] = useState(false);
  const [isDesktopSideBarOpen, setIsDesktopSideBarOpen] = useState(true);

  return (
    <div className={styles.app}>
      <div
        className={`${styles.sidebar} ${isMobileSideBarOpen ? styles.isOpen : ''} ${isDesktopSideBarOpen ? '' : styles.isHidden}`}
      >
        <div className={styles.sidebarHeader}>
          <img src={hardDiamondLogo} alt="Hard Diamond logo" height={40} />
          <div className={styles.buttonGroup}>
            {isMobileLayout && isMobileSideBarOpen && (
              <MobileSideBar
                onCloseClick={() => setIsMobileSideBarOpen(false)}
              />
            )}
            {!isMobileLayout && isDesktopSideBarOpen && (
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
        <div className={styles.chatview}>
          <div className={styles.chatHeader}>
            <NavBar
              onMobileMenuClick={() => setIsMobileSideBarOpen(true)}
              onDesktopMenuClick={() => setIsDesktopSideBarOpen(true)}
              isDesktopSideBarOpen={isDesktopSideBarOpen}
            />
          </div>
          <div className={styles.controlsContainer}>
            <LandingContent />
            <ChatInput />
          </div>
        </div>
      </div>
    </div>
  );
};
