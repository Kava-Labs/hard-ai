import { useSyncExternalStore } from 'react';
import { ToolCallStreamStore } from './toolCallStreamStore';

export const useToolCallStreamStore = (store: ToolCallStreamStore) =>
  useSyncExternalStore(store.subscribe, store.getSnapShot);
