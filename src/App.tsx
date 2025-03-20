import { LandingContent } from './LandingContent';
import { ChatInput } from './ChatInput';
import styles from './App.module.css';
import { useState } from 'react';
import { NavBar } from './NavBar';
import { useChat } from './useChat';
import { ConversationWrapper } from './ConversationWrapper';
import { SideBar } from './SideBar';

export const App = () => {
  const [isMobileSideBarOpen, setIsMobileSideBarOpen] = useState(false);
  const [isDesktopSideBarOpen, setIsDesktopSideBarOpen] = useState(true);

  const {
    activeChat,
    conversationHistories,
    handleChatCompletion,
    handleCancel,
    handleDeleteConversation,
    handleUpdateConversationTitle,
    handleNewChat,
    handleSelectConversation,
  } = useChat();

  const hasActiveConversation = activeChat.isConversationStarted === true;

  return (
    <div className={styles.app}>
      <SideBar
        conversationHistories={conversationHistories}
        onSelectConversation={handleSelectConversation}
        activeConversationId={activeChat.id}
        onDeleteConversation={handleDeleteConversation}
        onUpdateConversationTitle={handleUpdateConversationTitle}
        isMobileSideBarOpen={isMobileSideBarOpen}
        isDesktopSideBarOpen={isDesktopSideBarOpen}
        onMobileCloseClick={() => setIsMobileSideBarOpen(false)}
        onDesktopCloseClick={() => setIsDesktopSideBarOpen(false)}
      />
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
    </div>
  );
};
