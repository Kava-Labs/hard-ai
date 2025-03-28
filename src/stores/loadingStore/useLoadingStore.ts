import { useSyncExternalStore } from 'react';
import { LoadingStore } from './loadingStore';

export const useLoadingStore = (store: LoadingStore) => {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
};
