import styles from './App.module.css';
import { useState } from 'react';
import { useChat } from './useChat';
import { ChatInterface } from './ChatInterface';
import { useIsMobileLayout, SearchHistoryModal, SideBar } from 'lib-kava-ai';
import hardAILogo from './assets/hardAILogo.svg';
import WalletModal from './WalletModal';
import { EIP6963ProviderDetail } from './stores/walletStore';

const sideBarLogo = <img src={hardAILogo} alt="Hard AI logo" height={18} />;

export const App = () => {
  const [isMobileSideBarOpen, setIsMobileSideBarOpen] = useState(false);
  const [isDesktopSideBarOpen, setIsDesktopSideBarOpen] = useState(true);
  const [isSearchHistoryOpen, setIsSearchHistoryOpen] = useState(false);
  const [isWalletConnectOpen, setIsWalletConnectOpen] = useState(false);

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

  const {
    activeChat,
    conversationHistories,
    handleChatCompletion,
    handleCancel,
    handleNewChat,
    onSelectConversation,
    onDeleteConversation,
    onUpdateConversationTitle,
    searchableHistory,
    fetchSearchHistory,
    toolCallRegistry,
    walletAddress,
    disconnectWallet,
    detectProviders,
    handleProviderSelect,
    availableProviders,
    walletProviderInfo,
  } = useChat();

  const openWalletConnect = async () => {
    const result = await detectProviders();
    if (!result.singleProviderConnected) {
      setIsWalletConnectOpen(true);
    }
  };

  const closeWalletConnect = () => {
    setIsWalletConnectOpen(false);
  };

  const onProviderSelect = async (provider: EIP6963ProviderDetail) => {
    await handleProviderSelect(provider);
    closeWalletConnect();
  };

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
        SideBarLogo={sideBarLogo}
        styles={styles}
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
        walletAddress={walletAddress}
        walletProviderInfo={walletProviderInfo}
        onConnectWalletClick={openWalletConnect}
        disconnectWallet={disconnectWallet}
      />
      {isSearchHistoryOpen && searchableHistory && (
        <SearchHistoryModal
          searchableHistory={searchableHistory}
          onSelectConversation={onSelectConversation}
          onCloseSearchHistory={onCloseSearchHistory}
        />
      )}

      {isWalletConnectOpen && (
        <WalletModal
          onClose={closeWalletConnect}
          availableProviders={availableProviders}
          onSelectProvider={onProviderSelect}
        />
      )}
    </div>
  );
};
