import {
  decodeFunctionResult,
  encodeFunctionData,
  getAddress,
  isAddress,
  type Abi,
  type Hex,
} from 'viem';
import { z } from 'zod';
import { ERC2O_ABI } from '../chain/abi/erc20abi';
import {
  getContractAddress,
  getCurrentAccount,
  getCurrentChainConfig,
  getEthereumProvider,
} from './helpers';
import { createToolName, EthereumProvider, EvmToolOperation } from './types';

// Get Token Balance Tool (High-level)
export class GetTokenBalanceTool extends EvmToolOperation {
  name = createToolName('get-token-balance');
  description =
    'Get ERC20 token balance for a specific token symbol (e.g., USDT, USDC) or contract address (either passed as `token`). For common tokens like USDT, USDC, DAI, you may provide the symbol. For any ERC20 token, provide the contract address.';
  zodSchema = z.object({
    token: z
      .string()
      .describe(
        'Token symbol (e.g., USDT, USDC, DAI) or ERC20 contract address',
      ),
    address: z
      .string()
      .optional()
      .describe(
        'Address to check balance for. Defaults to connected wallet address.',
      ),
  });

  async execute(params: unknown, provider?: EthereumProvider): Promise<string> {
    const { token, address } = this.zodSchema.parse(params) as {
      token: string;
      address?: string;
    };

    let targetAddress = address;
    if (!targetAddress) {
      targetAddress = await getCurrentAccount(provider);
    }

    // Check if symbol is a symbol or address
    let contractAddress: string;
    if (isAddress(token)) {
      contractAddress = getAddress(token);
    } else {
      // Try to get from registry
      const registryAddress = await getContractAddress(
        token.toUpperCase(),
        provider,
      );
      if (!registryAddress) {
        throw new Error(
          `Token ${token} not found in registry. Please provide the contract address or search for it.`,
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
      token: token.toUpperCase(),
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
    token: z
      .string()
      .describe('Token symbol (e.g., USDT, USDC) or contract address'),
  });

  async execute(params: unknown, provider?: EthereumProvider): Promise<string> {
    const { token } = this.zodSchema.parse(params) as { token: string };

    let address: string;
    if (isAddress(token)) {
      address = getAddress(token);
    } else {
      const registryAddress = await getContractAddress(
        token.toUpperCase(),
        provider,
      );
      if (!registryAddress) {
        throw new Error(
          `Token ${token} not found in registry. Please provide the contract address.`,
        );
      }
      address = registryAddress;
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
        params: [{ to: address, data: nameData }, 'latest'],
      }),
      ethereumProvider.request({
        method: 'eth_call',
        params: [{ to: address, data: symbolData }, 'latest'],
      }),
      ethereumProvider.request({
        method: 'eth_call',
        params: [{ to: address, data: decimalsData }, 'latest'],
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
      symbol: symbolValue,
      address,
      name,
      decimals,
    });
  }
}

// List Supported Tokens Tool
export class ListSupportedTokensTool extends EvmToolOperation {
  name = createToolName('list-supported-tokens');
  description =
    'List all known tokens for the current network and their contract addresses.';
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
            name: erc20Contract.displayName,
            decimals: erc20Contract.decimals,
          };
        },
      ),
    });
  }
}
