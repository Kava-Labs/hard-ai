import {
  ConversationHistories,
  ConversationHistory,
  deleteConversation as doDeleteConversation,
  saveConversation as doSaveConversation,
  getAllConversations,
  getConversationMessages,
  getSearchableHistory,
  idbEventTarget,
  TextStreamStore,
  updateConversation,
} from 'lib-kava-ai';
import OpenAI from 'openai/index';
import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { doChat, generateConversationTitle } from './api/chat.ts';
import { useGlobalChatState } from './components/chat/useGlobalChatState.ts';
import { MessageHistoryStore } from './stores/messageHistoryStore/index.ts';
import { ToolCallStreamStore } from './stores/toolCallStreamStore/index.ts';
import { ToolResultStore } from './stores/toolResultStore';
import { UsageStore } from './stores/usageStore/index.ts';
import { ToolCallRegistry } from './toolcalls/chain/index.ts';
import { defaultSystemPrompt } from './toolcalls/chain/prompts.ts';
import { ActiveChat, ChatMessage, SearchableChatHistories } from './types.ts';
import { ModelId, MODELS } from './types/index.ts';

export const USE_LITELLM_TOKEN =
  import.meta.env.VITE_FEAT_USE_LITELLM_TOKEN === 'true';
export const DEFAULT_MODEL = MODELS[0].id;

export function getToken() {
  if (USE_LITELLM_TOKEN) {
    // using LiteLLM service account token here is no different from a security standpoint
    // from having an unauthenticated endpoint. the benefit here is we could rotate the key
    // on deployment. When the need arises, we can implement custom auth middleware and fetch
    // the token here.
    return import.meta.env.VITE_LITELLM_API_KEY;
  }
  const clientToken = uuidv4();
  const sessionToken = uuidv4();
  return `kavachat:${clientToken}:${sessionToken}`;
}

const activeChats: Record<string, ActiveChat> = {};

interface UseChatOptions {
  toolCallRegistry: ToolCallRegistry<unknown>;
  executeToolCall: (operationName: string, params: unknown) => Promise<string>;
  /** initial messages to add to the chat (after the system prompt) */
  initialMessages?: ChatMessage[];
}

export const useChat = ({
  toolCallRegistry,
  executeToolCall,
  initialMessages = [],
}: UseChatOptions) => {
  const { customSystemPrompt, enableCustomSystemPrompt } = useGlobalChatState();
  const [client] = useState(() => {
    return new OpenAI({
      baseURL: import.meta.env['VITE_OPENAI_BASE_URL'],
      apiKey: getToken(),
      dangerouslyAllowBrowser: true,
    });
  });

  const [conversationHistories, setConversationHistories] =
    useState<ConversationHistories | null>(null);

  const [pendingSystemMessage, setPendingSystemMessage] = useState<
    string | null
  >(null);

  const [toolResultStore] = useState(() => new ToolResultStore());

  const [activeChat, setActiveChat] = useState<ActiveChat>({
    id: uuidv4(), // add uuid v4 for conversation id
    isRequesting: false,
    isConversationStarted: false,
    model: DEFAULT_MODEL,
    abortController: new AbortController(),
    client: client,
    isOperationValidated: false,
    toolCallStreamStore: new ToolCallStreamStore(),
    messageHistoryStore: new MessageHistoryStore(),
    messageStore: new TextStreamStore(),
    errorStore: new TextStreamStore(),
    usageStore: new UsageStore(),
  });

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

  const addPendingSystemMessage = useCallback((content: string) => {
    setPendingSystemMessage(content);
  }, []);

  const handleChatCompletion = useCallback(
    async (newMessages: ChatMessage[]) => {
      const newActiveChat: ActiveChat = {
        ...activeChat,
        isRequesting: true,
        isConversationStarted: true,
        isOperationValidated: false,
        abortController: new AbortController(),
      };

      // Update isRequesting state and create a new abortController
      setActiveChat(newActiveChat);
      activeChats[activeChat.id] = newActiveChat;

      const messages = newActiveChat.messageHistoryStore.getSnapshot();

      // Initialize with system prompt and initial messages if needed
      if (messages.length === 0) {
        // Add default system prompt
        newActiveChat.messageHistoryStore.addMessage({
          role: 'system',
          content: enableCustomSystemPrompt
            ? customSystemPrompt
            : defaultSystemPrompt,
        });

        // Add initial messages if provided
        for (const message of initialMessages) {
          newActiveChat.messageHistoryStore.addMessage(message);
        }
        // if we're starting a new chat, we do not add the pending system message
        setPendingSystemMessage(null);
      } else if (pendingSystemMessage) {
        newActiveChat.messageHistoryStore.addMessage({
          role: 'system',
          content: pendingSystemMessage,
        });
        setPendingSystemMessage(null);
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
          completionTokens: 0,
          promptTokens: 0,
        };
      }

      try {
        await doSaveConversation(
          conversation,
          newActiveChat.messageHistoryStore.getSnapshot(),
        );
      } catch (err) {
        console.warn('failed to saveConversations', err);
      }

      // no need to catch
      // doChat won't throw and automatically sets errors in the activeChat's errorStore
      await doChat(
        newActiveChat,
        toolCallRegistry,
        executeToolCall,
        toolResultStore,
      );

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

      // Update token counts from usage store
      const usage = newActiveChat.usageStore.getSnapshot();
      conversation.promptTokens = usage.promptTokens;
      conversation.completionTokens = usage.completionTokens;

      console.log(`Saving conversation: ${JSON.stringify(conversation)}`);

      doSaveConversation(
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
    [
      activeChat,
      pendingSystemMessage,
      conversationHistories,
      toolCallRegistry,
      executeToolCall,
      toolResultStore,
      enableCustomSystemPrompt,
      customSystemPrompt,
      initialMessages,
    ],
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
      model: DEFAULT_MODEL,
      abortController: new AbortController(),
      client: client,
      toolCallStreamStore: new ToolCallStreamStore(),
      messageHistoryStore: new MessageHistoryStore(),
      messageStore: new TextStreamStore(),
      errorStore: new TextStreamStore(),
      usageStore: new UsageStore(),
    };

    // System prompt and any initial messages will be added once the first message is sent

    setActiveChat(newChat);
  }, [client]);

  const selectConversation = useCallback(
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
            isRequesting: false,
            isOperationValidated: false,
            isConversationStarted:
              Array.isArray(messages) &&
              messages.some((msg) => msg.role === 'assistant'),
            messageHistoryStore: new MessageHistoryStore(messages ?? []),
            toolCallStreamStore: new ToolCallStreamStore(),
            errorStore: new TextStreamStore(),
            messageStore: new TextStreamStore(),
            client: activeChat.client,
            abortController: new AbortController(),
            usageStore: new UsageStore({
              promptTokens: selectedConversation.promptTokens,
              completionTokens: selectedConversation.completionTokens,
              totalTokens:
                selectedConversation.promptTokens +
                selectedConversation.completionTokens,
            }),
          };

          setActiveChat(newActiveChat);
        }
      }
    },
    [conversationHistories, activeChat],
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      await doDeleteConversation(id);
      delete activeChats[id];
      if (id === activeChat.id) {
        await handleNewChat();
      }
    },
    [activeChat, handleNewChat],
  );

  const updateConversationTitle = useCallback(
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
    selectConversation: selectConversation,
    deleteConversation: deleteConversation,
    updateConversationTitle: updateConversationTitle,
    searchableHistory,
    fetchSearchHistory,
    changeModel,
    addPendingSystemMessage,
    toolResultStore,
  };
};
