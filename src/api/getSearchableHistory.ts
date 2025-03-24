import { SearchableChatHistories } from '../types';
import {
  CONVERSATION_MESSAGES_STORE_NAME,
  CONVERSATION_STORE_NAME,
  idbDatabase,
} from './idb';
import { mergeTitleAndMessages } from './mergeTitleAndMessages';

export async function getSearchableHistory(): Promise<SearchableChatHistories | null> {
  const db = await idbDatabase();

  const txMessages = db.transaction(
    CONVERSATION_MESSAGES_STORE_NAME,
    'readonly',
  );
  const txConversations = db.transaction(CONVERSATION_STORE_NAME, 'readonly');

  const storeMessages = txMessages.objectStore(
    CONVERSATION_MESSAGES_STORE_NAME,
  );
  const storeConversations = txConversations.objectStore(
    CONVERSATION_STORE_NAME,
  );

  const messagesRequest = storeMessages.getAll();
  const conversationsRequest = storeConversations.getAll();

  return new Promise((resolve, reject) => {
    messagesRequest.addEventListener('success', () => {
      conversationsRequest.addEventListener('success', () => {
        if (messagesRequest.result && conversationsRequest.result) {
          resolve(
            mergeTitleAndMessages(
              messagesRequest.result,
              conversationsRequest.result,
            ),
          );
        } else {
          resolve(null);
        }
      });
    });
    messagesRequest.addEventListener('error', () =>
      reject(new Error('indexedDB: failed to fetch all conversation messages')),
    );
    conversationsRequest.addEventListener('error', () =>
      reject(new Error('indexedDB: failed to fetch all conversations')),
    );
  });
}
