import { LandingContent } from './LandingContent';
import { ChatInput } from './ChatInput';
import styles from './App.module.css';
import { NavBar } from './NavBar';
import { ConversationWrapper } from './ConversationWrapper';
import { ActiveChat, ChatMessage } from './types';
import { Dispatch, SetStateAction } from 'react';

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

  return (
    <div className={styles.content}>
      <div className={styles.chatview}>
        <div className={styles.scrollContainer}>
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
                <ConversationWrapper activeChat={activeChat} />
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
