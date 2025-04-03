import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatInterface } from './ChatInterface';
import { ToolCallStreamStore } from './stores/toolCallStreamStore';
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
  const mockProps = {
    activeChat: {
      id: 'test-chat-id',
      isConversationStarted: false,
      messages: [],
    } as unknown as ActiveChat,
    handleChatCompletion: vi.fn(),
    handleCancel: vi.fn(),
    handleNewChat: vi.fn(),
    isOperationValidated: false,
    toolCallStreamStore: new ToolCallStreamStore(),
    toolCallRegistry: initializeToolCallRegistry(),
    isSideBarOpen: true,
    onMenuClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with inactive conversation', () => {
    render(<ChatInterface {...mockProps} />);

    const hardAILogo = screen.getByRole('img', {
      name: 'Hard AI logo',
    });
    const welcomeText = screen.getByText('How can I help you with Web3?');
    const input = screen.getByPlaceholderText('Ask anything...');

    expect(hardAILogo).toBeInTheDocument();
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
