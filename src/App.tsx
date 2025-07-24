import {
  ChatMessage,
  SearchHistoryModal,
  SideBar,
  useIsMobileLayout,
} from 'lib-kava-ai';
import { useState } from 'react';
import styles from './App.module.css';
import { ChatInterface } from './ChatInterface';
import KavaAILogo from './kavaAILogo';
import { useWalletState } from './stores/walletStore/useWalletState';
import { ToolCallRegistry } from './toolcalls/chain';
import { WalletInfo } from './types';
import { useChat } from './useChat';

const walletContextMessage = (walletInfo: WalletInfo): ChatMessage => {
  return {
    role: 'system',
    content: `Current wallet information: Address: ${walletInfo.address} on chain ID: ${walletInfo.chainId}.
          Wallet type: ${walletInfo.walletType || 'Unknown'}.
          ${walletInfo.balancesPrompt}`,
  };
};

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

  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);

  const {
    activeChat,
    conversationHistories,
    handleChatCompletion,
    handleCancel,
    handleNewChat,
    selectConversation: onSelectConversation,
    deleteConversation: onDeleteConversation,
    updateConversationTitle: onUpdateConversationTitle,
    searchableHistory,
    fetchSearchHistory,
    toolCallRegistry,
    changeModel,
    addPendingSystemMessage,
  } = useChat({
    initialMessages,
    // TODO
    toolCallRegistry: new ToolCallRegistry(),
    executeToolCall: async (operationName, params) => {
      return '';
    },
  });

  useWalletState({
    onWalletConnect: (walletInfo) => {
      const msg = walletContextMessage(walletInfo);
      // add connected wallet context to existing chat
      addPendingSystemMessage(msg.content as string);
      // ensure new chats include wallet context
      setInitialMessages([msg]);
    },
    onWalletDisconnect: () => {
      setInitialMessages([]);
      addPendingSystemMessage(
        'Wallet has been disconnected. All previous wallet information is no longer valid.',
      );
    },
    onWalletChange: (prevInfo, walletInfo) => {
      const content = `Wallet account changed. New address: ${walletInfo.address} on chain ID: ${walletInfo.chainId}.
        Wallet type: ${walletInfo.walletType}.
        Keep previous wallet information in context, but recognize that it is not current. ${walletInfo.balancesPrompt}`;
      addPendingSystemMessage(content);
      setInitialMessages([walletContextMessage(walletInfo)]);
    },
  });

  return (
    <div className={styles.app}>
      <SideBar
        activeConversationId={activeChat.id}
        conversationHistories={conversationHistories}
        onCloseClick={onCloseSideBar}
        onDeleteConversation={onDeleteConversation}
        onOpenSearchModal={onOpenSearchModal}
        onSelectConversation={onSelectConversation}
        onUpdateConversationTitle={onUpdateConversationTitle}
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
