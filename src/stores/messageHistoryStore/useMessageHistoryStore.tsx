import { useSyncExternalStore } from 'react';
import { MessageHistoryStore } from './messageHistoryStore';

export const useMessageHistoryStore = (store: MessageHistoryStore) => {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
};
