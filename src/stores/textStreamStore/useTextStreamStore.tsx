import { useSyncExternalStore } from 'react';
import { TextStreamStore } from './textStreamStore';

export const useTextStreamStore = (store: TextStreamStore) => {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
};
