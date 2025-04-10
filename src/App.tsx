import styles from './App.module.css';
import { useState } from 'react';
import { useChat } from './useChat';
import { ChatInterface } from './ChatInterface';
import { useIsMobileLayout, SearchHistoryModal, SideBar } from 'lib-kava-ai';
import hardAILogo from './assets/hardAILogo.svg';
import {
  getLiquidityPositionsForAddress,
  getPoolTVL,
  getQuoteExactInputSingle,
  getTokenUSDPrice,
  swapExactInputSingle,
} from './toolcalls/chain';
// import { getPoolTVL } from './toolcalls/chain';

const sideBarLogo = <img src={hardAILogo} alt="Hard AI logo" height={18} />;

// usdt kava pool, should be around 4 million
// console.log(await getPoolTVL('0x4F7b88eC00529374Fb20A9E8f9263d6FA8A4C1C4'));

// quote for swapping 1 USDT to Kava
// console.log(
//   await getQuoteExactInputSingle(
//     '0x919C1c267BC06a7039e03fcc2eF738525769109c',
//     '0xc86c7C0eFbd6A49B35E8714C5f59D99De09A225b',
//     '1.00',
//   ),
// );

// console.log(await getTokenUSDPrice('0x25e9171C98Fc1924Fa9415CF50750274F0664764'))

console.log(
  await getLiquidityPositionsForAddress(
    '0xC07918E451Ab77023a16Fa7515Dd60433A3c771D',
  ),
);

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
    connectWallet,
    disconnectWallet,
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
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
      />
      {isSearchHistoryOpen && searchableHistory && (
        <SearchHistoryModal
          searchableHistory={searchableHistory}
          onSelectConversation={onSelectConversation}
          onCloseSearchHistory={onCloseSearchHistory}
        />
      )}
      <button
        onClick={() => {
          swapExactInputSingle({
            tokenInContractAddress:
              '0xc86c7C0eFbd6A49B35E8714C5f59D99De09A225b',
            tokenOutContractAddress:
              '0x919C1c267BC06a7039e03fcc2eF738525769109c',
            amountIn: '1',
          });
        }}
      >
        swap
      </button>
    </div>
  );
};
