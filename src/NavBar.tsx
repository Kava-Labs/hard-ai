import styles from './NavBar.module.css';
import { Menu, PanelLeftOpen, SquarePen } from 'lucide-react';
import ButtonIcon from './ButtonIcon';
import { useIsMobileLayout } from './theme/useIsMobileLayout';

interface NavBarProps {
  onMenu(): void;
  onPanelOpen(): void;
  isPanelOpen: boolean;
}

export const NavBar = ({ onMenu, onPanelOpen, isPanelOpen }: NavBarProps) => {
  const isMobileLayout = useIsMobileLayout();

  return (
    <div className={styles.nav}>
      <div className={styles.leftSection}>
        {!isMobileLayout ? (
          <div className={styles.desktopControls}>
            {!isPanelOpen && (
              <ButtonIcon
                icon={PanelLeftOpen}
                tooltip={{
                  text: 'Open Menu',
                  position: 'bottom',
                }}
                aria-label="Open Menu"
                onClick={onPanelOpen}
              />
            )}
            <ButtonIcon
              icon={SquarePen}
              tooltip={{
                text: 'New Chat',
                position: 'bottom',
              }}
              aria-label="New Chat"
            />
          </div>
        ) : (
          <div className={styles.menu}>
            <ButtonIcon
              icon={Menu}
              tooltip={{
                text: 'Menu',
                position: 'bottom',
              }}
              aria-label="Toggle Menu"
              onClick={onMenu}
            />
          </div>
        )}
      </div>

      <div className={styles.rightSection}>
        {isMobileLayout && (
          <ButtonIcon
            icon={SquarePen}
            tooltip={{
              text: 'New Chat',
              position: 'bottom',
            }}
            aria-label="New Chat"
          />
        )}
      </div>
    </div>
  );
};
