import { TextSearch, X as CloseX } from 'lucide-react';
import ButtonIcon from './ButtonIcon';

interface MobileSideBarProps {
  isSearchHistoryOpen: boolean;
  onCloseClick: () => void;
  onOpenSearchModal: () => void;
}

export const MobileSideBar = ({
  onCloseClick,
  onOpenSearchModal,
}: MobileSideBarProps) => {
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
        icon={CloseX}
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
