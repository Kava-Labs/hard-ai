import { PromotedWallet } from '../types';
import metamaskLogo from '../assets/MetaMask-icon-fox.svg';
import hotWalletLogo from '../assets/HOT Wallet Short.svg';

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
