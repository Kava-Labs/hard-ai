import { ChainToolCallQuery, ChainType, OperationType } from './chain';
import { WalletStore, WalletTypes } from '../stores/walletStore';
import { chainNameToolCallParam, chainRegistry, EVMChainConfig } from './chain';
import { validateChain, validateWallet } from './helpers/wallet';
import { ERC2O_ABI } from './chain/abi';

type EvmBalanceQueryParams = {
  chainName: string;
};

export class EvmBalancesQuery
  implements ChainToolCallQuery<EvmBalanceQueryParams>
{
  name = 'evm-balances';
  description = 'Returns the erc20 token balances for a given address';
  parameters = [chainNameToolCallParam];
  operationType = OperationType.QUERY;
  chainType = ChainType.EVM;
  walletMustMatchChainID = false;
  needsWallet = [WalletTypes.EIP6963];

  validate(params: EvmBalanceQueryParams, walletStore: WalletStore): boolean {
    validateWallet(walletStore, this.needsWallet);
    validateChain(this.chainType, params.chainName);

    return true;
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
          ERC2O_ABI,
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
