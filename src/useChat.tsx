import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageHistoryStore } from './stores/messageHistoryStore';
import {
  ActiveChat,
  ChatMessage,
  ConversationHistories,
  ConversationHistory,
  SearchableChatHistories,
  WalletInfo,
  WalletProviderDetail,
} from './types';
import {
  deleteConversation,
  getAllConversations,
  getConversationMessages,
  getSearchableHistory,
  idbEventTarget,
  saveConversation,
  TextStreamStore,
  updateConversation,
} from 'lib-kava-ai';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai/index';
import { doChat, generateConversationTitle } from './api/chat';
import { initializeToolCallRegistry } from './toolcalls/chain';
import { ToolCallStreamStore } from './stores/toolCallStreamStore';
import { useExecuteToolCall } from './useExecuteToolCall';
import {
  WalletTypes,
  EIP6963ProviderDetail,
  walletStore,
} from './stores/walletStore';
import { defaultSystemPrompt } from './toolcalls/chain/prompts';
import { useWalletStore } from './stores/walletStore/useWalletStore';
import {
  formatWalletBalancesForPrompt,
  getChainAccounts,
} from './utils/getWalletBalances';

const activeChats: Record<string, ActiveChat> = {};

interface WalletUpdateRef {
  isProcessing: boolean;
  previousAddress: string;
  previousChainId: string;
  pendingWalletMessage: ChatMessage | null;
}

export const useChat = (initValues?: ChatMessage[], initModel?: string) => {
  const [client] = useState(() => {
    return new OpenAI({
      baseURL: import.meta.env['VITE_OPENAI_BASE_URL'],
      apiKey: `kavachat:${uuidv4()}:${uuidv4()}`,
      dangerouslyAllowBrowser: true,
    });
  });

  const [conversationHistories, setConversationHistories] =
    useState<ConversationHistories | null>(null);

  // **********
  const [activeChat, setActiveChat] = useState<ActiveChat>({
    id: uuidv4(), // add uuid v4 for conversation id
    isRequesting: false,
    isConversationStarted: false,
    model: initModel ? initModel : 'gpt-4o',
    abortController: new AbortController(),
    client: client,
    isOperationValidated: false,
    toolCallStreamStore: new ToolCallStreamStore(),
    messageHistoryStore: new MessageHistoryStore(initValues),
    messageStore: new TextStreamStore(),
    errorStore: new TextStreamStore(),
  });

  // **********

  const [toolCallRegistry] = useState(() => initializeToolCallRegistry());

  const walletConnection = useWalletStore(walletStore);
  const walletAddress = walletConnection.walletAddress;

  const [availableProviders, setAvailableProviders] = useState<
    WalletProviderDetail[]
  >([]);

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);

  //  Ref to track async wallet switching and store pending wallet message
  const walletUpdateRef = useRef<WalletUpdateRef>({
    isProcessing: false,
    previousAddress: '',
    previousChainId: '',
    pendingWalletMessage: null,
  });

  const getCurrentWalletInfo = useCallback(async () => {
    const walletConnection = walletStore.getSnapshot();

    const walletInfo: WalletInfo = {
      isConnected: walletConnection.isWalletConnected,
      address: walletConnection.walletAddress,
      chainId: walletConnection.walletChainId,
      balancesPrompt: '',
    };

    if (walletInfo.isConnected && walletConnection.provider) {
      const balances = await getChainAccounts(walletConnection.provider);
      walletInfo.balancesPrompt = formatWalletBalancesForPrompt(
        balances,
        walletConnection.walletChainId,
      );
    }

    return walletInfo;
  }, []);

  const addWalletSystemMessage = useCallback(
    async (walletInfo?: WalletInfo) => {
      try {
        let messageContent = '';

        //  If no wallet info was provided, then we have been disconnected,
        //  Reset the ref
        if (!walletInfo) {
          messageContent =
            'Wallet has been disconnected. All previous wallet information is no longer valid.';
          walletUpdateRef.current.previousAddress = '';
          walletUpdateRef.current.previousChainId = '';
        } else {
          messageContent = `Wallet account changed. New address: ${walletInfo.address}... on chain ID: ${walletInfo.chainId}. Any previous wallet information is no longer valid. ${walletInfo.balancesPrompt}`;
          walletUpdateRef.current.previousAddress = walletInfo.address;
          walletUpdateRef.current.previousChainId = walletInfo.chainId;
        }

        const walletMessage: ChatMessage = {
          role: 'system',
          content: messageContent,
        };

        // If there are already messages in the store, add the wallet message directly
        if (activeChat.messageHistoryStore.getSnapshot().length > 0) {
          activeChat.messageHistoryStore.addMessage(walletMessage);
        } else {
          // Otherwise, store it in the ref to be added during handleChatCompletion
          walletUpdateRef.current.pendingWalletMessage = walletMessage;
        }
      } catch (error) {
        console.error('Failed to add wallet system message:', error);
      }
    },
    [activeChat],
  );

  const connectEIP6963Provider = useCallback(
    async (providerId: string, chainId?: string) => {
      if (walletUpdateRef.current.isProcessing) return;
      walletUpdateRef.current.isProcessing = true;

      try {
        await walletStore.connectWallet({
          chainId,
          walletType: WalletTypes.EIP6963,
          providerId,
        });

        const walletInfo = await getCurrentWalletInfo();

        //  Add a message if connection was successful
        if (walletInfo.isConnected && walletInfo.address) {
          await addWalletSystemMessage(walletInfo);
        }
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        throw error;
      } finally {
        walletUpdateRef.current.isProcessing = false;
      }
    },
    [getCurrentWalletInfo, addWalletSystemMessage],
  );

  // Watch for wallet connection changes and update system prompt accordingly
  useEffect(() => {
    if (walletUpdateRef.current.isProcessing) {
      return;
    }

    if (
      walletUpdateRef.current.previousAddress ||
      walletUpdateRef.current.previousChainId
    ) {
      const checkForWalletChanges = async () => {
        // Get the latest wallet state directly
        const currentState = walletStore.getSnapshot();

        // Address or chain changed
        if (currentState.isWalletConnected && currentState.provider) {
          const addressChanged =
            currentState.walletAddress !==
            walletUpdateRef.current.previousAddress;
          const chainChanged =
            currentState.walletChainId !==
            walletUpdateRef.current.previousChainId;

          if (addressChanged || chainChanged) {
            try {
              walletUpdateRef.current.isProcessing = true;

              const walletIfno = await getCurrentWalletInfo();
              await addWalletSystemMessage(walletIfno);
            } finally {
              walletUpdateRef.current.isProcessing = false;
            }
          }
        }
        //  Wallet was disconnected
        else if (
          !currentState.isWalletConnected &&
          walletUpdateRef.current.previousAddress.length > 0
        ) {
          try {
            walletUpdateRef.current.isProcessing = true;
            await addWalletSystemMessage();
          } finally {
            walletUpdateRef.current.isProcessing = false;
          }
        }
      };

      checkForWalletChanges();
    }
  }, [
    walletConnection.isWalletConnected,
    walletConnection.walletAddress,
    walletConnection.walletChainId,
    walletConnection.provider,
    getCurrentWalletInfo,
    addWalletSystemMessage,
  ]);

  const refreshProviders = useCallback(() => {
    setAvailableProviders(walletStore.getProviders());
  }, []);

  const openWalletConnectModal = useCallback(() => {
    refreshProviders();
    setIsWalletModalOpen(true);
  }, [refreshProviders, setIsWalletModalOpen]);

  const disconnectWallet = useCallback(async () => {
    try {
      const walletConnection = walletStore.getSnapshot();
      if (
        walletConnection.isWalletConnected &&
        walletConnection.walletAddress
      ) {
        walletStore.disconnectWallet();
        await addWalletSystemMessage();
      }
    } finally {
      walletUpdateRef.current.isProcessing = false;
    }
  }, [addWalletSystemMessage]);

  const handleProviderSelect = useCallback(
    async (provider: EIP6963ProviderDetail) => {
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
    },
    [connectEIP6963Provider],
  );

  const setIsOperationValidated = useCallback(
    (isOperationValidated: boolean) => {
      setActiveChat((prev) => {
        activeChats[prev.id] = { ...prev, isOperationValidated };
        return activeChats[prev.id];
      });
    },
    [],
  );

  const { executeOperation, handleModalClose } = useExecuteToolCall(
    toolCallRegistry,
    walletStore,
    activeChat.isOperationValidated,
    setIsOperationValidated,
    openWalletConnectModal,
    isWalletConnecting,
    setIsWalletConnecting,
  );

  const closeWalletConnectModal = useCallback(() => {
    setIsWalletModalOpen(false);
    if (handleModalClose) {
      handleModalClose();
    }
  }, [handleModalClose]);

  const onProviderSelect = useCallback(
    async (provider: WalletProviderDetail) => {
      await handleProviderSelect(provider);
      closeWalletConnectModal();
    },
    [handleProviderSelect, closeWalletConnectModal],
  );

  const fetchConversations = useCallback(() => {
    getAllConversations()
      .then((conversations) => {
        setConversationHistories(conversations);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleChatCompletion = useCallback(
    async (newMessages: ChatMessage[]) => {
      const newActiveChat: ActiveChat = {
        ...activeChat,
        isRequesting: true,
        isConversationStarted: true,
        abortController: new AbortController(),
      };

      // Update isRequesting state and create a new abortController
      setActiveChat(newActiveChat);
      activeChats[activeChat.id] = newActiveChat;

      const messages = newActiveChat.messageHistoryStore.getSnapshot();

      // Initialize with system message if needed
      if (messages.length === 0) {
        newActiveChat.messageHistoryStore.addMessage({
          role: 'system',
          content: defaultSystemPrompt,
        });

        // Add the pending wallet message if it exists
        if (walletUpdateRef.current.pendingWalletMessage) {
          newActiveChat.messageHistoryStore.addMessage(
            walletUpdateRef.current.pendingWalletMessage,
          );
          walletUpdateRef.current.pendingWalletMessage = null;
        }
      }

      // Add new messages to history
      newActiveChat.messageHistoryStore.setMessages([
        ...newActiveChat.messageHistoryStore.getSnapshot(),
        ...newMessages,
      ]);

      const defaultNewChatTitle = 'New Chat';
      // todo: sync local storage before response
      let conversation: ConversationHistory;

      if (conversationHistories && conversationHistories[activeChat.id]) {
        conversation = conversationHistories[activeChat.id];
        conversation.lastSaved = Date.now();
      } else {
        conversation = {
          id: activeChat.id,
          model: activeChat.model,
          title: defaultNewChatTitle,
          lastSaved: Date.now(),
          tokensRemaining: 1024 * 12, // todo: implement real tokens remaining
        };
      }

      try {
        await saveConversation(
          conversation,
          newActiveChat.messageHistoryStore.getSnapshot(),
        );
      } catch (err) {
        console.warn('failed to saveConversations', err);
      }

      // no need to catch
      // doChat won't throw and automatically sets errors in the activeChat's errorStore
      await doChat(newActiveChat, toolCallRegistry, executeOperation);
      setActiveChat((prev) => ({
        ...prev,
        isRequesting: false,
      }));
      activeChats[activeChat.id] = { ...newActiveChat, isRequesting: false };

      if (conversation.title === defaultNewChatTitle) {
        try {
          const title = await generateConversationTitle(activeChat);
          conversation.title = title;
        } catch (err) {
          console.warn('failed to generate a conversation title', err);
        }
      }

      saveConversation(
        conversation,
        newActiveChat.messageHistoryStore.getSnapshot(),
      )
        .catch((err) => {
          console.warn('failed to saveConversations', err);
        })
        .finally(() => {
          delete activeChats[activeChat.id];
        });
    },
    [activeChat, conversationHistories, toolCallRegistry, executeOperation],
  );

  const handleCancel = useCallback(() => {
    activeChat.abortController.abort();
    activeChat.messageStore.setText('');
    setActiveChat((prev) => ({ ...prev, isRequesting: false }));
  }, [activeChat]);

  // Handler for New Chat button
  const handleNewChat = useCallback(async () => {
    const newChatId = uuidv4();
    const newChat = {
      id: newChatId,
      isRequesting: false,
      isConversationStarted: false,
      isOperationValidated: false,
      model: initModel ? initModel : 'gpt-4o',
      abortController: new AbortController(),
      client: client,
      toolCallStreamStore: new ToolCallStreamStore(),
      messageHistoryStore: new MessageHistoryStore(),
      messageStore: new TextStreamStore(),
      errorStore: new TextStreamStore(),
    };

    // Add the default system prompt
    newChat.messageHistoryStore.addMessage({
      role: 'system',
      content: defaultSystemPrompt,
    });

    setActiveChat(newChat);

    // If wallet is connected, add the info as a separate system message
    try {
      walletUpdateRef.current.isProcessing = true;

      const walletInfo = await getCurrentWalletInfo();

      if (walletInfo.isConnected && walletInfo.address) {
        const walletInfoMessage: ChatMessage = {
          role: 'system',
          content: `Current wallet information: Address: ${walletInfo.address}... on chain ID: ${walletInfo.chainId}. ${walletInfo.balancesPrompt}`,
        };

        newChat.messageHistoryStore.addMessage(walletInfoMessage);

        //  Update ref with current wallet info
        walletUpdateRef.current.previousAddress = walletInfo.address;
        walletUpdateRef.current.previousChainId = walletInfo.chainId;
      }
    } catch (error) {
      console.error('Failed to add wallet info to new chat:', error);
    } finally {
      walletUpdateRef.current.isProcessing = false;
    }
  }, [initModel, client, getCurrentWalletInfo]);

  const onSelectConversation = useCallback(
    async (id: string) => {
      // already selected
      if (id === activeChat.id || !conversationHistories) return;

      if (activeChats[id]) {
        setActiveChat(activeChats[id]);
      } else {
        const selectedConversation = conversationHistories[id];
        if (selectedConversation) {
          const messages = await getConversationMessages(id);
          const newActiveChat: ActiveChat = {
            id: selectedConversation.id,
            model: selectedConversation.model,
            isOperationValidated: false,
            isRequesting: false,
            isConversationStarted:
              Array.isArray(messages) &&
              messages.some((msg) => msg.role === 'assistant'),
            messageHistoryStore: new MessageHistoryStore(messages ?? []),
            toolCallStreamStore: new ToolCallStreamStore(),
            errorStore: new TextStreamStore(),
            messageStore: new TextStreamStore(),
            client: activeChat.client,
            abortController: new AbortController(),
          };

          setActiveChat(newActiveChat);
        }
      }
    },
    [conversationHistories, activeChat],
  );

  const onDeleteConversation = useCallback(
    async (id: string) => {
      await deleteConversation(id);
      delete activeChats[id];
      if (id === activeChat.id) {
        await handleNewChat();
      }
    },
    [activeChat, handleNewChat],
  );

  const onUpdateConversationTitle = useCallback(
    async (id: string, newTitle: string) => {
      await updateConversation(id, { title: newTitle });
    },
    [],
  );

  const [searchableHistory, setSearchableHistory] =
    useState<SearchableChatHistories | null>(null);

  const fetchSearchHistory = async () => {
    try {
      const history = await getSearchableHistory();
      setSearchableHistory(history);
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  useEffect(() => {
    idbEventTarget.addEventListener('indexeddb-update', (_event: Event) => {
      // const { stores, operation, id } = (_event as CustomEvent).detail;
      // console.log(
      //   `Store Updated: ${stores}, Operation: ${operation}, ID: ${id}`,
      // );
      fetchConversations();
    });
  }, [fetchConversations]);

  return useMemo(() => {
    const walletProviderInfo =
      walletConnection.isWalletConnected && walletConnection.rdns
        ? availableProviders.find((p) => p.info.rdns === walletConnection.rdns)
            ?.info
        : undefined;
    return {
      activeChat,
      conversationHistories,
      handleNewChat,
      handleChatCompletion,
      handleCancel,
      onSelectConversation,
      onDeleteConversation,
      onUpdateConversationTitle,
      searchableHistory,
      fetchSearchHistory,
      toolCallRegistry,
      walletAddress,
      handleProviderSelect,
      disconnectWallet,
      availableProviders,
      walletProviderInfo,
      isWalletModalOpen,
      openWalletConnectModal,
      closeWalletConnectModal,
      onProviderSelect,
    };
  }, [
    walletConnection.isWalletConnected,
    walletConnection.rdns,
    availableProviders,
    activeChat,
    conversationHistories,
    handleNewChat,
    handleChatCompletion,
    handleCancel,
    onSelectConversation,
    onDeleteConversation,
    onUpdateConversationTitle,
    searchableHistory,
    toolCallRegistry,
    walletAddress,
    handleProviderSelect,
    disconnectWallet,
    isWalletModalOpen,
    openWalletConnectModal,
    closeWalletConnectModal,
    onProviderSelect,
  ]);
};
