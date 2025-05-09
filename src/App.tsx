import styles from './App.module.css';
import { useState } from 'react';
import { useChat } from './useChat';
import { ChatInterface } from './ChatInterface';
import { useIsMobileLayout, SearchHistoryModal, SideBar } from 'lib-kava-ai';
import WalletModal from './WalletModal';
import { PROMOTED_WALLETS } from './utils/wallet';
import KavaAILogo from './kavaAILogo';

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
    availableProviders,
    walletProviderInfo,
    openWalletConnectModal,
    closeWalletConnectModal,
    isWalletModalOpen,
    onProviderSelect,
  } = useChat();

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
        walletAddress={walletAddress}
        walletProviderInfo={walletProviderInfo}
        onConnectWalletClick={openWalletConnectModal}
        disconnectWallet={disconnectWallet}
        availableProviderCount={availableProviders.length}
      />
      {isSearchHistoryOpen && searchableHistory && (
        <SearchHistoryModal
          searchableHistory={searchableHistory}
          onSelectConversation={onSelectConversation}
          onCloseSearchHistory={onCloseSearchHistory}
        />
      )}

      {isWalletModalOpen && (
        <WalletModal
          onClose={closeWalletConnectModal}
          availableProviders={availableProviders}
          onSelectProvider={onProviderSelect}
          promotedWallets={PROMOTED_WALLETS}
        />
      )}
    </div>
  );
};
