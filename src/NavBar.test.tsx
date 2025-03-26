import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NavBar, NavBarProps } from './NavBar';
import * as useIsMobileLayoutModule from './theme/useIsMobileLayout';

describe('NavBar', () => {
  const mockProps: NavBarProps = {
    onMenuClick: vi.fn(),
    isSideBarOpen: false,
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
      expect(screen.getByLabelText('New Chat Button')).toBeInTheDocument();
      expect(
        screen.queryByLabelText('Open Mobile Menu'),
      ).not.toBeInTheDocument();
    });

    it('does not render PanelLeftOpen button when sidebar is open', () => {
      render(<NavBar {...mockProps} isSideBarOpen={true} />);

      expect(
        screen.queryByLabelText('Open Desktop Menu'),
      ).not.toBeInTheDocument();
      expect(screen.getByLabelText('New Chat Button')).toBeInTheDocument();
    });

    it('calls onMenuClick when PanelLeftOpen button is clicked', () => {
      render(<NavBar {...mockProps} />);

      expect(mockProps.onMenuClick).toHaveBeenCalledTimes(0);

      const openMenuButton = screen.getByLabelText('Open Desktop Menu');
      fireEvent.click(openMenuButton);

      expect(mockProps.onMenuClick).toHaveBeenCalledTimes(1);
    });

    it('calls onNewChatClick when New Chat button is clicked', () => {
      render(<NavBar {...mockProps} />);

      expect(mockProps.onNewChatClick).toHaveBeenCalledTimes(0);

      const newChatButton = screen.getByLabelText('New Chat Button');
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

      expect(screen.getByLabelText('Open Mobile Menu')).toBeInTheDocument();
      expect(screen.getByLabelText('New Chat Button')).toBeInTheDocument();
      expect(
        screen.queryByLabelText('Open Desktop Menu'),
      ).not.toBeInTheDocument();
    });

    it('calls onMenuClick when menu button is clicked', () => {
      render(<NavBar {...mockProps} />);

      expect(mockProps.onMenuClick).toHaveBeenCalledTimes(0);

      const mobileMenuButton = screen.getByLabelText('Open Mobile Menu');
      fireEvent.click(mobileMenuButton);

      expect(mockProps.onMenuClick).toHaveBeenCalledTimes(1);
    });
  });
});
