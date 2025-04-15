import { ERC2O_ABI } from './chain/abi';
import { getERC20Record } from '../utils/helpers';
import {
  ChainToolCallMessage,
  OperationType,
  ChainType,
  chainNameToolCallParam,
  chainRegistry,
  EVMChainConfig,
  getPool,
  getQuoteExactInputSingle,
  getQuoteExactOutputSingle,
} from './chain';
import {
  SignatureTypes,
  WalletStore,
  WalletTypes,
} from '../stores/walletStore/walletStore';
import { validateChain, validateWallet } from '../utils/wallet';
import { InProgressTxDisplay } from './components/InProgressTxDisplay';
import { ethers } from 'ethers';

interface HardSwapParams {
  chainName: string;
  tokenA: string;
  tokenB: string;
  wantedAmount: string;
  direction: 'swapIn' | 'swapOut';

  interaction:
    | 'swapExactOutput'
    | 'quoteExactOutput'
    | 'quoteExactInput'
    | 'swapExactInput';
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
      name: 'tokenA',
      type: 'string',
      description: 'swap Token A',
      required: true,
    },
    {
      name: 'tokenB',
      type: 'string',
      description: 'swap Token B',
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
    {
      name: 'interaction',
      type: 'string',
      description:
        'the interaction type with the swap protocol, is this a swap quote request or a swap transaction',
      enum: [
        'swapExactOutput',
        'quoteExactOutput',
        'quoteExactInput',
        'swapExactInput',
      ],
      required: true,
    },
  ];

  inProgressComponent() {
    return InProgressTxDisplay;
  }

  private async getAssetContracts(
    tokenA: string,
    tokenB: string,
    chainConfig: EVMChainConfig,
  ): Promise<{
    tokenAContract: string;
    tokenBContract: string;
  }> {
    const getContract = (token: string) => {
      if (token.toUpperCase() === chainConfig.nativeToken) {
        return 'native';
      } else {
        const erc20 = getERC20Record(token, chainConfig.erc20Contracts);
        return erc20?.contractAddress ? erc20.contractAddress : null;
      }
    };

    const tokenAContract = getContract(tokenA);
    const tokenBContract = getContract(tokenB);

    if (tokenAContract === null) {
      throw new Error(`failed to find ERC20 Asset Contract for ${tokenA}`);
    }
    if (tokenBContract === null) {
      throw new Error(`failed to find ERC20 Asset Contract for ${tokenB}`);
    }

    return { tokenAContract, tokenBContract };
  }

  private getNativeWrappedAssetContract(chain: EVMChainConfig) {
    if (chain.chainID === 2222 || chain.chainID === 2221) {
      return getERC20Record('WKAVA', chain.erc20Contracts)?.contractAddress;
    } else {
      throw new Error(
        'only Kava EVM Chains are supported for this transaction at the moment',
      );
    }
  }

  async validate(
    params: HardSwapParams,
    walletStore: WalletStore,
  ): Promise<boolean> {
    console.log({ params });
    this.hasValidWallet = false;
    validateChain(this.chainType, params.chainName);
    validateWallet(walletStore, this.needsWallet);
    //  wallet checks have passed
    this.hasValidWallet = true;

    if (params.tokenA === params.tokenB) {
      throw new Error('tokenA must be different than tokenB');
    }

    const chain = chainRegistry[this.chainType][
      params.chainName
    ] as EVMChainConfig;

    let { tokenAContract, tokenBContract } = await this.getAssetContracts(
      params.tokenA,
      params.tokenB,
      chain,
    );

    const rpcProvider = new ethers.JsonRpcProvider(chain.rpcUrls[0]);
    const address = walletStore.getSnapshot().walletAddress;

    if (tokenAContract === 'native') {
      const rawBalance = await rpcProvider.getBalance(address);
      const formattedBalance = ethers.formatUnits(
        rawBalance,
        chain.nativeTokenDecimals,
      );
      if (Number(formattedBalance) <= Number(params.wantedAmount)) {
        throw new Error(
          `not enough balances available for ${params.tokenA} user only has ${formattedBalance}`,
        );
      }

      tokenAContract = this.getNativeWrappedAssetContract(chain)!;
    } else {
      const contract = new ethers.Contract(
        tokenAContract,
        ERC2O_ABI,
        rpcProvider,
      );

      const decimals = await contract.decimals();
      const rawBalance = await contract.balanceOf(address);
      const formattedBalance = ethers.formatUnits(rawBalance, decimals);
      if (Number(formattedBalance) <= Number(params.wantedAmount)) {
        throw new Error(
          `not enough balances available for ${params.tokenA} user only has ${formattedBalance}`,
        );
      }
    }

    if (tokenBContract === 'native') {
      tokenBContract = this.getNativeWrappedAssetContract(chain)!;
    }

    const poolAddress = await getPool(tokenAContract, tokenBContract, 0);
    if (poolAddress === ethers.ZeroAddress) {
      throw new Error(
        `no pool exists for token pair ${params.tokenA}/${params.tokenB} with contracts  ${tokenAContract}/${tokenBContract}`,
      );
    }

    return true;
  }

  async buildTransaction(
    params: HardSwapParams,
    walletStore: WalletStore,
  ): Promise<string> {
    if (!this.hasValidWallet) {
      throw new Error(`invalid wallet for this transaction`);
    }

    const chain = chainRegistry[this.chainType][
      params.chainName
    ] as EVMChainConfig;

    let { tokenAContract, tokenBContract } = await this.getAssetContracts(
      params.tokenA,
      params.tokenB,
      chain,
    );

    if (params.interaction === 'quoteExactInput') {
      const quote = await getQuoteExactInputSingle(
        tokenAContract,
        tokenBContract,
        params.wantedAmount,
      );
      console.info({ quote });
      return JSON.stringify({
        amountOut: quote.formattedAmountOut,
        gasEstimate: quote.formattedGasEstimate,
      });
    } else if (params.interaction === 'quoteExactOutput') {
      const quote = await getQuoteExactOutputSingle(
        tokenAContract,
        tokenBContract,
        params.wantedAmount,
      );
      console.info({ quote });
      return JSON.stringify({
        amountIn: quote.formattedAmountIn,
        gasEstimate: quote.formattedGasEstimate,
      });
    }

    return 'unimplemented';
  }
}
