import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInterface } from './ChatInterface';
import { ActiveChat, ChatMessage } from './types';

vi.mock('./LandingContent', () => ({
  LandingContent: () => (
    <div data-testid="landing-content">Landing Content</div>
  ),
}));

vi.mock('./ChatInput', () => ({
  ChatInput: ({
    handleChatCompletion,
    handleCancel,
  }: {
    handleChatCompletion: (newMessages: ChatMessage[]) => void;
    handleCancel: () => void;
  }) => (
    <div data-testid="chat-input">
      <button
        data-testid="send-button"
        onClick={() =>
          handleChatCompletion([{ role: 'user', content: 'Test message' }])
        }
      >
        Send
      </button>
      <button data-testid="cancel-button" onClick={handleCancel}>
        Cancel
      </button>
    </div>
  ),
}));

vi.mock('./NavBar', () => ({
  NavBar: ({
    onMobileMenuClick,
    onDesktopMenuClick,
    onNewChatClick,
  }: {
    onMobileMenuClick: () => void;
    onDesktopMenuClick: () => void;
    isDesktopSideBarOpen: boolean;
    onNewChatClick: () => void;
  }) => (
    <div data-testid="nav-bar">
      <button data-testid="mobile-menu-button" onClick={onMobileMenuClick}>
        Mobile Menu
      </button>
      <button data-testid="desktop-menu-button" onClick={onDesktopMenuClick}>
        Desktop Menu
      </button>
      <button data-testid="new-chat-button" onClick={onNewChatClick}>
        New Chat
      </button>
    </div>
  ),
}));

vi.mock('./ConversationWrapper', () => ({
  ConversationWrapper: ({ activeChat }: { activeChat: ActiveChat }) => (
    <div data-testid="conversation-wrapper">
      Conversation ID: {activeChat.id}
    </div>
  ),
}));

describe('ChatInterface', () => {
  const mockProps = {
    activeChat: {
      id: 'test-chat-id',
      isConversationStarted: false,
      messages: [],
    } as unknown as ActiveChat,
    handleChatCompletion: vi.fn(),
    handleCancel: vi.fn(),
    handleNewChat: vi.fn(),
    isDesktopSideBarOpen: true,
    onMobileMenuClick: vi.fn(),
    onDesktopMenuClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with inactive conversation', () => {
    render(<ChatInterface {...mockProps} />);

    expect(screen.getByTestId('nav-bar')).toBeInTheDocument();
    expect(
      screen.queryByTestId('conversation-wrapper'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('landing-content')).toBeInTheDocument();
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
  });

  it('renders correctly with active conversation', () => {
    const activeProps = {
      ...mockProps,
      activeChat: {
        ...mockProps.activeChat,
        isConversationStarted: true,
      },
    };

    render(<ChatInterface {...activeProps} />);

    expect(screen.getByTestId('conversation-wrapper')).toBeInTheDocument();
    expect(screen.queryByTestId('landing-content')).not.toBeInTheDocument();
  });

  it('calls setIsMobileSideBarOpen when mobile menu button is clicked', () => {
    render(<ChatInterface {...mockProps} />);

    const mobileMenuButton = screen.getByTestId('mobile-menu-button');
    fireEvent.click(mobileMenuButton);

    expect(mockProps.onMobileMenuClick).toHaveBeenCalledTimes(1);
  });

  it('calls setIsDesktopSideBarOpen when desktop menu button is clicked', () => {
    render(<ChatInterface {...mockProps} />);

    const desktopMenuButton = screen.getByTestId('desktop-menu-button');
    fireEvent.click(desktopMenuButton);

    expect(mockProps.onDesktopMenuClick).toHaveBeenCalledTimes(1);
  });

  it('calls handleNewChat when new chat button is clicked', () => {
    render(<ChatInterface {...mockProps} />);

    const newChatButton = screen.getByTestId('new-chat-button');
    fireEvent.click(newChatButton);

    expect(mockProps.handleNewChat).toHaveBeenCalled();
  });
});
