import {
  chainRegistry,
  ChainToolCallMessage,
  CosmosChainConfig,
  EIP712SignerParams,
  EVMChainConfig,
} from './chain';
import { ChainType, OperationType, ChainNames } from './chain/constants';
import { getChainConfigByName } from './chain/chainsRegistry';

import { WalletStore } from '../stores/walletStore';
import { SignatureTypes, WalletProvider } from '../types/wallet';
import { getCoinRecord, getERC20Record } from '../utils/helpers';
import { ERC2O_ABI } from './chain/abi';
import { InProgressTxDisplay } from './components/InProgressTxDisplay';

interface ERC20ConvertParams {
  chainName: string;
  amount: string;
  denom: string;
  direction: 'coinToERC20' | 'ERC20ToCoin';
}

export class ERC20ConversionMessage
  implements ChainToolCallMessage<ERC20ConvertParams>
{
  name = 'erc20Convert';
  description =
    'Converts an ERC20 asset to a cosmos Coin or cosmos coin to an ERC20 asset';
  chainType = ChainType.COSMOS;
  operationType = OperationType.TRANSACTION;
  walletMustMatchChainID = true;
  needsWallet = [WalletProvider.EIP6963];

  // Chain IDs where this tool is supported (Kava EVM chains)
  private supportedChainIds = ['2222', '2221']; // Kava EVM mainnet and testnet

  /**
   * Parameter definitions for the message.
   * Used for validation and OpenAI tool generation.
   */
  parameters = [
    {
      name: 'chainName',
      type: 'string',
      description: `name of the chain the user is interacting with, if not specified by the user assume ${ChainNames.KAVA_COSMOS}`,
      enum: [...Object.keys(chainRegistry[ChainType.COSMOS])],
      required: true,
    },
    {
      name: 'amount',
      type: 'string',
      description: 'Amount to convert',
      required: true,
    },
    {
      name: 'denom',
      type: 'string',
      description: 'Token denomination',
      required: true,
    },
    {
      name: 'direction',
      type: 'string',
      description:
        'direction of the conversion either from cosmos Coin to erc20 or erc20 to cosmos Coin',
      enum: ['coinToERC20', 'ERC20ToCoin'],
      required: true,
    },
  ];

  inProgressComponent() {
    return InProgressTxDisplay;
  }

  async validate(
    params: ERC20ConvertParams,
    walletStore: WalletStore,
  ): Promise<boolean> {
    const { ethers, Contract } = await import('ethers');

    if (!walletStore.getSnapshot().isWalletConnected) {
      throw new Error('please connect to a compatible wallet');
    }

    if (Array.isArray(this.needsWallet)) {
      if (
        !this.needsWallet.includes(walletStore.getSnapshot().walletProvider)
      ) {
        throw new Error('please connect to a compatible wallet');
      }
    }

    // Check if the current chain supports ERC20 conversion
    const currentChainId = walletStore.getSnapshot().walletChainId;
    if (!this.supportedChainIds.includes(currentChainId)) {
      throw new Error(
        `ERC20 conversion is only supported on Kava EVM chains (chain IDs: ${this.supportedChainIds.join(', ')}). Current chain ID: ${currentChainId}`,
      );
    }

    if (!chainRegistry[this.chainType][params.chainName]) {
      throw new Error(`unknown chain name ${params.chainName}`);
    }

    const { amount, denom } = params;

    if (Number(amount) <= 0) {
      throw new Error(`amount must be greater than zero`);
    }

    const chainInfo = chainRegistry[this.chainType][params.chainName];

    if (chainInfo.chainType !== ChainType.COSMOS) {
      throw new Error('chain Type must be Cosmos for this operation');
    }

    if (
      !chainInfo.evmChainName ||
      !getChainConfigByName(chainInfo.evmChainName, ChainType.EVM)
    ) {
      throw new Error(
        `cosmos chain ${chainInfo.name} must be linked to an EVM chain`,
      );
    }

    const evmChainConfig = getChainConfigByName(
      chainInfo.evmChainName,
      ChainType.EVM,
    ) as EVMChainConfig;
    const { erc20Contracts, rpcUrls } = evmChainConfig;

    if (
      !getERC20Record(denom, erc20Contracts) ||
      !getCoinRecord(denom, chainInfo.denoms)
    ) {
      throw new Error(
        `failed to find contract address or coin record for ${denom}`,
      );
    }

    if (
      params.direction !== 'ERC20ToCoin' &&
      params.direction !== 'coinToERC20'
    ) {
      throw new Error(`unknown conversion direction ${params.direction}`);
    }

    const { contractAddress } = getERC20Record(denom, erc20Contracts)!;
    const rpcProvider = new ethers.JsonRpcProvider(rpcUrls[0]);

    const contract = new Contract(contractAddress, ERC2O_ABI, rpcProvider);

    const decimals = await contract.decimals();

    if (params.direction === 'ERC20ToCoin') {
      const rawBalance = await contract.balanceOf(
        walletStore.getSnapshot().walletAddress,
      );
      const formattedBalance = ethers.formatUnits(rawBalance, decimals);

      if (Number(formattedBalance) < Number(amount)) {
        throw new Error(
          `not enough ${denom} to convert, user only has ${formattedBalance}`,
        );
      }
    } else {
      const { bech32 } = await import('bech32');
      const bech32Address = bech32.encode(
        chainInfo.bech32Prefix,
        bech32.toWords(
          ethers.getBytes(
            ethers.toQuantity(walletStore.getSnapshot().walletAddress),
          ),
        ),
      );

      const res = await fetch(
        chainInfo.rpcUrls[0] + '/cosmos/bank/v1beta1/balances/' + bech32Address,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.balances) {
          let found = false;
          for (const coin of data.balances) {
            if (coin.denom === getCoinRecord(denom, chainInfo.denoms)?.denom) {
              found = true;
              const microAmount = ethers
                .parseUnits(params.amount, decimals)
                .toString();

              if (BigInt(microAmount) > BigInt(coin.amount)) {
                throw new Error(`not enough ${denom} to convert`);
              }
            }

            if (!found) {
              throw new Error(`not enough ${denom} to convert`);
            }
          }
        }
      }
    }

    return true;
  }

  async buildTransaction(
    params: ERC20ConvertParams,
    walletStore: WalletStore,
  ): Promise<string> {
    const { ethers } = await import('ethers');
    const cosmosChainConfig = getChainConfigByName(
      params.chainName,
      this.chainType,
    ) as CosmosChainConfig;

    const evmChainConfig = getChainConfigByName(
      cosmosChainConfig.evmChainName!,
      ChainType.EVM,
    ) as EVMChainConfig;

    const { contractAddress } = getERC20Record(
      params.denom,
      evmChainConfig.erc20Contracts,
    )!;

    const rpcProvider = new ethers.JsonRpcProvider(evmChainConfig.rpcUrls[0]);

    const signerAddress = ethers.getAddress(
      walletStore.getSnapshot().walletAddress,
    );

    const { bech32 } = await import('bech32');

    const bech32Address = bech32.encode(
      cosmosChainConfig.bech32Prefix,
      bech32.toWords(ethers.getBytes(ethers.toQuantity(signerAddress))),
    );

    const contract = new ethers.Contract(
      contractAddress,
      ERC2O_ABI,
      rpcProvider,
    );

    const microAmount = ethers
      .parseUnits(params.amount, await contract.decimals())
      .toString();

    const {
      msg: { evmutil },
    } = await import('@kava-labs/javascript-sdk');
    const messages: unknown[] = [];

    switch (params.direction) {
      case 'ERC20ToCoin': {
        messages.push(
          evmutil.newMsgConvertERC20ToCoin(
            signerAddress,
            bech32Address,
            contractAddress,
            microAmount,
          ),
        );
        break;
      }
      case 'coinToERC20': {
        messages.push(
          evmutil.newMsgConvertCoinToERC20(bech32Address, signerAddress, {
            denom: getCoinRecord(params.denom, cosmosChainConfig.denoms)!.denom,
            amount: microAmount,
          }),
        );

        break;
      }
      default: {
        throw new Error(`unknown conversion direction ${params.direction}`);
      }
    }

    const payload: EIP712SignerParams = {
      messages,
      chainConfig: cosmosChainConfig,
      memo: '',
      fee: [
        {
          denom: cosmosChainConfig.nativeToken,
          amount: String(Number(cosmosChainConfig.defaultGasWanted) * 0.025),
        },
      ],
    };

    const hash = await walletStore.sign({
      signatureType: SignatureTypes.EIP712,
      payload,
      chainId: `0x${Number(evmChainConfig.chainID).toString(16)}`,
    });

    return hash;
  }
}
