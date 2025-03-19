import { useCallback, useMemo, useState } from 'react';
import { MessageHistoryStore } from './stores/messageHistoryStore';
import { ChatMessage, ActiveChat } from './types';
import { TextStreamStore } from './stores/textStreamStore';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai/index';
import type { ChatCompletionChunk } from 'openai/resources/index';

export const useChat = (initValues?: ChatMessage[], initModel?: string) => {
  const [client] = useState(() => {
    return new OpenAI({
      baseURL: import.meta.env['VITE_OPENAI_BASE_URL'],
      apiKey: `kavachat:${uuidv4()}:${uuidv4()}`,
      dangerouslyAllowBrowser: true,
    });
  });

  const [activeChat, setActiveChat] = useState<ActiveChat>({
    id: uuidv4(), // add uuid v4 for conversation id
    isRequesting: false,
    model: initModel ? initModel : 'gpt-4o',
    abortController: new AbortController(),
    client: client,

    messageHistoryStore: new MessageHistoryStore(initValues),
    messageStore: new TextStreamStore(),
    progressStore: new TextStreamStore(),
    errorStore: new TextStreamStore(),
  });

  const handleChatCompletion = useCallback(
    (newMessages: ChatMessage[]) => {
      const newActiveChat: ActiveChat = {
        ...activeChat,
        isRequesting: true,
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
      handleChatCompletion,
      handleCancel,
    }),
    [activeChat, handleChatCompletion, handleCancel],
  );
};

async function doChat(activeChat: ActiveChat) {
  activeChat.progressStore.setText('Thinking');

  try {
    const stream = await activeChat.client.chat.completions.create(
      {
        model: activeChat.id,
        messages: activeChat.messageHistoryStore.getSnapshot(),
        stream: true,
      },
      {
        signal: activeChat.abortController.signal,
      },
    );

    for await (const chunk of stream) {
      if (activeChat.progressStore.getSnapshot() !== '') {
        activeChat.progressStore.setText('');
      }

      if (isContentChunk(chunk)) {
        //  Add content from chunks that have it and not the final usage chunk if it exists
        if (
          chunk.choices.length &&
          typeof chunk['choices'][0]['delta']['content'] === 'string'
        ) {
          activeChat.messageStore.appendText(
            chunk['choices'][0]['delta']['content'],
          );
        }
      }
    }

    // Push a message
    if (activeChat.messageStore.getSnapshot() !== '') {
      const msg = {
        role: 'assistant' as const,
        content: activeChat.messageStore.getSnapshot(),
      };

      activeChat.messageHistoryStore.addMessage(msg);
      activeChat.messageStore.setText('');
    }
  } catch (e) {
    console.error(`An error occurred: ${e} `);
    activeChat.errorStore.setText(
      e instanceof Error
        ? e.message
        : `An error occurred: ${JSON.stringify(e)} `,
    );
  } finally {
    // Clear progress text if not cleared already
    if (activeChat.progressStore.getSnapshot() !== '') {
      activeChat.progressStore.setText('');
    }

    // Ensure content is published on abort
    if (activeChat.messageStore.getSnapshot() !== '') {
      activeChat.messageHistoryStore.addMessage({
        role: 'assistant' as const,
        content: activeChat.messageStore.getSnapshot(),
      });
      activeChat.messageStore.setText('');
    }
  }
}

export const isContentChunk = (result: ChatCompletionChunk): boolean => {
  //  Treat usage-only chunks as content chunks
  if (result.usage && (!result.choices || result.choices.length === 0)) {
    return true;
  }
  const delta = result.choices[0].delta;
  //  Sometimes content is an empty string, so we check if content is a string property.
  return delta && 'content' in delta && typeof delta.content === 'string';
};
