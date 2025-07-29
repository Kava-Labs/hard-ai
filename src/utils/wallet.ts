import metamaskLogo from '../assets/MetaMask-icon-fox.svg';
import hotWalletLogo from '../assets/HOT Wallet Short.svg';
import { PromotedWallet } from '../types';

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
