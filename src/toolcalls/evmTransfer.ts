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
  WalletProvider,
} from '../stores/walletStore/walletStore';
import { validateChain, validateWallet } from './helpers/wallet';
import { InProgressTxDisplay } from './components/InProgressTxDisplay';
import { ethers } from 'ethers';

interface SendToolParams {
  chainName: string;
  toAddress: string;
  fromAddress?: string;
  amount: string;
  denom: string;
}

export class EvmTransferMessage
  implements ChainToolCallMessage<SendToolParams>
{
  name = 'evm-transfer';
  description = 'Send erc20 tokens from one address to another';
  operationType = OperationType.TRANSACTION;
  chainType = ChainType.EVM;
  needsWallet = [WalletProvider.EIP6963];
  walletMustMatchChainID = true;
  private hasValidWallet = false;

  parameters = [
    chainNameToolCallParam,
    {
      name: 'toAddress',
      type: 'string',
      description: 'Recipient address',
      required: true,
    },
    {
      name: 'fromAddress',
      type: 'string',
      description: 'Sending address',
      required: false,
    },
    {
      name: 'amount',
      type: 'string',
      description: 'Amount to send',
      required: true,
    },
    {
      name: 'denom',
      type: 'string',
      description: 'Token denomination',
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
    address: string,
  ): Promise<boolean> {
    const { denom, amount, chainName } = params;

    const chain = chainRegistry[this.chainType][chainName];
    if (chain.chainType !== ChainType.EVM) {
      throw new Error(`chain Type must be ${ChainType.EVM} for this operation`);
    }

    const { erc20Contracts, nativeToken, rpcUrls, nativeTokenDecimals } = chain;

    const { ethers } = await import('ethers');

    const rpcProvider = new ethers.JsonRpcProvider(rpcUrls[0]);

    if (denom.toUpperCase() === nativeToken) {
      const rawBalance = await rpcProvider.getBalance(address);
      const formattedBalance = ethers.formatUnits(
        rawBalance,
        nativeTokenDecimals,
      );
      return Number(formattedBalance) >= Number(amount);
    }

    const erc20Record = getERC20Record(denom, erc20Contracts);
    if (!erc20Record) {
      return false;
    }

    const contract = new ethers.Contract(
      erc20Record.contractAddress,
      ERC2O_ABI,
      rpcProvider,
    );

    const decimals = await contract.decimals();
    const rawBalance = await contract.balanceOf(address);
    const formattedBalance = ethers.formatUnits(rawBalance, decimals);

    return Number(formattedBalance) >= Number(amount);
  }

  async validate(
    params: SendToolParams,
    walletStore: WalletStore,
  ): Promise<boolean> {
    this.hasValidWallet = false;

    validateWallet(walletStore, this.needsWallet);
    validateChain(this.chainType, params.chainName);

    //  wallet checks have passed
    this.hasValidWallet = true;

    const { toAddress, fromAddress, amount, denom } = params;

    const validToAddress = toAddress;
    if (!validToAddress.length) {
      throw new Error(`Please provide a valid address to send to`);
    }

    if (fromAddress) {
      const isValidAddress = ethers.isAddress(fromAddress);
      if (!isValidAddress) {
        throw new Error(`Please provide a valid address to send from`);
      }
    }

    if (Number(amount) <= 0) {
      throw new Error(`amount must be greater than zero`);
    }

    const { erc20Contracts, nativeToken } = chainRegistry[this.chainType][
      params.chainName
    ] as EVMChainConfig;

    const validDenomWithContract =
      getERC20Record(denom, erc20Contracts) !== null ||
      denom.toUpperCase() === nativeToken;

    if (!validDenomWithContract) {
      throw new Error(`failed to find contract address for ${denom}`);
    }

    const addressFrom = fromAddress ?? walletStore.getSnapshot().walletAddress;

    if (!(await this.validateBalance(params, addressFrom))) {
      throw new Error('Invalid balances for transaction');
    }

    return true;
  }

  async buildTransaction(
    params: SendToolParams,
    walletStore: WalletStore,
  ): Promise<string> {
    if (!this.hasValidWallet) {
      throw new Error('please connect your wallet');
    }

    const { ethers } = await import('ethers');
    const { toAddress, fromAddress, amount, denom } = params;

    const { erc20Contracts, rpcUrls, nativeToken, chainID } = chainRegistry[
      this.chainType
    ][params.chainName] as EVMChainConfig;
    const rpcProvider = new ethers.JsonRpcProvider(rpcUrls[0]);

    try {
      let txParams: Record<string, string>;

      const addressTo = toAddress;
      const addressFrom =
        fromAddress ?? walletStore.getSnapshot().walletAddress;

      const receivingAddress = ethers.getAddress(addressTo);
      const sendingAddress = ethers.getAddress(addressFrom);

      if (denom.toUpperCase() === nativeToken) {
        txParams = {
          to: receivingAddress,
          data: '0x',
          value: ethers.parseEther(amount).toString(16),
        };
      } else {
        // ! because this already passed validation
        const { contractAddress } = getERC20Record(denom, erc20Contracts)!;

        const contract = new ethers.Contract(
          contractAddress,
          ERC2O_ABI,
          rpcProvider,
        );
        const decimals = await contract.decimals();
        const formattedTxAmount = ethers.parseUnits(amount, Number(decimals));

        txParams = {
          to: contractAddress,
          value: '0', // this must be zero
          data: contract.interface.encodeFunctionData('transfer', [
            receivingAddress,
            formattedTxAmount,
          ]),
        };
      }

      const hash = await walletStore.sign({
        chainId: `0x${Number(chainID).toString(16)}`,
        signatureType: SignatureTypes.EVM,
        payload: {
          method: 'eth_sendTransaction',
          params: [
            {
              to: txParams.to,
              value: txParams.value,
              data: txParams.data,
              from: sendingAddress,
              gasPrice: '0x4a817c800',
              gas: '0x16120',
            },
          ],
        },
      });

      try {
        const timeout = 20000; // upto 20 seconds
        const confirmations = 1;
        await rpcProvider.waitForTransaction(hash, confirmations, timeout);
      } catch (err) {
        console.error(err);
      }

      return hash;
    } catch (e) {
      throw `An error occurred building the transaction: ${JSON.stringify(e)}`;
    }
  }
}
