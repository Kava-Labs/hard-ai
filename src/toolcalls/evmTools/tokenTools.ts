import { z } from 'zod';
import {
  decodeFunctionResult,
  encodeFunctionData,
  getAddress,
  isAddress,
  type Abi,
  type Hex,
} from 'viem';
import { ERC2O_ABI } from '../chain/abi/erc20abi';
import { EvmToolOperation, createToolName, EthereumProvider } from './types';
import {
  getCurrentAccount,
  getCurrentChainConfig,
  getContractAddress,
  getEthereumProvider,
} from './helpers';

// Get Token Balance Tool (High-level)
export class GetTokenBalanceTool extends EvmToolOperation {
  name = createToolName('get-token-balance');
  description =
    'Get ERC20 token balance for a specific token symbol (e.g., USDT, USDC) or contract address. For common tokens like USDT, USDC, DAI, just provide the symbol. For custom tokens, provide the contract address.';
  zodSchema = z.object({
    symbol: z
      .string()
      .describe('Token symbol (e.g., USDT, USDC, DAI) or contract address'),
    address: z
      .string()
      .optional()
      .describe(
        'Address to check balance for. Defaults to current wallet address.',
      ),
  });

  async execute(params: unknown, provider?: EthereumProvider): Promise<string> {
    const { symbol, address } = this.zodSchema.parse(params) as {
      symbol: string;
      address?: string;
    };

    let targetAddress = address;
    if (!targetAddress) {
      targetAddress = await getCurrentAccount(provider);
    }

    // Check if symbol is a symbol or address
    let contractAddress: string;
    if (isAddress(symbol)) {
      contractAddress = getAddress(symbol);
    } else {
      // Try to get from registry
      const registryAddress = await getContractAddress(
        symbol.toUpperCase(),
        provider,
      );
      if (!registryAddress) {
        throw new Error(
          `Token ${symbol} not found in registry. Please provide the contract address or search for it.`,
        );
      }
      contractAddress = registryAddress;
    }

    // Use the provided provider or fall back to window.ethereum
    const ethereumProvider = getEthereumProvider(provider);

    // Encode balanceOf function call
    const balanceData = encodeFunctionData({
      abi: ERC2O_ABI as Abi,
      functionName: 'balanceOf',
      args: [getAddress(targetAddress)],
    });

    // Encode decimals function call
    const decimalsData = encodeFunctionData({
      abi: ERC2O_ABI as Abi,
      functionName: 'decimals',
      args: [],
    });

    // Make the calls
    const [balanceResult, decimalsResult] = await Promise.all([
      ethereumProvider.request({
        method: 'eth_call',
        params: [{ to: contractAddress, data: balanceData }, 'latest'],
      }),
      ethereumProvider.request({
        method: 'eth_call',
        params: [{ to: contractAddress, data: decimalsData }, 'latest'],
      }),
    ]);

    // Decode the results
    const balance = decodeFunctionResult({
      abi: ERC2O_ABI as Abi,
      functionName: 'balanceOf',
      data: balanceResult as Hex,
    }) as bigint;

    const decimals = decodeFunctionResult({
      abi: ERC2O_ABI as Abi,
      functionName: 'decimals',
      data: decimalsResult as Hex,
    }) as number;

    // Format balance
    const formattedBalance = Number(balance) / Math.pow(10, decimals);

    return JSON.stringify({
      token: symbol.toUpperCase(),
      address: targetAddress,
      contractAddress,
      balance: balance.toString(),
      formattedBalance: formattedBalance.toString(),
      decimals,
    });
  }
}

// Get Token Info Tool
export class GetTokenInfoTool extends EvmToolOperation {
  name = createToolName('get-token-info');
  description =
    'Get token information (name, symbol, decimals) for a contract address or token symbol';
  zodSchema = z.object({
    symbol: z
      .string()
      .describe('Token symbol (e.g., USDT, USDC) or contract address'),
  });

  async execute(params: unknown, provider?: EthereumProvider): Promise<string> {
    const { symbol } = this.zodSchema.parse(params) as { symbol: string };

    let contractAddress: string;
    if (isAddress(symbol)) {
      contractAddress = getAddress(symbol);
    } else {
      const registryAddress = await getContractAddress(
        symbol.toUpperCase(),
        provider,
      );
      if (!registryAddress) {
        throw new Error(
          `Token ${symbol} not found in registry. Please provide the contract address.`,
        );
      }
      contractAddress = registryAddress;
    }

    // Use the provided provider or fall back to window.ethereum
    const ethereumProvider = getEthereumProvider(provider);

    // Encode function calls
    const nameData = encodeFunctionData({
      abi: ERC2O_ABI as Abi,
      functionName: 'name',
      args: [],
    });

    const symbolData = encodeFunctionData({
      abi: ERC2O_ABI as Abi,
      functionName: 'symbol',
      args: [],
    });

    const decimalsData = encodeFunctionData({
      abi: ERC2O_ABI as Abi,
      functionName: 'decimals',
      args: [],
    });

    // Make the calls
    const [nameResult, symbolResult, decimalsResult] = await Promise.all([
      ethereumProvider.request({
        method: 'eth_call',
        params: [{ to: contractAddress, data: nameData }, 'latest'],
      }),
      ethereumProvider.request({
        method: 'eth_call',
        params: [{ to: contractAddress, data: symbolData }, 'latest'],
      }),
      ethereumProvider.request({
        method: 'eth_call',
        params: [{ to: contractAddress, data: decimalsData }, 'latest'],
      }),
    ]);

    // Decode the results
    const name = decodeFunctionResult({
      abi: ERC2O_ABI as Abi,
      functionName: 'name',
      data: nameResult as Hex,
    }) as string;

    const symbolValue = decodeFunctionResult({
      abi: ERC2O_ABI as Abi,
      functionName: 'symbol',
      data: symbolResult as Hex,
    }) as string;

    const decimals = decodeFunctionResult({
      abi: ERC2O_ABI as Abi,
      functionName: 'decimals',
      data: decimalsResult as Hex,
    }) as number;

    return JSON.stringify({
      contractAddress,
      name,
      symbol: symbolValue,
      decimals,
    });
  }
}

// List Supported Tokens Tool
export class ListSupportedTokensTool extends EvmToolOperation {
  name = createToolName('list-supported-tokens');
  description =
    'List all supported tokens for the current network with their contract addresses';
  zodSchema = z.object({});

  async execute(params: unknown, provider?: EthereumProvider): Promise<string> {
    const { chainName, chainConfig } = await getCurrentChainConfig(provider);

    return JSON.stringify({
      chainId: chainConfig.chainID,
      chainName,
      network: chainConfig.name,
      tokens: Object.entries(chainConfig.erc20Contracts).map(
        ([symbol, contract]) => {
          const erc20Contract = contract as {
            contractAddress: string;
            displayName: string;
            decimals?: number;
          };
          return {
            symbol,
            address: erc20Contract.contractAddress,
            displayName: erc20Contract.displayName,
            decimals: erc20Contract.decimals,
          };
        },
      ),
    });
  }
}
