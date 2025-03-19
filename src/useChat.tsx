import { useMemo, useState } from 'react';
import { MessageHistoryStore } from './stores/messageHistoryStore';
import { ChatMessage } from './types';
import { TextStreamStore } from './stores/textStreamStore';
import { v4 as uuidv4 } from 'uuid';

export const useChat = (initValues?: ChatMessage[]) => {
  const [activeChat, setActiveChat] = useState({
    id: uuidv4(), // add uuid v4 for conversation id
    isRequesting: false,

    messageHistoryStore: new MessageHistoryStore(initValues),
    messageStore: new TextStreamStore(),
    progressStore: new TextStreamStore(),
    errorStore: new TextStreamStore(),
  });

  return useMemo(
    () => ({
      activeChat,
    }),
    [activeChat],
  );
};
