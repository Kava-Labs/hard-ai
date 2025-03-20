import { idbDatabase, CONVERSATION_STORE_NAME } from './idb';
import type { ConversationHistory } from '../types';

export async function getConversation(
  id: string,
): Promise<Omit<ConversationHistory, 'conversation'> | null> {
  const db = await idbDatabase();
  const tx = db.transaction(CONVERSATION_STORE_NAME, 'readonly');
  const store = tx.objectStore(CONVERSATION_STORE_NAME);
  const request = store.get(id);

  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result || null));
    request.addEventListener('error', () =>
      reject(
        new Error(
          `indexedDB: failed to fetch conversation metadata for id: ${id}`,
        ),
      ),
    );
  });
}
