import ButtonIcon from './ButtonIcon';
import { PanelLeftClose, TextSearch } from 'lucide-react';

export interface DesktopSideBarProps {
  onCloseClick: () => void;
}

export const DesktopSideBar = ({ onCloseClick }: DesktopSideBarProps) => {
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
