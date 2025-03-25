import { ChainQuery, ChainType, OperationType } from '../types/chain';
import { erc20ABI } from './erc20ABI';
import { WalletStore, WalletTypes } from '../stores/walletStore/walletStore';
import {
  chainNameToolCallParam,
  chainRegistry,
  EVMChainConfig,
} from '../types/chain';
import { validateChain, validateWallet } from '../utils/wallet';
import { InProgressQueryDisplay } from './components/InProgressQueryDisplay';

type EvmBalanceQueryParams = {
  chainName: string;
};

export class EvmBalancesQuery implements ChainQuery<EvmBalanceQueryParams> {
  name = 'evm-balances';
  description = 'Returns the erc20 token balances for a given address';
  parameters = [chainNameToolCallParam];
  operationType = OperationType.QUERY;
  chainType = ChainType.EVM;

  walletMustMatchChainID = false;
  needsWallet = [WalletTypes.METAMASK];

  validate(params: EvmBalanceQueryParams, walletStore: WalletStore): boolean {
    validateWallet(walletStore, this.needsWallet);
    validateChain(this.chainType, params.chainName);

    return true;
  }

  inProgressComponent() {
    return InProgressQueryDisplay;
  }
  async executeQuery(
    params: EvmBalanceQueryParams,
    walletStore: WalletStore,
  ): Promise<string> {
    const { ethers } = await import('ethers');
    const { rpcUrls, erc20Contracts, nativeToken, nativeTokenDecimals } =
      chainRegistry[this.chainType][params.chainName] as EVMChainConfig;
    const rpcProvider = new ethers.JsonRpcProvider(rpcUrls[0]);

    const address = walletStore.getSnapshot().walletAddress;
    const balanceCalls: (() => Promise<string>)[] = [];

    // native fetching is a bit different
    balanceCalls.push(async () => {
      try {
        const rawBalance = await rpcProvider.getBalance(address);
        const formattedBalance = ethers.formatUnits(
          rawBalance,
          nativeTokenDecimals,
        );
        return `${nativeToken}: ${formattedBalance}`;
      } catch (err) {
        console.log(err);
        return `KAVA: failed to fetch balance ${JSON.stringify(err)}`;
      }
    });

    // add other assets
    for (const asset in erc20Contracts) {
      balanceCalls.push(async () => {
        const contractAddress = erc20Contracts[asset].contractAddress;
        const displayName = erc20Contracts[asset].displayName;

        const contract = new ethers.Contract(
          contractAddress,
          erc20ABI,
          rpcProvider,
        );

        try {
          const decimals = await contract.decimals();
          const rawBalance = await contract.balanceOf(address);
          const formattedBalance = ethers.formatUnits(rawBalance, decimals);
          if (Number(formattedBalance) === 0) {
            return '';
          }

          return `${displayName}: ${formattedBalance}`;
        } catch (err) {
          console.error(
            `failed to fetch balance for ${displayName}: ${JSON.stringify(err)}`,
          );
          return '';
        }
      });
    }

    const results = await Promise.allSettled(balanceCalls.map((fn) => fn()));
    return results.reduce(
      (acc, res) =>
        acc + `${res.status === 'fulfilled' ? res.value : res.reason}\n`,
      '',
    );
  }
}
