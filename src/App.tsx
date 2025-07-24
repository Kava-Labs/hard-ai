import { SearchHistoryModal, SideBar, useIsMobileLayout } from 'lib-kava-ai';
import { useState, useEffect } from 'react';
import styles from './App.module.css';
import { ChatInterface } from './ChatInterface';
import KavaAILogo from './kavaAILogo';
import { initializeToolCallRegistry } from './toolcalls/chain';
import { useChatWithWallet } from './useChatWithWallet';
import { initializeMCPClient } from './utils/mcpClient';
import {
  deregisterMcpToolsFromRegistry,
  registerMcpToolsWithRegistry,
} from './toolcalls/chain/MCPToolCallOperation';

const toolCallRegistry = initializeToolCallRegistry();

export const App = () => {
  const [isMobileSideBarOpen, setIsMobileSideBarOpen] = useState(false);
  const [isDesktopSideBarOpen, setIsDesktopSideBarOpen] = useState(true);
  const [isSearchHistoryOpen, setIsSearchHistoryOpen] = useState(false);

  const onCloseSearchHistory = () => {
    setIsSearchHistoryOpen(false);
  };

  const onOpenSearchModal = async () => {
    await fetchSearchHistory();
    setIsSearchHistoryOpen(true);
  };

  const isMobileLayout = useIsMobileLayout();

  const onCloseSideBar = isMobileLayout
    ? () => setIsMobileSideBarOpen(false)
    : () => setIsDesktopSideBarOpen(false);

  const onOpenSideBar = isMobileLayout
    ? () => setIsMobileSideBarOpen(true)
    : () => setIsDesktopSideBarOpen(true);

  const isSideBarOpen = isMobileLayout
    ? isMobileSideBarOpen
    : isDesktopSideBarOpen;

  const [webSearchEnabled, setWebSearchEnabled] = useState(true);

  useEffect(() => {
    if (webSearchEnabled) {
      registerMcpToolsWithRegistry(toolCallRegistry).catch(console.error);
    } else {
      deregisterMcpToolsFromRegistry(toolCallRegistry);
    }
  }, [webSearchEnabled]);

  const {
    activeChat,
    conversationHistories,
    handleChatCompletion,
    handleCancel,
    handleNewChat,
    selectConversation,
    deleteConversation,
    updateConversationTitle,
    searchableHistory,
    fetchSearchHistory,
    changeModel,
  } = useChatWithWallet({ toolCallRegistry });

  return (
    <div className={styles.app}>
      <SideBar
        activeConversationId={activeChat.id}
        conversationHistories={conversationHistories}
        onCloseClick={onCloseSideBar}
        onDeleteConversation={deleteConversation}
        onOpenSearchModal={onOpenSearchModal}
        onSelectConversation={selectConversation}
        onUpdateConversationTitle={updateConversationTitle}
        isSideBarOpen={isSideBarOpen}
        SideBarLogo={<KavaAILogo height={20} name="kava-ai-sidebar-logo" />}
        styles={styles}
        links={[
          {
            title: 'KavaAI Chat',
            url: 'https://chat.kava.io/',
          },
        ]}
      />
      <ChatInterface
        activeChat={activeChat}
        handleCancel={handleCancel}
        handleChatCompletion={handleChatCompletion}
        handleNewChat={handleNewChat}
        toolCallRegistry={toolCallRegistry}
        onMenuClick={onOpenSideBar}
        isSideBarOpen={isSideBarOpen}
        styles={styles}
        changeModel={changeModel}
        webSearchEnabled={webSearchEnabled}
        onWebSearchToggle={setWebSearchEnabled}
      />
      {isSearchHistoryOpen && searchableHistory && (
        <SearchHistoryModal
          searchableHistory={searchableHistory}
          onSelectConversation={selectConversation}
          onCloseSearchHistory={onCloseSearchHistory}
        />
      )}
    </div>
  );
};
