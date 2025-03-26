import ButtonIcon from './ButtonIcon';
import { PanelLeftClose, TextSearch, X as CloseX } from 'lucide-react';
import { useIsMobileLayout } from './theme/useIsMobileLayout';

interface SideBarControlsProps {
  onCloseClick: () => void;
  onOpenSearchModal: () => void;
}

export const SideBarControls = ({
  onCloseClick,
  onOpenSearchModal,
}: SideBarControlsProps) => {
  const isMobileLayout = useIsMobileLayout();
  const CloseIcon = isMobileLayout ? CloseX : PanelLeftClose;

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
        icon={CloseIcon}
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
