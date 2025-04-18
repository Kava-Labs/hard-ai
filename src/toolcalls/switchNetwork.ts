import {
  OperationType,
  ChainType,
  chainNameToolCallParam,
  ChainToolCallWalletAction,
} from './chain';
import { WalletProvider, walletStore } from '../stores/walletStore/walletStore';
import { validateChain, validateWallet } from './helpers/wallet';

interface SwitchChainToolParams {
  chainName: string;
}

export class EvmChainSwitchMessage
  implements ChainToolCallWalletAction<SwitchChainToolParams>
{
  name = 'evm-switch-chain';
  description =
    'Switch the connected wallet to a different EVM-compatible chain';
  operationType = OperationType.WALLET;
  chainType = ChainType.EVM;
  needsWallet = [WalletProvider.EIP6963];
  private hasValidWallet = false;
  parameters = [chainNameToolCallParam];

  async validate(params: SwitchChainToolParams): Promise<boolean> {
    this.hasValidWallet = false;

    validateWallet(walletStore, this.needsWallet);
    validateChain(this.chainType, params.chainName);

    this.hasValidWallet = true;

    return true;
  }

  async executeRequest(params: SwitchChainToolParams): Promise<string> {
    if (!this.hasValidWallet) {
      throw new Error('Please connect your wallet');
    }

    try {
      await walletStore.switchNetwork(params.chainName);

      return `Switched to chain ${params.chainName}`;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to switch chain: ${message}`);
    }
  }
}
