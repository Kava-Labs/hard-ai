import { ChatInput } from './ChatInput';
import { NavBar, LandingContent } from 'lib-kava-ai';
import { ConversationWrapper } from './ConversationWrapper';
import { ActiveChat, ChatMessage, DisplayedWalletProviderInfo } from './types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ToolCallRegistry } from './toolcalls/chain';
import ConnectWalletButton from './ConnectWalletButton';

const showWalletConnect =
  import.meta.env['VITE_FEAT_WALLET_CONNECT'] === 'true';

export interface ChatInterfaceProps {
  activeChat: ActiveChat;
  handleChatCompletion: (messages: ChatMessage[]) => void;
  handleCancel: () => void;
  handleNewChat: () => void;
  toolCallRegistry: ToolCallRegistry<unknown>;
  isSideBarOpen: boolean;
  onMenuClick: () => void;
  styles: Record<string, string>;
  walletAddress: string;
  walletProviderInfo?: DisplayedWalletProviderInfo;
  onConnectWalletClick: () => void;
  disconnectWallet: () => void;
  availableProviderCount: number;
}

export const ChatInterface = ({
  activeChat,
  handleChatCompletion,
  handleCancel,
  handleNewChat,
  toolCallRegistry,
  isSideBarOpen,
  onMenuClick,
  styles,
  walletAddress,
  walletProviderInfo,
  onConnectWalletClick,
  disconnectWallet,
  availableProviderCount,
}: ChatInterfaceProps) => {
  const { isConversationStarted, isRequesting } = activeChat;
  const containerRef = useRef<HTMLDivElement>(null);
  // Track if we should auto-scroll
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;

    // Only update auto-scroll if we're not at the bottom, like if the user scrolls up in the chat
    if (!isAtBottom) {
      setShouldAutoScroll(false);
    } else {
      setShouldAutoScroll(true);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, []);

  // Add scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleContentRendered = useCallback(() => {
    if (!containerRef.current) return;

    if (shouldAutoScroll) {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [shouldAutoScroll, scrollToBottom]);

  return (
    <div className={styles.content}>
      <div className={styles.chatview}>
        <div ref={containerRef} className={styles.scrollContainer}>
          <div className={styles.chatHeader}>
            <NavBar
              onMenuClick={onMenuClick}
              isSideBarOpen={isSideBarOpen}
              onNewChatClick={handleNewChat}
              primaryControlComponent={
                showWalletConnect && (
                  <ConnectWalletButton
                    walletAddress={walletAddress}
                    handleConnectClick={onConnectWalletClick}
                    disconnectWallet={disconnectWallet}
                    icon={walletProviderInfo?.icon}
                    walletName={walletProviderInfo?.name}
                    showSwitchWallet={availableProviderCount > 1}
                  />
                )
              }
            />
          </div>
          <div className={styles.chatContainer}>
            <div
              className={`${styles.chatContent} ${isConversationStarted ? styles.fullHeight : ''}`}
            >
              {isConversationStarted && (
                <ConversationWrapper
                  toolCallRegistry={toolCallRegistry}
                  activeChat={activeChat}
                  onRendered={handleContentRendered}
                />
              )}
            </div>
            <div
              className={`${styles.controlsContainer} ${isConversationStarted ? styles.positionSticky : ''}`}
            >
              {!isConversationStarted && (
                <LandingContent introText={'How can I help you with Web3?'} />
              )}
              <ChatInput
                handleChatCompletion={handleChatCompletion}
                onCancelClick={handleCancel}
                isRequesting={isRequesting}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
