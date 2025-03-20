import { idbDatabase, CONVERSATION_STORE_NAME } from './idb';
import type { ConversationHistory } from '../types';

export async function getAllConversations(): Promise<
  Omit<ConversationHistory, 'conversation'>[]
> {
  const db = await idbDatabase();
  const tx = db.transaction(CONVERSATION_STORE_NAME, 'readonly');
  const store = tx.objectStore(CONVERSATION_STORE_NAME);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () =>
      reject(new Error(`indexedDB: failed to fetch all conversations`)),
    );
  });
}
