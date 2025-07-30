import hotWalletLogo from '../assets/HOT Wallet Short.svg';
import metamaskLogo from '../assets/MetaMask-icon-fox.svg';
import { PromotedWallet } from '../types';

export enum WalletProvider {
  EIP6963 = 'EIP6963',
  NONE = 'NONE',
}

export enum SignatureTypes {
  EIP712 = 'EIP712',
  EVM = 'EVM',
}

export interface EIP1193Provider {
  isStatus?: boolean;
  host?: string;
  path?: string;
  sendAsync?: (
    request: { method: string; params?: Array<unknown> },
    callback: (error: Error | null, response: unknown) => void,
  ) => void;
  send?: (
    request: { method: string; params?: Array<unknown> },
    callback: (error: Error | null, response: unknown) => void,
  ) => void;
  request: (request: {
    method: string;
    params?: Array<unknown>;
  }) => Promise<unknown>;
  on?: (eventName: string, listener: (...args: unknown[]) => void) => void;
  off?: (eventName: string, listener: (...args: unknown[]) => void) => void;
  //  Some providers use removeListener instead of off
  removeListener?: (
    eventName: string,
    listener: (...args: unknown[]) => void,
  ) => void;
}

export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

export interface EIP6963AnnounceProviderEvent extends CustomEvent {
  type: 'eip6963:announceProvider';
  detail: EIP6963ProviderDetail;
}

export type WalletConnection = {
  walletAddress: string;
  walletChainId: string;
  walletProvider: WalletProvider;
  walletType: string;
  isWalletConnected: boolean;
  provider?: EIP1193Provider;
  rdns?: string;
};

interface EVMTransactionRequest {
  from: string;
  to: string;
  gas?: string;
  gasPrice?: string;
  value?: string;
  data?: string;
}

export interface EVMRequestPayload {
  method: string;
  params?: Array<EVMTransactionRequest>;
}

export type SignOpts = {
  chainId: string;
  signatureType: SignatureTypes;
  payload: EVMRequestPayload | unknown; // Using unknown for EIP712SignerParams to avoid circular dependency
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
