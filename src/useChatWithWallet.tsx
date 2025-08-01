import { useState } from 'react';
import { walletStore } from './stores/walletStore';
import { useWalletState } from './stores/walletStore/useWalletState';
import { ToolCallRegistry } from './toolcalls/chain';
import { ChatMessage, WalletInfo } from './types';
import { useChat } from './useChat';
import {
  deregisterEvmToolsFromRegistry,
  changeChainToolCallRegistration,
  registerEvmToolsWithRegistry,
  getChainConfigByChainId,
} from './toolcalls/evmTools';

const walletContextMessage = async (
  walletInfo: WalletInfo,
): Promise<ChatMessage> => {
  if (!walletInfo.isConnected) {
    return {
      role: 'system',
      content: 'User does not have a wallet connected.',
    };
  }

  const details = await getChainConfigByChainId(walletInfo.chainId);
  const chainName = details?.chainName || 'Unknown';
  const chainConfig = details?.chainConfig || null;

  const context: string[] = [
    'Connected wallet information:',
    `  Wallet address: ${walletInfo.address}`,
    `  Wallet type: ${walletInfo.walletType}`,
    `Wallet connected to chain network:`,
    `  Chain: ${chainName} (chainId=${walletInfo.chainId})`,
  ];

  if (chainConfig?.nativeToken) {
    context.push(
      `  Native token: ${chainConfig.nativeToken} (decimals=${chainConfig.nativeTokenDecimals})`,
    );
  }
  if (
    chainConfig?.blockExplorerUrls &&
    chainConfig.blockExplorerUrls.length > 0
  ) {
    context.push(`  Block explorer: ${chainConfig.blockExplorerUrls[0]}`);
  }

  return {
    role: 'system',
    content: context.join('\n'),
  };
};

const walletConnectionChangedMessage = async (
  prevInfo: WalletInfo,
  walletInfo: WalletInfo,
): Promise<string> => {
  const accountChanged = prevInfo.address !== walletInfo.address;
  const chainChanged = prevInfo.chainId !== walletInfo.chainId;
  const message = (() => {
    if (accountChanged && chainChanged) {
      return `**The connected wallet account and network changed.**`;
    } else if (accountChanged) {
      return `**The connected wallet has changed.**`;
    } else if (chainChanged) {
      return `**The connected network has changed.**`;
    }
  })();

  const contextMessage = await walletContextMessage(walletInfo);
  return `${message} Keep previous connection information in context, but recognize that it is not current.

${contextMessage.content}`;
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
      const result = await toolCallRegistry.executeToolCall(
        operationName,
        params,
        walletInfo,
        walletStore,
      );
      console.log('tool call result:', result);
      return result;
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
    // on wallet connection:
    // * add connected wallet context to existing/new chats
    // * register tool calls for the connected chain
    onWalletConnect: async (walletInfo) => {
      const msg = await walletContextMessage(walletInfo);
      // add connected wallet context to existing chat
      addPendingSystemMessage(msg.content as string);
      // ensure new chats include wallet context
      setCurrentInitialMessages([msg]);
      setWalletInfo(walletInfo);
      await registerEvmToolsWithRegistry(toolCallRegistry, walletInfo.chainId);
    },

    // on wallet disconnect:
    // * clear wallet context from existing/new chats
    // * deregister tool calls for the connected chain
    onWalletDisconnect: async (walletInfo) => {
      setCurrentInitialMessages([]);
      addPendingSystemMessage(
        '**Wallet has been disconnected.** All previous wallet information is no longer valid.',
      );
      setWalletInfo(null);
      await deregisterEvmToolsFromRegistry(
        toolCallRegistry,
        walletInfo.chainId,
      );
    },

    // on change of connected wallet:
    // * notify of connected wallet changed in context of existing/new chats
    // * deregister tool calls for the old chain
    // * register tool calls for the new connected chain
    onWalletChange: async (prevInfo, walletInfo) => {
      const content = await walletConnectionChangedMessage(
        prevInfo,
        walletInfo,
      );
      addPendingSystemMessage(content);
      const contextMsg = await walletContextMessage(walletInfo);
      setCurrentInitialMessages([contextMsg]);
      setWalletInfo(walletInfo);
      await changeChainToolCallRegistration(
        toolCallRegistry,
        walletInfo.chainId,
        prevInfo.chainId,
      );
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
