import {
  idbDatabase,
  CONVERSATION_MESSAGES_STORE_NAME,
  CONVERSATION_STORE_NAME,
  emitStoreUpdate,
} from './idb';
import type { ChatMessage, ConversationHistory } from '../types';

export async function saveConversation(
  conversation: ConversationHistory,
  messages: ChatMessage[],
): Promise<string> {
  const db = await idbDatabase();

  const tx = db.transaction(
    [CONVERSATION_STORE_NAME, CONVERSATION_MESSAGES_STORE_NAME],
    'readwrite',
  );
  const conversationStore = tx.objectStore(CONVERSATION_STORE_NAME);
  const messagesStore = tx.objectStore(CONVERSATION_MESSAGES_STORE_NAME);

  // Store metadata
  const conversationSaveRequest = conversationStore.put({
    id: conversation.id,
    model: conversation.model,
    title: conversation.title,
    lastSaved: conversation.lastSaved,
    tokensRemaining: conversation.tokensRemaining,
  });

  // Store messages separately
  const messagesSaveRequest = messagesStore.put({
    id: conversation.id,
    messages,
  });

  return new Promise((resolve, reject) => {
    let conversationSaved = false;
    let messagesSaved = false;

    tx.addEventListener('complete', () => {
      if (conversationSaved && messagesSaved) {
        resolve(conversation.id);
        emitStoreUpdate(
          [CONVERSATION_MESSAGES_STORE_NAME, CONVERSATION_STORE_NAME],
          'saveConversation',
          conversation.id,
        );
      } else {
        reject(new Error(`indexedDB: request to save conversation failed`));
      }
    });

    tx.addEventListener('error', () => {
      reject(new Error(`indexedDB: transaction to save conversation failed`));
    });

    conversationSaveRequest.addEventListener('success', () => {
      conversationSaved = true;
    });

    conversationSaveRequest.addEventListener('error', () => {
      reject(new Error(`indexedDB: request to save conversation failed`));
    });

    messagesSaveRequest.addEventListener('success', () => {
      messagesSaved = true;
    });

    messagesSaveRequest.addEventListener('error', () => {
      reject(
        new Error(`indexedDB: request to save conversation messages failed`),
      );
    });
  });
}
