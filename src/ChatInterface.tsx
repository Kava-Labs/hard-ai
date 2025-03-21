import { LandingContent } from './LandingContent';
import { ChatInput } from './ChatInput';
import styles from './App.module.css';
import { NavBar } from './NavBar';
import { ConversationWrapper } from './ConversationWrapper';
import { ActiveChat, ChatMessage } from './types';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

interface ChatInterfaceProps {
  activeChat: ActiveChat;
  handleChatCompletion: (messages: ChatMessage[]) => void;
  handleCancel: () => void;
  handleNewChat: () => void;
  isDesktopSideBarOpen: boolean;
  setIsMobileSideBarOpen: Dispatch<SetStateAction<boolean>>;
  setIsDesktopSideBarOpen: Dispatch<SetStateAction<boolean>>;
}

export const ChatInterface = ({
  activeChat,
  handleChatCompletion,
  handleCancel,
  handleNewChat,
  isDesktopSideBarOpen,
  setIsMobileSideBarOpen,
  setIsDesktopSideBarOpen,
}: ChatInterfaceProps) => {
  const hasActiveConversation = activeChat.isConversationStarted === true;
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
              onMobileMenuClick={() => setIsMobileSideBarOpen(true)}
              onDesktopMenuClick={() => setIsDesktopSideBarOpen(true)}
              isDesktopSideBarOpen={isDesktopSideBarOpen}
              onNewChatClick={handleNewChat}
            />
          </div>
          <div className={styles.chatContainer}>
            <div
              className={`${styles.chatContent} ${hasActiveConversation ? styles.fullHeight : ''}`}
            >
              {hasActiveConversation && (
                <ConversationWrapper
                  activeChat={activeChat}
                  onRendered={handleContentRendered}
                />
              )}
            </div>
            <div
              className={`${styles.controlsContainer} ${hasActiveConversation ? styles.positionSticky : ''}`}
            >
              {!hasActiveConversation && <LandingContent />}
              <ChatInput
                handleChatCompletion={handleChatCompletion}
                handleCancel={handleCancel}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
