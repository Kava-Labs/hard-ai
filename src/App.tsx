import styles from './App.module.css';
import { useState, useEffect } from 'react';
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
  const [connectedProvider, setConnectedProvider] = useState<{
    icon?: string;
    name?: string;
  }>({});

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
    walletConnection,
    disconnectWallet,
    connectWallet,
    connectEIP6963Provider,
    availableProviders,
    refreshProviders,
  } = useChat();

  // Find the connected provider when wallet is connected
  useEffect(() => {
    if (walletConnection.isWalletConnected && walletConnection.rdns) {
      // Find the provider that matches the connected wallet's RDNS
      const provider = availableProviders.find(
        (p) => p.info.rdns === walletConnection.rdns,
      );

      if (provider) {
        setConnectedProvider({
          icon: provider.info.icon,
          name: provider.info.name,
        });
      }
    } else if (!walletConnection.isWalletConnected) {
      // Clear the connected provider when wallet is disconnected
      setConnectedProvider({});
    }
  }, [
    walletConnection.isWalletConnected,
    walletConnection.rdns,
    availableProviders,
  ]);

  const openWalletConnect = () => {
    refreshProviders();
    connectWallet().catch((err) => {
      console.error((err as Error).message || 'Failed to connect wallet');
    });
    setIsWalletConnectOpen(true);
  };

  const closeWalletConnect = () => {
    setIsWalletConnectOpen(false);
  };

  const handleProviderSelect = async (provider: EIP6963ProviderDetail) => {
    closeWalletConnect();
    try {
      await connectEIP6963Provider(
        provider.info.uuid,
        `0x${Number(2222).toString(16)}`,
      );
    } catch (err) {
      console.error(
        `Failed to connect to ${provider.info.name}: ${(err as Error).message}`,
      );
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setConnectedProvider({});
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
        isWalletConnected={walletConnection.isWalletConnected}
        providerIcon={connectedProvider.icon}
        providerName={connectedProvider.name}
        connectWallet={openWalletConnect}
        disconnectWallet={handleDisconnect}
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
          onSelectProvider={handleProviderSelect}
        />
      )}
    </div>
  );
};
