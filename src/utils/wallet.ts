import metamaskLogo from '../assets/MetaMask-icon-fox.svg';
import hotWalletLogo from '../assets/HOT Wallet Short.svg';
import { PromotedWallet } from '../types';
import { ethers } from 'ethers';
import { chainRegistry, ChainType, EVMChainConfig } from '../toolcalls/chain';
import { EIP1193Provider } from '../stores/walletStore';

export const PROMOTED_WALLETS: PromotedWallet[] = [
  {
    name: 'MetaMask',
    logo: metamaskLogo,
    downloadUrl: 'https://metamask.io/download/',
  },
  {
    name: 'HOT Wallet',
    logo: hotWalletLogo,
    downloadUrl: 'https://hot-labs.org/extension/',
  },
];

const BALANCES_ABI = [
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
    displayBalance: string;
  };
  tokens: Record<string, TokenBalance>;
}

interface WalletResult {
  chain: string;
  chainId: string;
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
      BALANCES_ABI,
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
      BALANCES_ABI,
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
): Promise<WalletResult> {
  try {
    const rpcProvider = new ethers.JsonRpcProvider(chainConfig.rpcUrls[0]);

    const wallet: WalletResult = {
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
          displayBalance: ethers.formatUnits(
            nativeBalance,
            chainConfig.nativeTokenDecimals,
          ),
        },
        tokens: {},
      };

      if (chainConfig.erc20Contracts) {
        const tokenBalanceRequests = Object.values(
          chainConfig.erc20Contracts,
        ).map(async (tokenInfo) => {
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
        });

        const results = await Promise.all(tokenBalanceRequests);

        results.forEach((result) => {
          account.tokens[result.tokenName] = result.balance;
        });
      }

      wallet.accounts.push(account);
    }
    return wallet;
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
export async function getChainAccounts(
  provider: EIP1193Provider,
): Promise<WalletResult[]> {
  if (!provider) {
    return [];
  }

  const accounts = await getWalletAccounts(provider);

  if (accounts.length === 0) {
    return [];
  }

  const walletAccounts: WalletResult[] = [];

  try {
    const walletAccountPromise: Promise<WalletResult>[] = [];

    for (const chainConfig of Object.values(chainRegistry[ChainType.EVM])) {
      const evmConfig = chainConfig as EVMChainConfig;
      walletAccountPromise.push(getEVMChainBalances(evmConfig, accounts));
    }

    walletAccounts.push(...(await Promise.all(walletAccountPromise)));
  } catch (error) {
    console.error('Error fetching wallet balances:', error);
  }

  return walletAccounts;
}

/**
 * Format wallet balances as a markdown table for inclusion in system prompt
 * Displays user balances across all chains and wallets
 * Explicitly marks the first account across all chains as the global active account
 * Indicates which chain the user is currently connected to
 */
/**
 * Format wallet balances as HTML table
 * Displays user balances across all chains and wallets
 */
/**
 * Format wallet balances as HTML with separate tables for each chain
 * Displays user balances across all chains and wallets
 */
export function formatWalletBalancesForPrompt(
  balances: WalletResult[],
  currentChainId?: string,
): string {
  if (!balances || balances.length === 0) return '';

  // Find active account address and current chain info
  let activeAccountAddress = null;
  let currentChainName = '';
  const currentChainWallet = currentChainId
    ? balances.find((w) => w.chainId === currentChainId)
    : null;

  // Find the active account (first account across all wallets)
  for (const wallet of balances) {
    if (wallet.accounts && wallet.accounts.length > 0) {
      activeAccountAddress = wallet.accounts[0].address;

      if (currentChainId) {
        currentChainName = String(parseInt(currentChainId, 16));
      }

      break;
    }
  }

  // Start building the content
  let formattedText = '<h3>Here are your balances across all wallets:</h3>';

  // Add active account info if available
  if (activeAccountAddress) {
    formattedText += `<p><strong>Active Account:</strong> ${activeAccountAddress}`;

    if (currentChainName) {
      formattedText += ` connected to ${currentChainName}`;
    }

    formattedText += '</p>';
  }

  // Add current chain connection info
  if (currentChainId && currentChainWallet) {
    formattedText += `<p><strong>Currently Connected to:</strong> ${currentChainWallet.chain} (Chain ID: ${String(parseInt(currentChainId, 16))})</p>`;
  } else if (currentChainId) {
    formattedText += `<p><strong>Currently Connected to Chain ID:</strong> ${String(parseInt(currentChainId, 16))}</p>`;
  }

  // Create separate tables for each chain
  balances.forEach((wallet) => {
    const chainName = wallet.chain;
    const chainId = wallet.chainId;

    if (wallet.error) {
      formattedText += `<h4>${chainName} (${chainId}):</h4>`;
      formattedText += `<p>Error: ${wallet.error}</p>`;
      return;
    }

    if (wallet.accounts.length === 0) {
      formattedText += `<h4>${chainName} (${chainId}):</h4>`;
      formattedText += `<p>No accounts found</p>`;
      return;
    }

    // Only create table if there are accounts with tokens
    formattedText += `<h4>${chainName} (${chainId}):</h4>`;
    formattedText += `
      <table>
        <thead>
          <tr>
            <th>Token</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>`;

    wallet.accounts.forEach((account) => {
      // For native token
      formattedText += `
        <tr>
          <td>${account.nativeToken.symbol} (Native)</td>
          <td>${account.nativeToken.displayBalance}</td>
        </tr>`;

      // For other tokens with non-zero balance
      const nonZeroTokens = Object.entries(account.tokens).filter(
        ([_, balance]) => Number(balance.displayBalance) !== 0,
      );

      nonZeroTokens.forEach(([symbol, balance]) => {
        formattedText += `
        <tr>
          <td>${symbol}</td>
          <td>${balance.displayBalance}</td>
        </tr>`;
      });
    });

    formattedText += `
        </tbody>
      </table>`;
  });

  return formattedText;
}
