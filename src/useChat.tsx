import { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageHistoryStore } from './stores/messageHistoryStore';
import { ChatMessage, ActiveChat, ConversationHistory } from './types';
import { TextStreamStore } from './stores/textStreamStore';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai/index';
import { doChat } from './api/chat';

export const useChat = (initValues?: ChatMessage[], initModel?: string) => {
  const [client] = useState(() => {
    return new OpenAI({
      baseURL: import.meta.env['VITE_OPENAI_BASE_URL'],
      apiKey: `kavachat:${uuidv4()}:${uuidv4()}`,
      dangerouslyAllowBrowser: true,
    });
  });

  const [savedConversations, setSavedConversations] = useState<
    ConversationHistory[]
  >([]);

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
    const id = setInterval(() => {
      setSavedConversations((prev) => {
        const storedConversations =
          localStorage.getItem('conversations') ?? '{}';
        if (JSON.stringify(prev) !== storedConversations) {
          return JSON.parse(storedConversations);
        }
        return prev;
      });
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, []);

  const handleChatCompletion = useCallback(
    (newMessages: ChatMessage[]) => {
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

      // todo: sync local storage before response

      // no need to .catch
      // doChat won't throw and automatically sets errors in the activeChat's errorStore
      doChat(newActiveChat).finally(() => {
        setActiveChat((prev) => ({
          ...prev,
          isRequesting: false,
        }));
        // todo: sync local storage after response
      });
    },
    [activeChat],
  );

  const handleCancel = useCallback(() => {
    activeChat.abortController.abort();
    activeChat.messageStore.setText('');
    activeChat.progressStore.setText('');
    setActiveChat((prev) => ({ ...prev, isRequesting: false }));
  }, [activeChat]);

  return useMemo(
    () => ({
      activeChat,
      savedConversations,

      handleChatCompletion,
      handleCancel,
    }),
    [activeChat, savedConversations, handleChatCompletion, handleCancel],
  );
};
