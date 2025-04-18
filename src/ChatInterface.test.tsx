import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatInterface, ChatInterfaceProps } from './ChatInterface';
import { initializeToolCallRegistry } from './toolcalls/chain';
import { ActiveChat } from './types';

vi.mock('./ConversationWrapper', () => ({
  ConversationWrapper: ({ activeChat }: { activeChat: ActiveChat }) => (
    <div data-testid="conversation-wrapper">
      Conversation ID: {activeChat.id}
    </div>
  ),
}));

vi.mock('lib-kava-ai', async () => {
  return {
    useIsMobileLayout: vi.fn(),
    NavBar: () => (
      <div data-testid="mock-navbar">
        <button aria-label="New Chat Button">New Chat</button>
        <button aria-label="Open Menu">Menu</button>
      </div>
    ),
  };
});

describe('ChatInterface', () => {
  const mockProps: ChatInterfaceProps = {
    activeChat: {
      id: 'test-chat-id',
      isConversationStarted: false,
      messages: [],
    } as unknown as ActiveChat,
    handleChatCompletion: vi.fn(),
    handleCancel: vi.fn(),
    handleNewChat: vi.fn(),
    toolCallRegistry: initializeToolCallRegistry(),
    isSideBarOpen: true,
    onMenuClick: vi.fn(),
    styles: {
      content: '',
    },
    walletAddress: '',
    onConnectWalletClick: vi.fn(),
    disconnectWallet: vi.fn(),
    availableProviderCount: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with inactive conversation', () => {
    render(<ChatInterface {...mockProps} />);

    const logo = screen.getByTestId('kava-ai-logo');
    const welcomeText = screen.getByText('How can I help you with Web3?');
    const input = screen.getByPlaceholderText('Ask anything...');

    expect(logo).toBeInTheDocument();
    expect(welcomeText).toBeInTheDocument();
    expect(input).toBeInTheDocument();
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
});
