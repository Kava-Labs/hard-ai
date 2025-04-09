import { useSyncExternalStore } from 'react';
import { WalletStore } from './walletStore';

export const useWalletStore = (store: WalletStore) => {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
};
