import ButtonIcon from './ButtonIcon';
import { PanelLeftClose, TextSearch } from 'lucide-react';

interface MobileSideBarProps {
  onCloseClick: () => void;
}

export const DesktopSideBar = ({ onCloseClick }: MobileSideBarProps) => {
  return (
    <>
      <ButtonIcon
        disabled={false}
        onClick={() => ({})}
        icon={TextSearch}
        tooltip={{
          text: 'Search History',
          position: 'bottom',
        }}
        aria-label="Search History"
      />
      <ButtonIcon
        icon={PanelLeftClose}
        tooltip={{
          text: 'Close Menu',
          position: 'bottom',
        }}
        aria-label="Close Menu"
        onClick={onCloseClick}
      />
    </>
  );
};
