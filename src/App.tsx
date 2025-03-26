import styles from './App.module.css';
import { useState } from 'react';
import { useChat } from './useChat';
import { SideBar } from './SideBar';
import { ChatInterface } from './ChatInterface';
import { SearchHistoryModal } from './SearchHistoryModal';

export const App = () => {
  const [isMobileSideBarOpen, setIsMobileSideBarOpen] = useState(false);
  const [isDesktopSideBarOpen, setIsDesktopSideBarOpen] = useState(true);
  const [isSearchHistoryOpen, setIsSearchHistoryOpen] = useState(false);

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

  const onCloseSearchHistory = () => {
    setIsSearchHistoryOpen(false);
  };

  const onClickSearchHistory = async () => {
    await fetchSearchHistory();
    setIsSearchHistoryOpen(true);
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
    fetchSearchHistory,
    searchableHistory,
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
        isSearchHistoryOpen={isSearchHistoryOpen}
        onClickSearchHistory={onClickSearchHistory}
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
      {isSearchHistoryOpen && searchableHistory && (
        <SearchHistoryModal
          searchableHistory={searchableHistory}
          onSelectConversation={onSelectConversation}
          onCloseSearchHistory={onCloseSearchHistory}
        />
      )}
    </div>
  );
};
