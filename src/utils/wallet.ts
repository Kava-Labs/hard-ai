import { WalletConnection, WalletTypes } from '../stores/walletStore';
import { chainRegistry, ChainType } from '../toolcalls/chain';

/**
 * Validates if the wallet is connected and compatible
 * @param walletStore The wallet store instance
 * @param requiredWalletTypes Array of required wallet types
 * @returns boolean - true if wallet is valid, throws error otherwise
 */
export function validateWallet(
  walletConnection: WalletConnection,
  requiredWalletTypes: WalletTypes[] | null,
): boolean {
  if (!walletConnection.isWalletConnected) {
    throw new Error('please connect to a compatible wallet');
  }

  if (Array.isArray(requiredWalletTypes)) {
    if (!requiredWalletTypes.includes(walletConnection.walletType)) {
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

export const formatWalletAddress = (address: string) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};
