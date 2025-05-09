import { WalletStore, WalletProvider } from '../../stores/walletStore';
import { chainRegistry, ChainType } from '../../toolcalls/chain';

/**
 * Validates if the wallet is connected and compatible
 * @param walletStore The wallet store instance
 * @param requiredWalletProvider Array of required wallet providers
 * @returns boolean - true if wallet is valid, throws error otherwise
 */
export function validateWallet(
  walletStore: WalletStore,
  requiredWalletProvider: WalletProvider[] | null,
): boolean {
  if (!walletStore.getSnapshot().isWalletConnected) {
    throw new Error('please connect to a compatible wallet');
  }

  if (Array.isArray(requiredWalletProvider)) {
    if (
      !requiredWalletProvider.includes(walletStore.getSnapshot().walletProvider)
    ) {
      throw new Error('please connect to a compatible wallet');
    }
  }

  return true;
}

/**
 * Validates if a chain name exists in the registry
 * @param chainType The type of chain (EVM, etc.)
 * @param chainName The name of the chain to validate
 * @returns boolean - true if chain is valid, throws error otherwise
 */
export function validateChain(
  chainType: ChainType,
  chainName: string,
): boolean {
  if (!chainRegistry[chainType][chainName]) {
    throw new Error(`unknown chain name ${chainName}`);
  }

  return true;
}
