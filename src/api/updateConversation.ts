import { idbDatabase, CONVERSATION_STORE_NAME, emitStoreUpdate } from './idb';
import type { ConversationHistory } from '../types';

export async function updateConversation(
  id: string,
  updates: Partial<ConversationHistory>,
) {
  const db = await idbDatabase();
  const tx = db.transaction(CONVERSATION_STORE_NAME, 'readwrite');
  const store = tx.objectStore(CONVERSATION_STORE_NAME);
  const request = store.get(id);

  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => {
      if (!request.result) return resolve(null);

      const updatedData = { ...request.result, ...updates };
      store.put(updatedData);

      tx.addEventListener('complete', () => {
        resolve(true);
        emitStoreUpdate([CONVERSATION_STORE_NAME], 'saveConversation', id);
      });
    });

    request.addEventListener('error', () =>
      reject(new Error(`indexedDB: failed to update conversation metadata`)),
    );
  });
}
