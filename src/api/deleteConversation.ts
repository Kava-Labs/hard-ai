import {
  idbDatabase,
  CONVERSATION_MESSAGES_STORE_NAME,
  CONVERSATION_STORE_NAME,
  emitStoreUpdate,
} from './idb';

export async function deleteConversation(id: string) {
  const db = await idbDatabase();
  const tx = db.transaction(
    [CONVERSATION_STORE_NAME, CONVERSATION_MESSAGES_STORE_NAME],
    'readwrite',
  );

  tx.objectStore(CONVERSATION_STORE_NAME).delete(id);
  tx.objectStore(CONVERSATION_MESSAGES_STORE_NAME).delete(id);

  return new Promise((resolve, reject) => {
    tx.addEventListener('complete', () => {
      resolve(true);
      emitStoreUpdate(
        [CONVERSATION_MESSAGES_STORE_NAME, CONVERSATION_STORE_NAME],
        'saveConversation',
        id,
      );
    });
    tx.addEventListener('error', () =>
      reject(
        new Error(`indexedDB: failed to delete conversation with id: ${id}`),
      ),
    );
  });
}
