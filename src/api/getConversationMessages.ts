import { idbDatabase, CONVERSATION_MESSAGES_STORE_NAME } from './idb';
import type { ChatMessage } from '../types';

export async function getConversationMessages(
  id: string,
): Promise<ChatMessage[] | null> {
  const db = await idbDatabase();
  const tx = db.transaction(CONVERSATION_MESSAGES_STORE_NAME, 'readonly');
  const store = tx.objectStore(CONVERSATION_MESSAGES_STORE_NAME);
  const request = store.get(id);

  return new Promise((resolve, reject) => {
    request.addEventListener('success', () =>
      resolve(request.result ? request.result.messages : null),
    );
    request.addEventListener('error', () =>
      reject(
        new Error(
          `indexedDB: failed to fetch conversation messages for id: ${id}`,
        ),
      ),
    );
  });
}
