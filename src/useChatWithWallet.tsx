import { useState } from 'react';
import { walletStore } from './stores/walletStore';
import { useWalletState } from './stores/walletStore/useWalletState';
import { ToolCallRegistry } from './toolcalls/chain';
import { ChatMessage, WalletInfo } from './types';
import { useChat } from './useChat';

const walletContextMessage = (walletInfo: WalletInfo): ChatMessage => {
  return {
    role: 'system',
    content: `Current wallet information: Address: ${walletInfo.address} on chain ID: ${walletInfo.chainId}.
          Wallet type: ${walletInfo.walletType || 'Unknown'}.
          ${walletInfo.balancesPrompt}`,
  };
};

interface UseChatWithWalletOptions {
  toolCallRegistry: ToolCallRegistry<unknown>;
  initialMessages?: ChatMessage[];
  webSearchEnabled?: boolean;
}

export const useChatWithWallet = ({
  toolCallRegistry,
  initialMessages = [],
}: UseChatWithWalletOptions) => {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [currentInitialMessages, setCurrentInitialMessages] =
    useState<ChatMessage[]>(initialMessages);

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
    addPendingSystemMessage,
    toolResultStore,
  } = useChat({
    initialMessages: currentInitialMessages,
    toolCallRegistry,
    executeToolCall: async (operationName, params) => {
      return await toolCallRegistry.executeToolCall(
        operationName,
        params,
        walletInfo,
        walletStore,
      );
    },
  });

  const {
    disconnectWallet,
    walletAddress,
    availableProviders,
    refreshProviders,
    handleProviderSelect,
    walletProviderInfo,
  } = useWalletState({
    onWalletConnect: (walletInfo) => {
      const msg = walletContextMessage(walletInfo);
      // add connected wallet context to existing chat
      addPendingSystemMessage(msg.content as string);
      // ensure new chats include wallet context
      setCurrentInitialMessages([msg]);
      setWalletInfo(walletInfo);
    },
    onWalletDisconnect: () => {
      setCurrentInitialMessages([]);
      addPendingSystemMessage(
        'Wallet has been disconnected. All previous wallet information is no longer valid.',
      );
      setWalletInfo(null);
    },
    onWalletChange: (prevInfo, walletInfo) => {
      const content = `Wallet account changed. New address: ${walletInfo.address} on chain ID: ${walletInfo.chainId}.
      Wallet type: ${walletInfo.walletType}.
      Keep previous wallet information in context, but recognize that it is not current. ${walletInfo.balancesPrompt}`;
      addPendingSystemMessage(content);
      setCurrentInitialMessages([walletContextMessage(walletInfo)]);
      setWalletInfo(walletInfo);
    },
  });

  return {
    // Chat functionality
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
    addPendingSystemMessage,
    toolResultStore,

    // Wallet functionality
    walletInfo,
    disconnectWallet,
    walletAddress,
    availableProviders,
    refreshProviders,
    handleProviderSelect,
    walletProviderInfo,
  };
};
