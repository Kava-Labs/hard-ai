import { TextSearch, X as CloseX } from 'lucide-react';
import ButtonIcon from './ButtonIcon';

interface MobileSideBarProps {
  setIsMobileSideBarOpen: (i: boolean) => void;
}

export const MobileSideBar = ({
  setIsMobileSideBarOpen,
}: MobileSideBarProps) => {
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
        icon={CloseX}
        tooltip={{
          text: 'Close Menu',
          position: 'bottom',
        }}
        aria-label="Close Menu"
        onClick={() => setIsMobileSideBarOpen(false)}
      />
    </>
  );
};
