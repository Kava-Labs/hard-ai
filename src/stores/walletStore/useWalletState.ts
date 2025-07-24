import React from 'react';
import { WalletInfo, WalletProviderDetail } from '../../types';
import {
  EIP6963ProviderDetail,
  WalletProvider,
  walletStore,
} from './walletStore';
import {
  formatWalletBalancesForPrompt,
  getChainAccounts,
} from '../../utils/wallet';

interface UseWalletStateOptions {
  /**
   * Optional callback that is called when a wallet is initially connected.
   *
   * @param walletInfo - The newly connected wallet information
   */
  onWalletConnect?: (walletInfo: WalletInfo) => void;

  /**
   * Optional callback that is called when a wallet is disconnected.
   *
   * @param walletInfo - The previously connected wallet information
   */
  onWalletDisconnect?: (walletInfo: WalletInfo) => void;

  /**
   * Optional callback that is called when a wallet account or chain changes.
   *
   * @param prevInfo - Previous wallet information
   * @param newInfo - New wallet information
   */
  onWalletChange?: (prevInfo: WalletInfo, newInfo: WalletInfo) => void;
}

export const useWalletState = (options: UseWalletStateOptions = {}) => {
  const { onWalletConnect, onWalletDisconnect, onWalletChange } = options;

  const walletConnection = React.useSyncExternalStore(
    walletStore.subscribe,
    walletStore.getSnapshot,
  );

  // Store previous wallet info for comparison
  const previousWalletInfoRef = React.useRef<WalletInfo | null>(null);

  const disconnectWallet = React.useCallback(async () => {
    const previousWalletInfo = previousWalletInfoRef.current;

    walletStore.disconnectWallet();

    // Call the callback for disconnection
    if (onWalletDisconnect && previousWalletInfo) {
      onWalletDisconnect(previousWalletInfo);
      previousWalletInfoRef.current = null;
    }
  }, [onWalletDisconnect]);

  // Wallet providers //////////////////////////////
  const [availableProviders, setAvailableProviders] = React.useState<
    WalletProviderDetail[]
  >(walletStore.getProviders());

  const walletProviderInfo = React.useMemo(() => {
    return walletConnection.isWalletConnected && walletConnection.rdns
      ? availableProviders.find((p) => p.info.rdns === walletConnection.rdns)
          ?.info
      : undefined;
  }, [
    availableProviders,
    walletConnection.isWalletConnected,
    walletConnection.rdns,
  ]);

  const refreshProviders = React.useCallback(() => {
    setAvailableProviders(walletStore.getProviders());
  }, []);

  const getCurrentWalletInfoForPrompt = React.useCallback(async () => {
    const walletConnection = walletStore.getSnapshot();

    // If wallet is not connected, return null
    if (!walletConnection.isWalletConnected) {
      return null;
    }

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
      try {
        await walletStore.connectWallet({
          chainId,
          walletProvider: WalletProvider.EIP6963,
          rdns,
        });

        const walletInfo = await getCurrentWalletInfoForPrompt();

        // Call the callback for connection
        if (onWalletConnect && walletInfo) {
          onWalletConnect(walletInfo);
          previousWalletInfoRef.current = walletInfo;
        }
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        throw error;
      }
    },
    [getCurrentWalletInfoForPrompt, onWalletConnect],
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

  //  Subscribe to wallet connection changes and update system prompt accordingly
  React.useEffect(() => {
    //  Set up subscription for wallet changes
    const unsubscribe = walletStore.subscribe(async () => {
      const currentWalletInfo = await getCurrentWalletInfoForPrompt();
      const previousWalletInfo = previousWalletInfoRef.current;

      // Determine wallet state change type and handle callbacks
      const handleWalletStateChange = () => {
        const hasPreviousWallet = previousWalletInfo !== null;
        const hasCurrentWallet = currentWalletInfo !== null;

        // Initial connection: no previous wallet, but has current wallet
        if (!hasPreviousWallet && hasCurrentWallet && onWalletConnect) {
          // walletUpdateRef.current.isProcessing = true;
          onWalletConnect(currentWalletInfo);
          previousWalletInfoRef.current = currentWalletInfo;
          return;
        }

        // Disconnection: had previous wallet, but no current wallet
        if (hasPreviousWallet && !hasCurrentWallet && onWalletDisconnect) {
          onWalletDisconnect(previousWalletInfo);
          previousWalletInfoRef.current = null;
          return;
        }

        // Wallet change: both wallets exist but details changed
        if (hasPreviousWallet && hasCurrentWallet && onWalletChange) {
          const addressChanged =
            previousWalletInfo.address !== currentWalletInfo.address;
          const chainChanged =
            previousWalletInfo.chainId !== currentWalletInfo.chainId;

          if (addressChanged || chainChanged) {
            onWalletChange(previousWalletInfo, currentWalletInfo);
            previousWalletInfoRef.current = currentWalletInfo;
          }
        }
      };

      handleWalletStateChange();
    });

    //  Clean up subscription
    return () => unsubscribe();
  }, [
    getCurrentWalletInfoForPrompt,
    onWalletConnect,
    onWalletDisconnect,
    onWalletChange,
  ]);

  return {
    disconnectWallet,
    walletAddress: walletConnection.walletAddress,
    availableProviders,
    refreshProviders,
    handleProviderSelect,
    walletProviderInfo,
  };
};
