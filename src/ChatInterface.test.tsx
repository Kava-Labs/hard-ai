import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatInterface, ChatInterfaceProps } from './ChatInterface';
import { ActiveChat } from './types';
import { initializeToolCallRegistry } from './toolcalls/chain';

// Mock the tool call registry to avoid WalletProvider issues
vi.mock('./toolcalls/chain', () => ({
  initializeToolCallRegistry: vi.fn(() => ({
    get: vi.fn(),
    getAllOperations: vi.fn(() => []),
    getSystemPrompt: vi.fn(() => ''),
    getIntroText: vi.fn(() => ''),
    getInputPlaceholderText: vi.fn(() => ''),
    getMessages: vi.fn(() => []),
    getQueries: vi.fn(() => []),
    getToolDefinitions: vi.fn(() => []),
    executeToolCall: vi.fn(),
  })),
}));

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
    LandingContent: () => (
      <>
        <img alt="Kava AI logo" />
        <div>How can I help you?</div>
      </>
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with inactive conversation', () => {
    render(<ChatInterface {...mockProps} />);

    const logo = screen.getByAltText('Kava AI logo');
    const welcomeText = screen.getByText('How can I help you?');
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
