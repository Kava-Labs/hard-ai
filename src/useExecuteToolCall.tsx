import { useCallback, useRef } from 'react';
import { WalletStore, WalletTypes } from './stores/walletStore';
import {
  ChainNames,
  chainNameToolCallParam,
  chainRegistry,
  CosmosChainConfig,
  ChainType,
  ChainToolCallMessage,
  ChainToolCallQuery,
  ToolCallRegistry,
  ChainToolCallOperation,
} from './toolcalls/chain';

export const useExecuteToolCall = (
  registry: ToolCallRegistry<unknown>,
  walletStore: WalletStore,
  isOperationValidated: boolean,
  setIsOperationValidated: (isOperationValidated: boolean) => void,
  openWalletConnectModal: () => void,
  isWalletConnecting: boolean,
  setIsWalletConnecting: (isWalletConnecting: boolean) => void,
) => {
  //  Reference to track connection promise state
  const connectionRef = useRef<{
    pendingReject: ((reason?: Error) => void) | null;
    cleanupFn: (() => void) | null;
  }>({
    pendingReject: null,
    cleanupFn: null,
  });

  const handleModalClose = useCallback(() => {
    //  Only reject if we're in the connecting state and have a rejection function
    if (isWalletConnecting && connectionRef.current.pendingReject) {
      if (connectionRef.current.cleanupFn) {
        connectionRef.current.cleanupFn();
        connectionRef.current.cleanupFn = null;
      }

      connectionRef.current.pendingReject(
        new Error('Wallet connection rejected by user'),
      );
      connectionRef.current.pendingReject = null;

      setIsWalletConnecting(false);
    }
  }, [isWalletConnecting, setIsWalletConnecting]);

  /**
   * Helper function to complete the operation after wallet connection is established
   */
  const completeOperation = useCallback(
    async (
      operation: ChainToolCallOperation<unknown>,
      params: unknown,
      chainName: string,
      chainId: string,
      walletStore: WalletStore,
    ) => {
      if (
        operation.walletMustMatchChainID &&
        walletStore.getSnapshot().walletType === WalletTypes.EIP6963 &&
        walletStore.getSnapshot().walletChainId !== chainId
      ) {
        switch (operation.chainType) {
          case ChainType.COSMOS: {
            // for cosmos chains using metamask
            // get the evmChainName and use that to find the chainID we are supposed to be on
            // if those don't match we can then switch to the correct evm network
            const { evmChainName } = chainRegistry[operation.chainType][
              chainName
            ] as CosmosChainConfig;
            if (evmChainName) {
              if (
                `0x${chainRegistry[ChainType.EVM][evmChainName].chainID.toString(16)}` !==
                walletStore.getSnapshot().walletChainId
              ) {
                await walletStore.switchNetwork(evmChainName);
              }
            }
            break;
          }
          default: {
            await walletStore.switchNetwork(chainName);
          }
        }
      }

      const validatedParams = await operation.validate(params, walletStore);

      if (!validatedParams) {
        throw new Error('Invalid parameters for operation');
      }
      setIsOperationValidated(true);

      if ('buildTransaction' in operation) {
        return (operation as ChainToolCallMessage<unknown>).buildTransaction(
          params,
          walletStore,
        );
      } else if ('executeQuery' in operation) {
        return (operation as ChainToolCallQuery<unknown>).executeQuery(
          params,
          walletStore,
        );
      }

      throw new Error('Invalid operation type');
    },
    [setIsOperationValidated],
  );

  /**
   * Creates a promise that resolves when the wallet connects or rejects on user cancellation/timeout
   */
  const waitForWalletConnection = useCallback(
    async (operation: ChainToolCallOperation<unknown>) => {
      return new Promise<boolean>((resolve, reject) => {
        //  Store the reject function for later use if connection is rejected
        connectionRef.current.pendingReject = reject;

        const unsubscribe = walletStore.subscribe(() => {
          if (
            operation.needsWallet &&
            Array.isArray(operation.needsWallet) &&
            operation.needsWallet.includes(walletStore.getSnapshot().walletType)
          ) {
            unsubscribe();

            connectionRef.current.pendingReject = null;

            if (connectionRef.current.cleanupFn) {
              connectionRef.current.cleanupFn();
              connectionRef.current.cleanupFn = null;
            }

            //  Resolve the promise
            resolve(true);
          }
        });

        //  Set up 5 minute timeout
        const timeoutId = setTimeout(() => {
          unsubscribe();

          connectionRef.current.pendingReject = null;

          reject(new Error('Wallet connection timed out'));

          setIsWalletConnecting(false);
        }, 300000);

        connectionRef.current.cleanupFn = () => {
          clearTimeout(timeoutId);
          unsubscribe();
        };
      });
    },
    [walletStore, setIsWalletConnecting],
  );

  /**
   * Executes a chain operation with the provided parameters.
   * Handles both transaction and query operations.
   * @param operationName - Type identifier for the operation
   * @param params - Parameters for the operation
   * @returns Result of the operation (transaction or query result)
   */
  const executeOperation = useCallback(
    async (operationName: string, params: unknown) => {
      setIsOperationValidated(false);

      const operation = registry.get(operationName);
      if (!operation) {
        throw new Error(`Unknown operation type: ${operationName}`);
      }

      let chainId = `0x${Number(2222).toString(16)}`; // default
      let chainName = ChainNames.KAVA_EVM; // default

      if (
        typeof params === 'object' &&
        params !== null &&
        chainNameToolCallParam.name in params
      ) {
        // @ts-expect-error we already checked this
        chainName = params[chainNameToolCallParam.name];
        const chain = chainRegistry[operation.chainType][chainName];
        chainId =
          operation.chainType === ChainType.EVM
            ? `0x${Number(chain.chainID).toString(16)}`
            : String(chain.chainID);
      }

      if (
        operation.needsWallet &&
        Array.isArray(operation.needsWallet) &&
        !operation.needsWallet.includes(walletStore.getSnapshot().walletType)
      ) {
        setIsWalletConnecting(true);
        openWalletConnectModal();

        try {
          await waitForWalletConnection(operation);

          return await completeOperation(
            operation,
            params,
            chainName,
            chainId,
            walletStore,
          );
        } catch {
          throw new Error('Error connecting wallet');
        } finally {
          setIsWalletConnecting(false);
        }
      }

      //  If the wallet is already connected, proceed
      return await completeOperation(
        operation,
        params,
        chainName,
        chainId,
        walletStore,
      );
    },
    [
      setIsOperationValidated,
      registry,
      walletStore,
      completeOperation,
      setIsWalletConnecting,
      openWalletConnectModal,
      waitForWalletConnection,
    ],
  );

  return {
    executeOperation,
    isOperationValidated,
    isWalletConnecting,
    handleModalClose,
  };
};
