import styles from './App.module.css';
import { useState } from 'react';
import { useChat } from './useChat';
import { SideBar } from './SideBar';
import { ChatInterface } from './ChatInterface';

export const App = () => {
  const [isMobileSideBarOpen, setIsMobileSideBarOpen] = useState(false);
  const [isDesktopSideBarOpen, setIsDesktopSideBarOpen] = useState(true);

  const openMobileSideBar = () => {
    setIsMobileSideBarOpen(true);
  };

  const openDesktopSideBar = () => {
    setIsDesktopSideBarOpen(true);
  };

  const closeMobileSideBar = () => {
    setIsMobileSideBarOpen(false);
  };

  const closeDesktopSideBar = () => {
    setIsDesktopSideBarOpen(false);
  };

  const {
    activeChat,
    conversationHistories,
    handleChatCompletion,
    handleCancel,
    handleNewChat,
    onSelectConversation,
    onDeleteConversation,
    onUpdateConversationTitle,
  } = useChat();

  return (
    <div className={styles.app}>
      <SideBar
        conversationHistories={conversationHistories}
        onSelectConversation={onSelectConversation}
        activeConversationId={activeChat.id}
        onDeleteConversation={onDeleteConversation}
        onUpdateConversationTitle={onUpdateConversationTitle}
        isMobileSideBarOpen={isMobileSideBarOpen}
        isDesktopSideBarOpen={isDesktopSideBarOpen}
        onMobileCloseClick={closeMobileSideBar}
        onDesktopCloseClick={closeDesktopSideBar}
      />
      <ChatInterface
        activeChat={activeChat}
        handleChatCompletion={handleChatCompletion}
        handleCancel={handleCancel}
        handleNewChat={handleNewChat}
        isDesktopSideBarOpen={isDesktopSideBarOpen}
        onMobileMenuClick={openMobileSideBar}
        onDesktopMenuClick={openDesktopSideBar}
      />
    </div>
  );
};
