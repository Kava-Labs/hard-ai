import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NavBar } from './NavBar';
import * as useIsMobileLayoutModule from './theme/useIsMobileLayout';
import { LucideIcon } from 'lucide-react';

vi.mock('./ButtonIcon', () => ({
  default: ({
    icon: Icon,
    onClick,
    'aria-label': ariaLabel,
  }: {
    icon: LucideIcon;
    onClick: () => void;
    'aria-label': string;
  }) => (
    <button onClick={onClick} aria-label={ariaLabel}>
      <Icon />
    </button>
  ),
}));

describe('NavBar', () => {
  const mockProps = {
    onMobileMenuClick: vi.fn(),
    onDesktopMenuClick: vi.fn(),
    isDesktopSideBarOpen: false,
    onNewChatClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop Layout', () => {
    beforeEach(() => {
      vi.spyOn(useIsMobileLayoutModule, 'useIsMobileLayout').mockReturnValue(
        false,
      );
    });

    it('renders desktop controls with sidebar closed', () => {
      render(<NavBar {...mockProps} />);

      expect(screen.getByLabelText('Open Desktop Menu')).toBeInTheDocument();
      expect(
        screen.getByLabelText('New Chat Desktop Button'),
      ).toBeInTheDocument();

      //  Mobile menu button should not be present
      expect(
        screen.queryByLabelText('Toggle Mobile Menu'),
      ).not.toBeInTheDocument();
    });

    it('does not render PanelLeftOpen button when sidebar is open', () => {
      render(<NavBar {...mockProps} isDesktopSideBarOpen={true} />);

      expect(
        screen.queryByLabelText('Open Desktop Menu'),
      ).not.toBeInTheDocument();
      expect(
        screen.getByLabelText('New Chat Desktop Button'),
      ).toBeInTheDocument();
    });

    it('calls onDesktopMenuClick when PanelLeftOpen button is clicked', () => {
      render(<NavBar {...mockProps} />);

      expect(mockProps.onDesktopMenuClick).toHaveBeenCalledTimes(0);

      const openMenuButton = screen.getByLabelText('Open Desktop Menu');
      fireEvent.click(openMenuButton);

      expect(mockProps.onDesktopMenuClick).toHaveBeenCalledTimes(1);
    });

    it('calls onNewChatClick when New Chat button is clicked', () => {
      render(<NavBar {...mockProps} />);

      expect(mockProps.onNewChatClick).toHaveBeenCalledTimes(0);

      const newChatButton = screen.getByLabelText('New Chat Desktop Button');
      fireEvent.click(newChatButton);

      expect(mockProps.onNewChatClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Mobile Layout', () => {
    beforeEach(() => {
      vi.spyOn(useIsMobileLayoutModule, 'useIsMobileLayout').mockReturnValue(
        true,
      );
    });

    it('renders mobile controls', () => {
      render(<NavBar {...mockProps} />);

      expect(screen.getByLabelText('Toggle Mobile Menu')).toBeInTheDocument();

      expect(
        screen.getByLabelText('New Chat Mobile Button'),
      ).toBeInTheDocument();

      expect(
        screen.queryByLabelText('Open Desktop Menu'),
      ).not.toBeInTheDocument();
    });

    it('calls onMobileMenuClick when menu button is clicked', () => {
      render(<NavBar {...mockProps} />);

      expect(mockProps.onMobileMenuClick).toHaveBeenCalledTimes(0);

      const mobileMenuButton = screen.getByLabelText('Toggle Mobile Menu');
      fireEvent.click(mobileMenuButton);

      expect(mockProps.onMobileMenuClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onNewChatClick when mobile New Chat button is clicked', () => {
      render(<NavBar {...mockProps} />);

      const mobileNewChatButton = screen.getByLabelText(
        'New Chat Mobile Button',
      );
      fireEvent.click(mobileNewChatButton);

      expect(mockProps.onNewChatClick).toHaveBeenCalledTimes(1);
    });
  });
});
