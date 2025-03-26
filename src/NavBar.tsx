import styles from './NavBar.module.css';
import { Menu, PanelLeftOpen, SquarePen } from 'lucide-react';
import ButtonIcon from './ButtonIcon';
import { useIsMobileLayout } from './theme/useIsMobileLayout';

export interface NavBarProps {
  onMenuClick: () => void;
  isSideBarOpen: boolean;
  onNewChatClick: () => void;
}

export const NavBar = ({
  onMenuClick,
  isSideBarOpen,
  onNewChatClick,
}: NavBarProps) => {
  const isMobileLayout = useIsMobileLayout();

  const newChatButton = (
    <ButtonIcon
      icon={SquarePen}
      tooltip={{
        text: 'New Chat',
        position: 'bottom',
      }}
      aria-label="New Chat Button"
      onClick={onNewChatClick}
    />
  );

  return (
    <div className={styles.nav}>
      <div className={styles.leftSection}>
        {!isMobileLayout ? (
          <div className={styles.desktopControls}>
            {!isSideBarOpen && (
              <ButtonIcon
                icon={PanelLeftOpen}
                tooltip={{
                  text: 'Open Menu',
                  position: 'bottom',
                }}
                aria-label="Open Desktop Menu"
                onClick={onMenuClick}
              />
            )}
            {newChatButton}
          </div>
        ) : (
          <div className={styles.menu}>
            <ButtonIcon
              icon={Menu}
              tooltip={{
                text: 'Menu',
                position: 'bottom',
              }}
              aria-label="Open Mobile Menu"
              onClick={onMenuClick}
            />
          </div>
        )}
      </div>

      <div className={styles.rightSection}>
        {isMobileLayout && newChatButton}
      </div>
    </div>
  );
};
