import { ethers } from 'ethers';
import { chainRegistry, ChainType, EVMChainConfig } from '../toolcalls/chain';
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

/**
 * Gets token balance for a specific token
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
      displayBalance: ethers.formatUnits(tokenBalance, tokenDecimals),
    };
  } catch (error) {
    console.error(`Error fetching token ${tokenAddress}:`, error);
    return {
      displayBalance: '0',
    };
  }
}

/**
 * Creates a chain config from registry data
 */
function createChainConfigFromRegistry(evmConfig: EVMChainConfig): ChainConfig {
  const tokens: Record<string, TokenInfo> = {};

  // Add all tokens from the chain's erc20Contracts
  if (evmConfig.erc20Contracts) {
    Object.entries(evmConfig.erc20Contracts).forEach(([_, tokenInfo]) => {
      tokens[tokenInfo.displayName] = {
        address: tokenInfo.contractAddress,
        // Use specified decimals or default to 18
        decimals: tokenInfo.decimals || 18,
      };
    });
  }

  return {
    chainId: evmConfig.chainID,
    name: evmConfig.name,
    rpcUrl: evmConfig.rpcUrls[0],
    nativeToken: evmConfig.nativeToken,
    nativeTokenDecimals: evmConfig.nativeTokenDecimals,
    tokens,
  };
}

/**
 * Gets balances for multiple accounts on a specific chain
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

    for (const address of walletAddresses) {
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

      // Get token balances in parallel for better performance
      const tokenEntries = Object.entries(chainConfig.tokens);
      if (tokenEntries.length > 0) {
        const tokenPromises = tokenEntries.map(([symbol, tokenInfo]) =>
          getTokenBalance(
            tokenInfo.address,
            tokenInfo.decimals,
            address,
            rpcProvider,
          ).then((balance) => [symbol, balance]),
        );

        const tokenResults = await Promise.all(tokenPromises);

        // Add results to accountResult
        tokenResults.forEach(([symbol, balance]) => {
          accountResult.tokens[symbol as string] = balance as TokenBalance;
        });
      }

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
): Promise<ChainResult[]> {
  if (!provider) {
    return [];
  }

  const accounts = await getWalletAccounts(provider);

  if (accounts.length === 0) {
    return [];
  }

  const results: ChainResult[] = [];

  try {
    // Process all EVM chains from registry
    const chainPromises: Promise<ChainResult>[] = [];

    for (const [_, chainConfig] of Object.entries(
      chainRegistry[ChainType.EVM],
    )) {
      const evmConfig = chainConfig as EVMChainConfig;
      const chainConfigFromRegistry = createChainConfigFromRegistry(evmConfig);
      chainPromises.push(getChainBalances(chainConfigFromRegistry, accounts));
    }

    results.push(...(await Promise.all(chainPromises)));
  } catch (error) {
    console.error('Error fetching wallet balances:', error);
  }

  return results;
}

/**
 * Format wallet balances as a string for inclusion in system prompt
 */
export function formatWalletBalancesForPrompt(balances: ChainResult[]): string {
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

      //  Filter tokens to only include those with non-zero balances
      const nonZeroTokens = Object.entries(account.tokens).filter(
        ([_, balance]) => Number(balance.displayBalance) !== 0,
      );

      if (nonZeroTokens.length > 0) {
        formattedText += '\n    - Tokens:';
        nonZeroTokens.forEach(([symbol, balance]) => {
          formattedText += `\n      - ${symbol}: ${balance.displayBalance}`;
        });
      }
    });
  });

  return formattedText;
}
