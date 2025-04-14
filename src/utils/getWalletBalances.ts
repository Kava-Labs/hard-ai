import { ethers } from 'ethers';
import { chainRegistry, ChainType, EVMChainConfig } from '../toolcalls/chain';
import { EIP1193Provider } from '../stores/walletStore';

const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
];

interface TokenBalance {
  displayBalance: string;
}

interface AccountResult {
  address: string;
  nativeToken: {
    symbol: string;
    balance: string;
    displayBalance: string;
  };
  tokens: Record<string, TokenBalance>;
}

interface ChainAccountsResult {
  chain: string;
  chainId: number | string;
  accounts: AccountResult[];
  error?: string;
}

const DEFAULT_DECIMALS = 18;

/**
 * Fetches token decimals from the contract
 */
async function getTokenDecimals(
  tokenAddress: string,
  provider: ethers.JsonRpcProvider,
  defaultDecimals: number = DEFAULT_DECIMALS,
): Promise<number> {
  try {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      provider,
    );

    const decimals = await tokenContract.decimals();
    return Number(decimals);
  } catch (error) {
    console.warn(
      `Error fetching decimals for token ${tokenAddress}, using default ${defaultDecimals}:`,
      error,
    );
    return defaultDecimals;
  }
}

/**
 * Gets token balance for a specific token
 */
async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string,
  provider: ethers.JsonRpcProvider,
): Promise<TokenBalance> {
  try {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      provider,
    );

    const tokenBalance = await tokenContract.balanceOf(walletAddress);
    const decimals = await getTokenDecimals(tokenAddress, provider);

    return {
      displayBalance: ethers.formatUnits(tokenBalance, decimals),
    };
  } catch (error) {
    console.error(`Error fetching token ${tokenAddress}:`, error);
    return {
      displayBalance: '0',
    };
  }
}

/**
 * Gets balances for multiple accounts on a specific EVM chain
 */
async function getEVMChainBalances(
  chainConfig: EVMChainConfig,
  walletAddresses: string[],
): Promise<ChainAccountsResult> {
  try {
    const rpcProvider = new ethers.JsonRpcProvider(chainConfig.rpcUrls[0]);

    const chainAccounts: ChainAccountsResult = {
      chain: chainConfig.name,
      chainId: chainConfig.chainID,
      accounts: [],
    };

    for (const address of walletAddresses) {
      const nativeBalance = await rpcProvider.getBalance(address);

      const account: AccountResult = {
        address: address,
        nativeToken: {
          symbol: chainConfig.nativeToken,
          balance: nativeBalance.toString(),
          displayBalance: ethers.formatUnits(
            nativeBalance,
            chainConfig.nativeTokenDecimals,
          ),
        },
        tokens: {},
      };

      if (chainConfig.erc20Contracts) {
        const tokenPromises = Object.values(chainConfig.erc20Contracts).map(
          async (tokenInfo) => {
            const balance = await getTokenBalance(
              tokenInfo.contractAddress,
              address,
              rpcProvider,
            );
            const tokenName = tokenInfo.displayName;

            return {
              tokenName,
              balance,
            };
          },
        );

        const results = await Promise.all(tokenPromises);

        results.forEach((result) => {
          account.tokens[result.tokenName] = result.balance;
        });
      }

      chainAccounts.accounts.push(account);
    }
    return chainAccounts;
  } catch (error) {
    console.error(`Error processing ${chainConfig.name} chain:`, error);
    return {
      chain: chainConfig.name,
      chainId: chainConfig.chainID,
      accounts: [],
      error: `Failed to get balances: ${error}`,
    };
  }
}

/**
 * Get wallet accounts from provider
 */
async function getWalletAccounts(provider: EIP1193Provider): Promise<string[]> {
  try {
    const accounts = await provider.request({ method: 'eth_accounts' });
    return accounts as string[];
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return [];
  }
}

/**
 * Function to get wallet balances across multiple chains for all accounts
 */
export async function getAccountWalletBalances(
  provider: EIP1193Provider,
): Promise<ChainAccountsResult[]> {
  if (!provider) {
    return [];
  }

  const accounts = await getWalletAccounts(provider);

  if (accounts.length === 0) {
    return [];
  }

  const results: ChainAccountsResult[] = [];

  try {
    const chainPromises: Promise<ChainAccountsResult>[] = [];

    for (const chainConfig of Object.values(chainRegistry[ChainType.EVM])) {
      const evmConfig = chainConfig as EVMChainConfig;
      chainPromises.push(getEVMChainBalances(evmConfig, accounts));
    }

    results.push(...(await Promise.all(chainPromises)));
  } catch (error) {
    console.error('Error fetching wallet balances:', error);
  }

  return results;
}

/**
 * Format wallet balances as a string for inclusion in system prompt
 * With tokens displayed as a bulleted list on their own lines
 */
export function formatWalletBalancesForPrompt(
  balances: ChainAccountsResult[],
): string {
  if (!balances || balances.length === 0) return '';

  let formattedText = '\n\nWallet Balance Information:';

  balances.forEach((chain) => {
    formattedText += `\n- ${chain.chain} (${chain.chainId}):`;

    if (chain.error) {
      formattedText += `\n  - Error: ${chain.error}`;
      return;
    }

    if (chain.accounts.length === 0) {
      formattedText += '\n  - No accounts found';
      return;
    }

    chain.accounts.forEach((account) => {
      formattedText += `\n  - Account: ${account.address}`;
      formattedText += `\n    - Native: ${account.nativeToken.symbol}: ${account.nativeToken.displayBalance}`;

      const nonZeroTokens = Object.entries(account.tokens).filter(
        ([_, balance]) => Number(balance.displayBalance) !== 0,
      );

      if (nonZeroTokens.length > 0) {
        formattedText += '\n    - Tokens:';
        nonZeroTokens.forEach(([symbol, balance]) => {
          formattedText += `\n      • ${symbol}: ${balance.displayBalance}`;
        });
      }
    });
  });

  return formattedText;
}
