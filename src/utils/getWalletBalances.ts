import { ethers } from 'ethers';
import {
  ChainNames,
  chainRegistry,
  ChainType,
  EVMChainConfig,
} from '../toolcalls/chain';
import { EIP1193Provider } from '../stores/walletStore';

// ERC20 ABI - minimal version just for balanceOf function
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
];

// Define proper types for token objects
interface TokenInfo {
  address: string;
  decimals: number;
}

interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  nativeToken: string;
  nativeTokenDecimals: number;
  tokens: Record<string, TokenInfo>;
}

interface TokenBalance {
  balance: string;
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

interface ChainResult {
  chain: string;
  chainId: number | string;
  accounts: AccountResult[];
  error?: string;
}

// Chain configurations
const chainConfigs: Record<string, ChainConfig> = {
  // BSC chain config
  BSC: {
    chainId: 56,
    name: 'Binance Smart Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    nativeToken: 'BNB',
    nativeTokenDecimals: 18,
    tokens: {
      WETH: {
        address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
        decimals: 18,
      },
      WBTC: {
        address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
        decimals: 18,
      },
      USDT: {
        address: '0x55d398326f99059fF775485246999027B3197955',
        decimals: 18,
      },
    },
  },
  // Ethereum tokens
  ETH: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: '', // Will be populated from registry
    nativeToken: 'ETH',
    nativeTokenDecimals: 18,
    tokens: {
      WETH: {
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        decimals: 18,
      },
      WBTC: {
        address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        decimals: 8,
      },
      USDT: {
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        decimals: 6,
      },
    },
  },
};

/**
 * Gets token balance for a specific token
 * @param tokenAddress The token contract address
 * @param tokenDecimals The token decimals
 * @param walletAddress The wallet address
 * @param provider The JSON RPC provider
 * @returns Promise with TokenBalance result
 */
async function getTokenBalance(
  tokenAddress: string,
  tokenDecimals: number,
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

    return {
      balance: tokenBalance.toString(),
      displayBalance: ethers.formatUnits(tokenBalance, tokenDecimals),
    };
  } catch (error) {
    console.error(`Error fetching token ${tokenAddress}:`, error);
    return {
      balance: '0',
      displayBalance: '0',
    };
  }
}

/**
 * Gets balances for a single account on a specific chain
 * @param chainConfig The chain configuration
 * @param walletAddress The wallet address
 * @param rpcProvider The ethers provider
 * @returns Promise with AccountResult
 */
async function getAccountBalances(
  chainConfig: ChainConfig,
  walletAddress: string,
  rpcProvider: ethers.JsonRpcProvider,
): Promise<AccountResult> {
  try {
    // Get native token balance
    const nativeBalance = await rpcProvider.getBalance(walletAddress);

    const accountResult: AccountResult = {
      address: walletAddress,
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

    // Get token balances
    for (const [key, tokenInfo] of Object.entries(chainConfig.tokens)) {
      accountResult.tokens[key] = await getTokenBalance(
        tokenInfo.address,
        tokenInfo.decimals,
        walletAddress,
        rpcProvider,
      );
    }

    return accountResult;
  } catch (error) {
    console.error(`Error processing account ${walletAddress}:`, error);
    return {
      address: walletAddress,
      nativeToken: {
        symbol: chainConfig.nativeToken,
        balance: '0',
        displayBalance: '0',
      },
      tokens: {},
    };
  }
}

/**
 * Gets balances for multiple accounts on a specific chain
 * @param chainConfig The chain configuration
 * @param walletAddresses Array of wallet addresses
 * @returns Promise with ChainResult
 */
async function getChainBalances(
  chainConfig: ChainConfig,
  walletAddresses: string[],
): Promise<ChainResult> {
  try {
    const rpcProvider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);

    const chainResult: ChainResult = {
      chain: chainConfig.name,
      chainId: chainConfig.chainId,
      accounts: [],
    };

    // Get balances for each account
    for (const address of walletAddresses) {
      const accountResult = await getAccountBalances(
        chainConfig,
        address,
        rpcProvider,
      );
      chainResult.accounts.push(accountResult);
    }

    return chainResult;
  } catch (error) {
    console.error(`Error processing ${chainConfig.name} chain:`, error);
    return {
      chain: chainConfig.name,
      chainId: chainConfig.chainId,
      accounts: [],
      error: `Failed to get balances: ${error}`,
    };
  }
}

/**
 * Get Kava EVM chain balances with tokens from the chain registry
 * @param walletAddresses Array of wallet addresses
 * @returns Promise with ChainResult
 */
async function getKavaBalances(
  walletAddresses: string[],
): Promise<ChainResult> {
  try {
    const kavaConfig = chainRegistry[ChainType.EVM][
      ChainNames.KAVA_EVM
    ] as EVMChainConfig;

    const chainConfig: ChainConfig = {
      chainId: kavaConfig.chainID,
      name: kavaConfig.name,
      rpcUrl: kavaConfig.rpcUrls[0],
      nativeToken: kavaConfig.nativeToken,
      nativeTokenDecimals: kavaConfig.nativeTokenDecimals,
      tokens: {},
    };

    const rpcProvider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);

    const chainResult: ChainResult = {
      chain: chainConfig.name,
      chainId: chainConfig.chainId,
      accounts: [],
    };

    // Define tokens to check with explicit type
    const tokensToCheck: Record<
      string,
      { contractAddress: string; displayName: string; decimals: number }
    > = {
      AXLETH: { ...kavaConfig.erc20Contracts.AXLETH, decimals: 18 },
      AXLWBTC: { ...kavaConfig.erc20Contracts.AXLWBTC, decimals: 8 },
      USDT: { ...kavaConfig.erc20Contracts.USDT, decimals: 6 },
    };

    // For each address, get the balances
    for (const address of walletAddresses) {
      // Get native token balance
      const nativeBalance = await rpcProvider.getBalance(address);

      const accountResult: AccountResult = {
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

      // Get token balances
      for (const [_, tokenInfo] of Object.entries(tokensToCheck)) {
        accountResult.tokens[tokenInfo.displayName] = await getTokenBalance(
          tokenInfo.contractAddress,
          tokenInfo.decimals,
          address,
          rpcProvider,
        );
      }

      chainResult.accounts.push(accountResult);
    }

    return chainResult;
  } catch (error) {
    console.error('Error processing Kava EVM chain:', error);
    return {
      chain: 'Kava EVM',
      chainId: 2222,
      accounts: [],
      error: `Failed to get Kava balances: ${error}`,
    };
  }
}

/**
 * Get wallet accounts from provider
 * @param provider The EIP1193 provider
 * @returns Promise with array of wallet addresses
 */
async function getWalletAccounts(provider: EIP1193Provider): Promise<string[]> {
  try {
    // Request accounts from the provider
    const accounts = await provider.request({ method: 'eth_accounts' });
    return accounts as string[];
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return [];
  }
}

/**
 * Function to get wallet balances across multiple chains for all accounts
 * Uses your existing chain registry for configuration
 * @param provider The provider from the connected wallet
 * @returns Promise with the balances result
 */
// Create a cache to prevent duplicate calls
const balancesCache: Record<string, Promise<ChainResult[]>> = {};

export async function getMultiAccountWalletBalances(
  provider: EIP1193Provider,
): Promise<ChainResult[]> {
  if (!provider) {
    console.log('Provider not available');
    return [];
  }

  // Get all accounts from the provider
  const accounts = await getWalletAccounts(provider);

  if (accounts.length === 0) {
    console.log('No accounts available');
    return [];
  }

  // Create a cache key from the accounts
  const cacheKey = `balances-${accounts.join('-')}`;

  // Check if we already have a pending request for these accounts
  if (await balancesCache[cacheKey]) {
    console.log('Using cached wallet balances');
    return balancesCache[cacheKey];
  }

  // Store promise in cache before awaiting results
  balancesCache[cacheKey] = (async () => {
    const results: ChainResult[] = [];

    // Add Kava EVM
    results.push(await getKavaBalances(accounts));

    // Add BSC
    results.push(await getChainBalances(chainConfigs.BSC, accounts));

    // Add Ethereum - Update RPC URL from registry
    try {
      const ethConfig = chainRegistry[ChainType.EVM][
        ChainNames.ETH
      ] as EVMChainConfig;
      chainConfigs.ETH.rpcUrl = ethConfig.rpcUrls[0];
      results.push(await getChainBalances(chainConfigs.ETH, accounts));
    } catch (error) {
      console.error('Error setting up Ethereum chain:', error);
      results.push({
        chain: 'Ethereum',
        chainId: 1,
        accounts: [],
        error: 'Failed to set up Ethereum chain configuration',
      });
    }

    console.log('Wallet balances fetched successfully for all accounts');
    return results;
  })();

  return balancesCache[cacheKey];
}

/**
 * Format wallet balances as a string for inclusion in system prompt
 * @param balances Array of chain balance results
 * @returns Formatted string with wallet balance information
 */
export function formatMultiAccountWalletBalancesForPrompt(
  balances: ChainResult[],
): string {
  if (!balances || balances.length === 0) return '';

  let formattedText = '\n\nWallet Balance Information:';

  balances.forEach((chain) => {
    formattedText += `\n- ${chain.chain} (${chain.chainId}):`;

    if (chain.accounts.length === 0) {
      formattedText += '\n  - No accounts found';
      return;
    }

    chain.accounts.forEach((account) => {
      formattedText += `\n  - Account: ${account.address}`;
      formattedText += `\n    - Native: ${account.nativeToken.symbol}: ${account.nativeToken.displayBalance}`;

      if (Object.keys(account.tokens).length > 0) {
        formattedText += '\n    - Tokens:';
        Object.entries(account.tokens).forEach(([symbol, balance]) => {
          formattedText += `\n      - ${symbol}: ${balance.displayBalance}`;
        });
      }
    });
  });

  return formattedText;
}

/**
 * Legacy function maintained for backward compatibility
 */
export async function getWalletBalances(
  provider: EIP1193Provider,
  address: string,
): Promise<ChainResult[]> {
  if (!provider || !address) {
    return [];
  }

  // Convert the results from multi-account format to single-account format
  const multiAccountResults = await getMultiAccountWalletBalances(provider);

  // Filter to only include the specified address
  const singleAccountResults: ChainResult[] = multiAccountResults.map(
    (chainResult) => {
      const filteredAccounts = chainResult.accounts.filter(
        (account) => account.address.toLowerCase() === address.toLowerCase(),
      );

      // If we found the account, convert to old format
      if (filteredAccounts.length > 0) {
        const account = filteredAccounts[0];
        return {
          chain: chainResult.chain,
          chainId: chainResult.chainId,
          nativeToken: account.nativeToken,
          tokens: account.tokens,
          error: chainResult.error,
        } as any; // Type assertion to match old interface
      }

      // Account not found, return empty result
      return {
        chain: chainResult.chain,
        chainId: chainResult.chainId,
        nativeToken: {
          symbol: '',
          balance: '0',
          displayBalance: '0',
        },
        tokens: {},
        error: chainResult.error || 'Account not found on this chain',
      } as any; // Type assertion to match old interface
    },
  );

  return singleAccountResults;
}

/**
 * Legacy format function maintained for backward compatibility
 */
export function formatWalletBalancesForPrompt(balances: any[]): string {
  if (!balances || balances.length === 0) return '';

  let formattedText = '\n\nWallet Balance Information:';

  balances.forEach((chain) => {
    formattedText += `\n- ${chain.chain} (${chain.chainId}):`;

    if (chain.nativeToken && chain.nativeToken.symbol) {
      formattedText += `\n  - Native: ${chain.nativeToken.symbol}: ${chain.nativeToken.displayBalance}`;
    }

    if (chain.tokens && Object.keys(chain.tokens).length > 0) {
      formattedText += '\n  - Tokens:';
      Object.entries(chain.tokens).forEach(
        ([symbol, balance]: [string, TokenBalance]) => {
          formattedText += `\n    - ${symbol}: ${balance.displayBalance}`;
        },
      );
    }
  });

  return formattedText;
}
