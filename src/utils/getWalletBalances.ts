import { ethers } from 'ethers';
import { ChainNames, chainRegistry, ChainType } from '../toolcalls/chain';

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

// BSC chain config (not included in your registry)
const bscConfig = {
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
};

/**
 * Simple function to get wallet balances across multiple chains
 * Uses your existing chain registry for configuration
 * @param provider The provider from the connected wallet
 * @param address The wallet address
 * @returns Promise with the balances result
 */
export async function getWalletBalances(provider, address) {
  if (!provider || !address) {
    console.log('Provider or address not available');
    return null;
  }

  const results = [];

  // Add Kava EVM
  try {
    const kavaConfig = chainRegistry[ChainType.EVM][ChainNames.KAVA_EVM];
    const rpcProvider = new ethers.JsonRpcProvider(kavaConfig.rpcUrls[0]);

    // Get native token balance
    const nativeBalance = await rpcProvider.getBalance(address);

    const chainResult = {
      chain: kavaConfig.name,
      chainId: kavaConfig.chainID,
      nativeToken: {
        symbol: kavaConfig.nativeToken,
        balance: nativeBalance.toString(),
        balanceFormatted: ethers.formatUnits(
          nativeBalance,
          kavaConfig.nativeTokenDecimals,
        ),
      },
      tokens: {},
    };

    let tokensToCheck = {};
    // Get token balances for wETH, wBTC, and USDT
    if (kavaConfig.chainType !== ChainType.COSMOS) {
      tokensToCheck = {
        AXLETH: kavaConfig.erc20Contracts.AXLETH,
        AXLWBTC: kavaConfig.erc20Contracts.AXLWBTC,
        USDT: kavaConfig.erc20Contracts.USDT,
      };
    }

    for (const [key, tokenInfo] of Object.entries(tokensToCheck)) {
      try {
        const tokenContract = new ethers.Contract(
          tokenInfo.contractAddress,
          ERC20_ABI,
          rpcProvider,
        );

        const tokenBalance = await tokenContract.balanceOf(address);
        // Assume decimals based on common values
        const decimals = key === 'AXLWBTC' ? 8 : key === 'USDT' ? 6 : 18;

        chainResult.tokens[tokenInfo.displayName] = {
          balance: tokenBalance.toString(),
          balanceFormatted: ethers.formatUnits(tokenBalance, decimals),
        };
      } catch (error) {
        console.error(`Error fetching ${key} on Kava EVM:`, error);
        chainResult.tokens[key] = {
          balance: '0',
          balanceFormatted: '0',
        };
      }
    }

    results.push(chainResult);
  } catch (error) {
    console.error('Error processing Kava EVM chain:', error);
    results.push({
      chain: 'Kava EVM',
      chainId: 2222,
      error: error.message,
      nativeToken: { symbol: 'KAVA', balance: '0', balanceFormatted: '0' },
      tokens: {},
    });
  }

  // Add BSC
  try {
    const rpcProvider = new ethers.JsonRpcProvider(bscConfig.rpcUrl);

    // Get native token balance
    const nativeBalance = await rpcProvider.getBalance(address);

    const chainResult = {
      chain: 'Binance Smart Chain',
      chainId: bscConfig.chainId,
      nativeToken: {
        symbol: bscConfig.nativeToken,
        balance: nativeBalance.toString(),
        balanceFormatted: ethers.formatUnits(
          nativeBalance,
          bscConfig.nativeTokenDecimals,
        ),
      },
      tokens: {},
    };

    // Get token balances
    for (const [key, tokenInfo] of Object.entries(bscConfig.tokens)) {
      try {
        const tokenContract = new ethers.Contract(
          tokenInfo.address,
          ERC20_ABI,
          rpcProvider,
        );

        const tokenBalance = await tokenContract.balanceOf(address);

        chainResult.tokens[key] = {
          balance: tokenBalance.toString(),
          balanceFormatted: ethers.formatUnits(
            tokenBalance,
            tokenInfo.decimals,
          ),
        };
      } catch (error) {
        console.error(`Error fetching ${key} on BSC:`, error);
        chainResult.tokens[key] = {
          balance: '0',
          balanceFormatted: '0',
        };
      }
    }

    results.push(chainResult);
  } catch (error) {
    console.error('Error processing BSC chain:', error);
    results.push({
      chain: 'Binance Smart Chain',
      chainId: 56,
      error: error.message,
      nativeToken: { symbol: 'BNB', balance: '0', balanceFormatted: '0' },
      tokens: {},
    });
  }

  // Add Ethereum
  try {
    const ethConfig = chainRegistry[ChainType.EVM][ChainNames.ETH];
    const rpcProvider = new ethers.JsonRpcProvider(ethConfig.rpcUrls[0]);

    // Get native token balance
    const nativeBalance = await rpcProvider.getBalance(address);

    const chainResult = {
      chain: ethConfig.name,
      chainId: ethConfig.chainID,
      nativeToken: {
        symbol: ethConfig.nativeToken,
        balance: nativeBalance.toString(),
        balanceFormatted: ethers.formatUnits(
          nativeBalance,
          ethConfig.nativeTokenDecimals,
        ),
      },
      tokens: {},
    };

    // Ethereum tokens - hardcoded since they're not in your registry
    const ethTokens = {
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
    };

    for (const [key, tokenInfo] of Object.entries(ethTokens)) {
      try {
        const tokenContract = new ethers.Contract(
          tokenInfo.address,
          ERC20_ABI,
          rpcProvider,
        );

        const tokenBalance = await tokenContract.balanceOf(address);

        chainResult.tokens[key] = {
          balance: tokenBalance.toString(),
          balanceFormatted: ethers.formatUnits(
            tokenBalance,
            tokenInfo.decimals,
          ),
        };
      } catch (error) {
        console.error(`Error fetching ${key} on Ethereum:`, error);
        chainResult.tokens[key] = {
          balance: '0',
          balanceFormatted: '0',
        };
      }
    }

    results.push(chainResult);
  } catch (error) {
    console.error('Error processing Ethereum chain:', error);
    results.push({
      chain: 'Ethereum',
      chainId: 1,
      error: error.message,
      nativeToken: { symbol: 'ETH', balance: '0', balanceFormatted: '0' },
      tokens: {},
    });
  }

  return results;
}
