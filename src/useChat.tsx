import { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageHistoryStore } from './stores/messageHistoryStore';
import {
  ChatMessage,
  ActiveChat,
  ConversationHistories,
  ConversationHistory,
  SearchableChatHistories,
} from './types';
import { TextStreamStore } from './stores/textStreamStore';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai/index';
import { doChat, generateConversationTitle } from './api/chat';
import { idbEventTarget } from './api/idb';
import { getConversationMessages } from './api/getConversationMessages';
import { deleteConversation } from './api/deleteConversation';
import { updateConversation } from './api/updateConversation';
import { getAllConversations } from './api/getAllConversations';
import { saveConversation } from './api/saveConversation';
import { initializeToolCallRegistry } from './toolcalls/chain';
import { ToolCallStreamStore } from './stores/toolCallStreamStore';
import { useExecuteToolCall } from './useExecuteToolCall';
import { WalletStore } from './stores/walletStore';
import { getSearchableHistory } from './api/getSearchableHistory';

const activeChats: Record<string, ActiveChat> = {};

export const useChat = (initValues?: ChatMessage[], initModel?: string) => {
  const [client] = useState(() => {
    return new OpenAI({
      baseURL: import.meta.env['VITE_OPENAI_BASE_URL'],
      apiKey: `kavachat:${uuidv4()}:${uuidv4()}`,
      dangerouslyAllowBrowser: true,
    });
  });

  const [conversationHistories, setConversationHistories] =
    useState<ConversationHistories>({});

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

  const [walletStore] = useState(() => new WalletStore());

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
      // update isRequesting state and create a new abortController
      setActiveChat(newActiveChat);
      activeChats[activeChat.id] = newActiveChat;
      // add new messages to history
      newActiveChat.messageHistoryStore.setMessages([
        ...newActiveChat.messageHistoryStore.getSnapshot(),
        ...newMessages,
      ]);

      const defaultNewChatTitle = 'New Chat';
      // todo: sync local storage before response
      let conversation: ConversationHistory;

      if (conversationHistories[activeChat.id]) {
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

  //  handler specific to the New Chat button
  const handleNewChat = useCallback(() => {
    setActiveChat({
      id: uuidv4(),
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
    });
  }, [initModel, client]);

  const onSelectConversation = useCallback(
    async (id: string) => {
      // already selected
      if (id === activeChat.id) return;

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
        handleNewChat();
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

  return useMemo(
    () => ({
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
    }),
    [
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
    ],
  );
};
