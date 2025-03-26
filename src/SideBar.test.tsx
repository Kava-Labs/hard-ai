import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { SideBar, SideBarProps } from './SideBar';
import { useIsMobileLayout } from './theme/useIsMobileLayout';

vi.mock('./api/getSearchableHistory', () => ({
  getSearchableHistory: vi.fn(),
}));

vi.mock('./MobileSideBar', () => ({
  MobileSideBar: ({
    onCloseClick,
    onOpenSearchModal,
  }: {
    onCloseClick: () => void;
    onOpenSearchModal: () => void;
  }) => (
    <div>
      <button data-testid="mobile-sidebar-close" onClick={onCloseClick}>
        Mobile Close
      </button>
      <button data-testid="search-history-button" onClick={onOpenSearchModal}>
        Search History
      </button>
    </div>
  ),
}));

vi.mock('./DesktopSideBar', () => ({
  DesktopSideBar: ({
    onCloseClick,
    onOpenSearchModal,
  }: {
    onCloseClick: () => void;
    onOpenSearchModal: () => void;
  }) => (
    <div>
      <button data-testid="desktop-sidebar-close" onClick={onCloseClick}>
        Desktop Close
      </button>
      <button data-testid="search-history-button" onClick={onOpenSearchModal}>
        Search History
      </button>
    </div>
  ),
}));

vi.mock('./ChatHistory', () => ({
  ChatHistory: () => <div data-testid="chat-history">Chat History</div>,
}));
vi.mock('./theme/useIsMobileLayout');

describe('SideBar', () => {
  const mockProps: SideBarProps = {
    conversationHistories: {},
    onSelectConversation: vi.fn(),
    activeConversationId: 'test-id',
    onDeleteConversation: vi.fn(),
    onUpdateConversationTitle: vi.fn(),
    onDesktopCloseClick: vi.fn(),
    onMobileCloseClick: vi.fn(),
    onOpenSearchModal: vi.fn(),
    isMobileSideBarOpen: false,
    isDesktopSideBarOpen: true,
    isSearchHistoryOpen: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders MobileSideBar in mobile layout when sidebar is open', () => {
    vi.mocked(useIsMobileLayout).mockReturnValue(true);

    render(<SideBar {...mockProps} isMobileSideBarOpen={true} />);

    expect(screen.getByTestId('mobile-sidebar-close')).toBeInTheDocument();
    expect(
      screen.queryByTestId('desktop-sidebar-close'),
    ).not.toBeInTheDocument();
  });

  test('does not render MobileSideBar in mobile layout when sidebar is closed', () => {
    vi.mocked(useIsMobileLayout).mockReturnValue(true);

    render(<SideBar {...mockProps} isMobileSideBarOpen={false} />);

    expect(
      screen.queryByTestId('mobile-sidebar-close'),
    ).not.toBeInTheDocument();
  });

  test('renders DesktopSideBar in desktop layout when sidebar is open', () => {
    vi.mocked(useIsMobileLayout).mockReturnValue(false);

    render(<SideBar {...mockProps} isDesktopSideBarOpen={true} />);

    expect(screen.getByTestId('desktop-sidebar-close')).toBeInTheDocument();
    expect(
      screen.queryByTestId('mobile-sidebar-close'),
    ).not.toBeInTheDocument();
  });

  test('does not render DesktopSideBar in desktop layout when sidebar is closed', () => {
    vi.mocked(useIsMobileLayout).mockReturnValue(false);

    render(<SideBar {...mockProps} isDesktopSideBarOpen={false} />);

    expect(
      screen.queryByTestId('desktop-sidebar-close'),
    ).not.toBeInTheDocument();
  });

  test('transitions from desktop to mobile layout - sidebar open states', () => {
    vi.mocked(useIsMobileLayout).mockReturnValue(false);

    const { rerender } = render(
      <SideBar
        {...mockProps}
        isDesktopSideBarOpen={true}
        isMobileSideBarOpen={false}
      />,
    );

    expect(screen.getByTestId('desktop-sidebar-close')).toBeInTheDocument();
    expect(
      screen.queryByTestId('mobile-sidebar-close'),
    ).not.toBeInTheDocument();

    //  Resize to mobile layout
    vi.mocked(useIsMobileLayout).mockReturnValue(true);

    //  Rerender with the same props
    rerender(
      <SideBar
        {...mockProps}
        isDesktopSideBarOpen={true}
        isMobileSideBarOpen={false}
      />,
    );

    //  Now neither close button should be visible because mobile sidebar is closed
    expect(
      screen.queryByTestId('desktop-sidebar-close'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('mobile-sidebar-close'),
    ).not.toBeInTheDocument();

    //  Open the mobile sidebar
    rerender(
      <SideBar
        {...mockProps}
        isDesktopSideBarOpen={true}
        isMobileSideBarOpen={true}
      />,
    );

    expect(
      screen.queryByTestId('desktop-sidebar-close'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('mobile-sidebar-close')).toBeInTheDocument();
  });

  test('transitions from mobile to desktop layout - sidebar open states', () => {
    vi.mocked(useIsMobileLayout).mockReturnValue(true);

    const { rerender } = render(
      <SideBar
        {...mockProps}
        isDesktopSideBarOpen={true}
        isMobileSideBarOpen={true}
      />,
    );

    expect(
      screen.queryByTestId('desktop-sidebar-close'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('mobile-sidebar-close')).toBeInTheDocument();

    vi.mocked(useIsMobileLayout).mockReturnValue(false);

    rerender(
      <SideBar
        {...mockProps}
        isDesktopSideBarOpen={true}
        isMobileSideBarOpen={true}
      />,
    );

    expect(screen.getByTestId('desktop-sidebar-close')).toBeInTheDocument();
    expect(
      screen.queryByTestId('mobile-sidebar-close'),
    ).not.toBeInTheDocument();

    rerender(
      <SideBar
        {...mockProps}
        isDesktopSideBarOpen={false}
        isMobileSideBarOpen={true}
      />,
    );

    expect(
      screen.queryByTestId('desktop-sidebar-close'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('mobile-sidebar-close'),
    ).not.toBeInTheDocument();
  });

  test('renders the logo and ChatHistory component', () => {
    vi.mocked(useIsMobileLayout).mockReturnValue(false);

    render(<SideBar {...mockProps} />);

    expect(
      screen.getByRole('img', { name: 'Hard AI logo' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('chat-history')).toBeInTheDocument();
  });

  test('calls onMobileCloseClick when mobile close button is clicked', () => {
    vi.mocked(useIsMobileLayout).mockReturnValue(true);

    render(<SideBar {...mockProps} isMobileSideBarOpen={true} />);

    screen.getByTestId('mobile-sidebar-close').click();
    expect(mockProps.onMobileCloseClick).toHaveBeenCalledTimes(1);
  });

  test('calls onDesktopCloseClick when desktop close button is clicked', () => {
    vi.mocked(useIsMobileLayout).mockReturnValue(false);

    render(<SideBar {...mockProps} isDesktopSideBarOpen={true} />);

    screen.getByTestId('desktop-sidebar-close').click();
    expect(mockProps.onDesktopCloseClick).toHaveBeenCalledTimes(1);
  });
  test('calls onOpenSearchModal when search button is clicked', async () => {
    render(<SideBar {...mockProps} />);

    const searchButton = screen.getByRole('button', { name: 'Search History' });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockProps.onOpenSearchModal).toHaveBeenCalledTimes(1);
    });
  });
});
