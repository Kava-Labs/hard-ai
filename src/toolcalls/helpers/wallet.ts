import { WalletStore, WalletTypes } from '../../stores/walletStore';
import { chainRegistry, ChainType } from '../../toolcalls/chain';
import metamaskLogo from '../assets/MetaMask-icon-fox.svg';
import hotWalletLogo from '../assets/HOT Wallet Short.svg';
import { PromotedWallet } from '../../types';

/**
 * Validates if the wallet is connected and compatible
 * @param walletStore The wallet store instance
 * @param requiredWalletTypes Array of required wallet types
 * @returns boolean - true if wallet is valid, throws error otherwise
 */
export function validateWallet(
  walletStore: WalletStore,
  requiredWalletTypes: WalletTypes[] | null,
): boolean {
  if (!walletStore.getSnapshot().isWalletConnected) {
    throw new Error('please connect to a compatible wallet');
  }

  if (Array.isArray(requiredWalletTypes)) {
    if (!requiredWalletTypes.includes(walletStore.getSnapshot().walletType)) {
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

export const PROMOTED_WALLETS: PromotedWallet[] = [
  {
    name: 'MetaMask',
    logo: metamaskLogo,
    downloadUrl: 'https://metamask.io/download/',
  },
  {
    name: 'HOT Wallet',
    logo: hotWalletLogo,
    downloadUrl: 'https://hot-labs.org/extension/',
  },
];
