import { ERC2O_ABI } from './chain/abi';
import { getERC20Record } from '../utils/helpers';
import {
  ChainToolCallMessage,
  OperationType,
  ChainType,
  chainNameToolCallParam,
  chainRegistry,
  EVMChainConfig,
} from './chain';
import {
  SignatureTypes,
  WalletStore,
  WalletTypes,
} from '../stores/walletStore/walletStore';
import { validateChain, validateWallet } from '../utils/wallet';
import { InProgressTxDisplay } from './components/InProgressTxDisplay';

interface HardSwapParams {
  chainName: string;
  denomIn: string;
  denomOut: string;
  wantedAmount: string;
  direction: 'swapIn' | 'swapOut';
}

export class HardSwapMessage implements ChainToolCallMessage<HardSwapParams> {
  name = 'uniswapV3';
  description = 'Swap one assets to another';
  operationType = OperationType.TRANSACTION;
  chainType = ChainType.EVM;
  needsWallet = [WalletTypes.EIP6963];
  walletMustMatchChainID = true;
  private hasValidWallet = false;

  parameters = [
    chainNameToolCallParam,
    {
      name: 'denomIn',
      type: 'string',
      description: 'swap Input Token denomination',
      required: true,
    },
    {
      name: 'denomOut',
      type: 'string',
      description: 'swap out Token denomination',
      required: true,
    },
    {
      name: 'wantedAmount',
      type: 'string',
      description:
        'amount wanted for the swap, this is either the amount out after the swap or the amount in for the swap',
      required: true,
    },
    {
      name: 'direction',
      type: 'string',
      description: 'the direction for the wantedAmount',
      enum: ['swapIn', 'swapOut'],
      required: true,
    },
  ];

  inProgressComponent() {
    return InProgressTxDisplay;
  }

  private async validateBalance(
    params: {
      denom: string;
      amount: string;
      chainName: string;
    },
    walletStore: WalletStore,
  ): Promise<boolean> {
    return true;
  }

  async validate(
    params: HardSwapParams,
    walletStore: WalletStore,
  ): Promise<boolean> {
    this.hasValidWallet = false;
    validateChain(this.chainType, params.chainName);
    validateWallet(walletStore, this.needsWallet);
    //  wallet checks have passed
    this.hasValidWallet = true;

    return true;
  }

  async buildTransaction(
    params: HardSwapParams,
    walletStore: WalletStore,
  ): Promise<string> {
    if (!this.hasValidWallet) {
      throw new Error('please connect your wallet');
    }

    const { ethers } = await import('ethers');

    const { erc20Contracts, rpcUrls, nativeToken, chainID } = chainRegistry[
      this.chainType
    ][params.chainName] as EVMChainConfig;
    const rpcProvider = new ethers.JsonRpcProvider(rpcUrls[0]);

    return 'unimplemented';
  }
}
