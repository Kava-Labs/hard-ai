import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInterface } from './ChatInterface';
import { TextStreamStore } from './stores/textStreamStore';
import { ToolCallStreamStore } from './stores/toolCallStreamStore';
import { initializeMessageRegistry } from './types/chain';
import { ActiveChat } from './types';
import { useIsMobileLayout } from './theme/useIsMobileLayout';

vi.mock('./theme/useIsMobileLayout');

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
    progressStore: new TextStreamStore(),
    isOperationValidated: false,
    toolCallStreamStore: new ToolCallStreamStore(),
    operationRegistry: initializeMessageRegistry(),
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

  it('calls onMenuClick when mobile menu button is clicked', () => {
    vi.mocked(useIsMobileLayout).mockReturnValue(true);

    render(<ChatInterface {...mockProps} />);

    const mobileMenuButton = screen.getByLabelText('Open Mobile Menu');
    fireEvent.click(mobileMenuButton);

    expect(mockProps.onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('calls onMenuClick when desktop menu button is clicked', () => {
    vi.mocked(useIsMobileLayout).mockReturnValue(false);

    render(<ChatInterface {...mockProps} isSideBarOpen={false} />);

    const desktopMenuButton = screen.getByLabelText('Open Desktop Menu');
    fireEvent.click(desktopMenuButton);

    expect(mockProps.onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('calls handleNewChat when new chat button is clicked', () => {
    render(<ChatInterface {...mockProps} />);

    const newChatButton = screen.getByLabelText('New Chat Button');
    fireEvent.click(newChatButton);

    expect(mockProps.handleNewChat).toHaveBeenCalled();
  });
});
