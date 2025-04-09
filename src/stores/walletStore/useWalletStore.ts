import { useCallback, useSyncExternalStore } from 'react';
import { WalletStore } from './walletStore';

export const useWalletStore = (store: WalletStore) => {
  console.log('useWalletStore called with store:', store);
  const subscribe = useCallback(
    (callback: () => void) => {
      console.log('Subscribing to store');
      const unsubscribe = store.subscribe(callback);
      return () => {
        console.log('Unsubscribing from store');
        unsubscribe();
      };
    },
    [store],
  );

  const getSnapshot = useCallback(() => {
    const snapshot = store.getSnapshot();
    console.log('Getting snapshot:', snapshot);
    return snapshot;
  }, [store]);

  const state = useSyncExternalStore(subscribe, getSnapshot);
  return state;
};
