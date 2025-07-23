import React from 'react';
import { ChatMessage } from '../../types';
import { walletStore } from './walletStore';

interface WalletUpdateRef {
  isProcessing: boolean;
  previousAddress: string;
  previousChainId: string;
  pendingWalletMessage: ChatMessage | null;
}

export const useWalletState = () => {
  const walletConnection = React.useSyncExternalStore(
    walletStore.subscribe,
    walletStore.getSnapshot,
  );

  const walletUpdateRef = React.useRef<WalletUpdateRef>({
    isProcessing: false,
    previousAddress: '',
    previousChainId: '',
    pendingWalletMessage: null,
  });

  const disconnectWallet = React.useCallback(async () => {
    walletUpdateRef.current.isProcessing = true;

    walletStore.disconnectWallet();
    // TODO: system message
    // await addWalletSystemMessage();

    walletUpdateRef.current.isProcessing = false;
  }, []);

  return {
    disconnectWallet,
    walletAddress: walletConnection.walletAddress,
  };
};
