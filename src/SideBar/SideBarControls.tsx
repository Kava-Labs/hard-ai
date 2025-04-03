import { ButtonIcon } from 'lib-kava-ai';
import { PanelLeftClose, TextSearch, X as CloseX } from 'lucide-react';
import { useIsMobileLayout } from 'lib-kava-ai';

interface SideBarControlsProps {
  isDisabled: boolean;
  onCloseClick: () => void;
  onOpenSearchModal: () => void;
}

export const SideBarControls = ({
  isDisabled,
  onCloseClick,
  onOpenSearchModal,
}: SideBarControlsProps) => {
  const isMobileLayout = useIsMobileLayout();
  const CloseIcon = isMobileLayout ? CloseX : PanelLeftClose;

  const closeIconLabel = isMobileLayout
    ? 'Close Mobile Menu'
    : 'Close Desktop Menu';

  return (
    <>
      <ButtonIcon
        disabled={isDisabled}
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
        aria-label={closeIconLabel}
        onClick={onCloseClick}
      />
    </>
  );
};
