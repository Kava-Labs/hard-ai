import ButtonIcon from './ButtonIcon';
import { PanelLeftClose, TextSearch } from 'lucide-react';

interface DesktopSideBarProps {
  isSearchHistoryOpen: boolean;
  onCloseClick: () => void;
  onOpenSearchModal: () => void;
}

export const DesktopSideBar = ({
  onCloseClick,
  onOpenSearchModal,
}: DesktopSideBarProps) => {
  return (
    <>
      <ButtonIcon
        disabled={false}
        onClick={onOpenSearchModal}
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
