import React from 'react';
import { ChatMessage, WalletInfo, WalletProviderDetail } from '../../types';
import {
  EIP6963ProviderDetail,
  WalletProvider,
  walletStore,
} from './walletStore';
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

  // const addWalletSystemMessage = useCallback(
  //   async (walletInfo?: WalletInfo) => {
  //     try {
  //       let messageContent = '';

  //       //  If no wallet info was provided, then we have been disconnected,
  //       //  Reset the ref
  //       if (!walletInfo) {
  //         messageContent =
  //           'Wallet has been disconnected. All previous wallet information is no longer valid.';
  //         walletUpdateRef.current.previousAddress = '';
  //         walletUpdateRef.current.previousChainId = '';
  //       } else if (
  //         walletInfo.address === walletUpdateRef.current.previousAddress &&
  //         walletInfo.chainId === walletUpdateRef.current.previousChainId
  //       ) {
  //         return;
  //       } else {
  //         messageContent = `Wallet account changed. New address: ${walletInfo.address} on chain ID: ${walletInfo.chainId}.
  //       Wallet type: ${walletInfo.walletType}.
  //       Keep previous wallet information in context, but recognize that it is not current. ${walletInfo.balancesPrompt}`;

  //         walletUpdateRef.current.previousAddress = walletInfo.address;
  //         walletUpdateRef.current.previousChainId = walletInfo.chainId;
  //       }

  //       const walletMessage: ChatMessage = {
  //         role: 'system',
  //         content: messageContent,
  //       };

  //       //  If the conversation has already started, add the wallet message
  //       if (activeChat.messageHistoryStore.getSnapshot().length > 0) {
  //         activeChat.messageHistoryStore.addMessage(walletMessage);
  //       } else {
  //         //  Otherwise, store it in the ref to be added during handleChatCompletion
  //         //  after the initial system prompt (so as not to override it)
  //         walletUpdateRef.current.pendingWalletMessage = walletMessage;
  //       }
  //     } catch (error) {
  //       console.error('Failed to add wallet system message:', error);
  //     }
  //   },
  //   [activeChat],)
  // );

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

  //  Subscribe to wallet connection changes and update system prompt accordingly
  React.useEffect(() => {
    //  Only proceed if we're not already processing an update
    if (walletUpdateRef.current.isProcessing) {
      return;
    }

    //  Set up subscription for wallet changes
    const unsubscribe = walletStore.subscribe(async () => {
      const currentState = walletStore.getSnapshot();

      //  Only process if we're not already handling a wallet update
      if (walletUpdateRef.current.isProcessing) {
        return;
      }

      try {
        if (
          walletUpdateRef.current.previousAddress ||
          walletUpdateRef.current.previousChainId
        ) {
          if (currentState.isWalletConnected && currentState.provider) {
            const addressChanged =
              currentState.walletAddress !==
              walletUpdateRef.current.previousAddress;
            const chainChanged =
              currentState.walletChainId !==
              walletUpdateRef.current.previousChainId;

            if (addressChanged || chainChanged) {
              walletUpdateRef.current.isProcessing = true;
              const walletInfo = await getCurrentWalletInfoForPrompt();
              // await addWalletSystemMessage(walletInfo);
            }
          }
          // Wallet was disconnected from outside our UI and disconnectWallet()
          // wasn't called (which would have set isProcessing=true)
          else if (
            !currentState.isWalletConnected &&
            walletUpdateRef.current.previousAddress.length > 0
          ) {
            walletUpdateRef.current.isProcessing = true;
            // await addWalletSystemMessage();
          }
        }
      } finally {
        walletUpdateRef.current.isProcessing = false;
      }
    });

    //  Clean up subscription
    return () => unsubscribe();
  }, [getCurrentWalletInfoForPrompt]);

  return {
    disconnectWallet,
    walletAddress: walletConnection.walletAddress,
    availableProviders,
    refreshProviders,
    handleProviderSelect,
    walletProviderInfo,
  };
};
