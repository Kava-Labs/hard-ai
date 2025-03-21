import { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageHistoryStore } from './stores/messageHistoryStore';
import {
  ChatMessage,
  ActiveChat,
  ConversationHistories,
  ConversationHistory,
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

    messageHistoryStore: new MessageHistoryStore(initValues),
    messageStore: new TextStreamStore(),
    progressStore: new TextStreamStore(),
    errorStore: new TextStreamStore(),
  });

  useEffect(() => {
    if (activeChat.isConversationStarted) {
      activeChats[activeChat.id] = activeChat;
    }
  }, [activeChat]);
  // **********

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
      await doChat(newActiveChat);
      setActiveChat((prev) => ({
        ...prev,
        isRequesting: false,
      }));

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
      ).catch((err) => {
        console.warn('failed to saveConversations', err);
      });
    },
    [activeChat, conversationHistories],
  );

  const handleCancel = useCallback(() => {
    activeChat.abortController.abort();
    activeChat.messageStore.setText('');
    activeChat.progressStore.setText('');
    setActiveChat((prev) => ({ ...prev, isRequesting: false }));
  }, [activeChat]);

  //  handler specific to the New Chat button
  const handleNewChat = useCallback(() => {
    setActiveChat({
      id: uuidv4(),
      isRequesting: false,
      isConversationStarted: false,
      model: initModel ? initModel : 'gpt-4o',
      abortController: new AbortController(),
      client: client,
      messageHistoryStore: new MessageHistoryStore(),
      messageStore: new TextStreamStore(),
      progressStore: new TextStreamStore(),
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

          setActiveChat((prev) => ({
            ...prev,
            id: selectedConversation.id,
            model: selectedConversation.model,
            isConversationStarted:
              Array.isArray(messages) &&
              messages.find((msg) => msg.role === 'assistant') !== undefined,
            messageHistoryStore: new MessageHistoryStore(
              messages ? messages : [],
            ),
          }));
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
    }),
    [
      activeChat,
      conversationHistories,
      handleChatCompletion,
      handleNewChat,
      handleCancel,
      onSelectConversation,
      onDeleteConversation,
      onUpdateConversationTitle,
    ],
  );
};
