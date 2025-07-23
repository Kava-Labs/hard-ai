import React from 'react';
import { ChatMessage, WalletInfo, WalletProviderDetail } from '../../types';
import { EIP6963ProviderDetail, WalletProvider, walletStore } from './walletStore';
import {
  formatWalletBalancesForPrompt,
  getChainAccounts,
} from '../../utils/wallet';

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

  // Wallet providers //////////////////////////////

  const [availableProviders, setAvailableProviders] = React.useState<
    WalletProviderDetail[]
  >([]);

  const refreshProviders = React.useCallback(() => {
    setAvailableProviders(walletStore.getProviders());
  }, []);

  const getCurrentWalletInfoForPrompt = React.useCallback(async () => {
    const walletConnection = walletStore.getSnapshot();

    const walletInfo: WalletInfo = {
      isConnected: walletConnection.isWalletConnected,
      address: walletConnection.walletAddress,
      chainId: walletConnection.walletChainId,
      balancesPrompt: '',
      walletType: walletConnection.walletType,
    };

    if (walletInfo.isConnected && walletConnection.provider) {
      const balances = await getChainAccounts(walletConnection.provider);
      walletInfo.balancesPrompt = formatWalletBalancesForPrompt(
        balances,
        walletConnection.walletChainId,
      );
    }

    return walletInfo;
  }, []);

  const connectEIP6963Provider = React.useCallback(
    async (rdns: string, chainId?: string) => {
      if (walletUpdateRef.current.isProcessing) return;
      walletUpdateRef.current.isProcessing = true;

      try {
        await walletStore.connectWallet({
          chainId,
          walletProvider: WalletProvider.EIP6963,
          rdns,
        });

        const walletInfo = await getCurrentWalletInfoForPrompt();

        // TODO: Add a message if connection was successful
        // if (walletInfo.isConnected && walletInfo.address) {
        //   await addWalletSystemMessage(walletInfo);
        // }
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        throw error;
      } finally {
        walletUpdateRef.current.isProcessing = false;
      }
    },
    [getCurrentWalletInfoForPrompt],
  );

  const handleProviderSelect = React.useCallback(
    async (provider: EIP6963ProviderDetail) => {
      try {
        await connectEIP6963Provider(
          provider.info.rdns,
          `0x${Number(2222).toString(16)}`,
        );
      } catch (err) {
        console.error(
          `Failed to connect to ${provider.info.name}: ${(err as Error).message}`,
        );
      }
    },
    [connectEIP6963Provider],
  );

  return {
    disconnectWallet,
    walletAddress: walletConnection.walletAddress,
    availableProviders,
    refreshProviders,
    handleProviderSelect,
  };
};
