import { useCallback, useEffect, useState } from 'react';
import { MessageHistoryStore } from './stores/messageHistoryStore';
import {
  ActiveChat,
  ChatMessage,
  ConversationHistories,
  ConversationHistory,
  SearchableChatHistories,
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
import { walletStore } from './stores/walletStore';
import { defaultSystemPrompt } from './toolcalls/chain/prompts';

import { ModelId } from './types/index.ts';

export const USE_LITELLM_TOKEN =
  import.meta.env.VITE_FEAT_USE_LITELLM_TOKEN === 'true';

export function getToken() {
  if (USE_LITELLM_TOKEN) {
    // using LiteLLM service account token here is no different from a security standpoint
    // form having an unauthenticated endpoint. the benefit here is we could rotate the key
    // on deployment. When the need arises, we can implement custom auth middleware and fetch
    // the token here.
    return import.meta.env.VITE_LITELLM_API_KEY;
  }
  const clientToken = uuidv4();
  const sessionToken = uuidv4();
  return `kavachat:${clientToken}:${sessionToken}`;
}

const activeChats: Record<string, ActiveChat> = {};

export const useChat = (initValues?: ChatMessage[], initModel?: string) => {
  const [client] = useState(() => {
    return new OpenAI({
      baseURL: import.meta.env['VITE_OPENAI_BASE_URL'],
      apiKey: getToken(),
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

  const setIsOperationValidated = useCallback(
    (isOperationValidated: boolean) => {
      setActiveChat((prev) => {
        activeChats[prev.id] = { ...prev, isOperationValidated };
        return activeChats[prev.id];
      });
    },
    [],
  );

  const { executeOperation } = useExecuteToolCall(
    toolCallRegistry,
    walletStore,
    activeChat.isOperationValidated,
    setIsOperationValidated,
    // TODO: Add these back in when we have a way to open the wallet connect modal
    // openWalletConnectModal,
    // isWalletConnecting,
    // setIsWalletConnecting,
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

        // TODO: handle wallet connect system messages
        // Add the pending wallet message if it exists
        // if (walletUpdateRef.current.pendingWalletMessage) {
        //   newActiveChat.messageHistoryStore.addMessage(
        //     walletUpdateRef.current.pendingWalletMessage,
        //   );
        //   walletUpdateRef.current.pendingWalletMessage = null;
        // }
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

  // handler specific to the New Chat button
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

    // TODO: handle wallet connect system messages
    // If wallet is connected, add the info as a separate system message
    // try {
    //   walletUpdateRef.current.isProcessing = true;

    //   const walletInfo = await getCurrentWalletInfoForPrompt();

    //   if (walletInfo.isConnected && walletInfo.address) {
    //     const walletInfoMessage: ChatMessage = {
    //       role: 'system',
    //       content: `Current wallet information: Address: ${walletInfo.address} on chain ID: ${walletInfo.chainId}.
    //       Wallet type: ${walletInfo.walletType || 'Unknown'}.
    //       ${walletInfo.balancesPrompt}`,
    //     };

    //     newChat.messageHistoryStore.addMessage(walletInfoMessage);

    //     //  Update ref with current wallet info
    //     walletUpdateRef.current.previousAddress = walletInfo.address;
    //     walletUpdateRef.current.previousChainId = walletInfo.chainId;
    //   }
    // } catch (error) {
    //   console.error('Failed to add wallet info to new chat:', error);
    // } finally {
    //   walletUpdateRef.current.isProcessing = false;
    // }
  }, [initModel, client]);

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

  const changeModel = useCallback((model: ModelId) => {
    setActiveChat((prev) => ({ ...prev, model }));
  }, []);

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
    changeModel,
  };
};
