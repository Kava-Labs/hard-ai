import { useSyncExternalStore } from 'react';
import { ProcessingStore } from './processingStore';

export const useProcessingStore = (store: ProcessingStore) => {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
};
