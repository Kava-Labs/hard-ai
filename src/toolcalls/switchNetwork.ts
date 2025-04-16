import {
  OperationType,
  ChainType,
  chainNameToolCallParam,
  chainRegistry,
  ChainToolCallWalletAction,
} from './chain';
import { walletStore, WalletTypes } from '../stores/walletStore/walletStore';
import { validateChain, validateWallet } from './helpers/wallet';

interface SwitchChainToolParams {
  chainName: string;
}

export class EvmChainSwitcherMessage
  implements ChainToolCallWalletAction<SwitchChainToolParams>
{
  name = 'evm-switch-chain';
  description =
    'Switch the connected wallet to a different EVM-compatible chain';
  operationType = OperationType.WALLET;
  chainType = ChainType.EVM;
  needsWallet = [WalletTypes.EIP6963];
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

      // const currentChainHex = await window.ethereum.request({
      //   method: 'eth_chainId',
      // });
      // const currentChainId = parseInt(currentChainHex, 16).toString();
      //
      // const expectedChainId =
      //   chainRegistry[ChainType.EVM][params.chainName].chainID;
      //
      // if (currentChainId !== expectedChainId) {
      //   throw new Error(
      //     `Switched to the wrong chain: expected ${expectedChainId}, got ${currentChainId}`,
      //   );
      // }

      return 'yes';
      // return `Switched to chain ${currentChainId}`;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to switch chain: ${message}`);
    }
  }
}
