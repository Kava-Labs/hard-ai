import {
  decodeFunctionResult,
  encodeFunctionData,
  formatEther,
  getAddress,
  isAddress,
  keccak256,
  parseEther,
  stringToHex,
  toHex,
  type Abi,
  type Hex,
} from 'viem';
import { z } from 'zod';
import { WalletProvider, WalletStore } from '../../stores/walletStore';
import { ERC2O_ABI } from './abi/erc20abi';
import { chainRegistry, ChainType, EVMChainConfig } from './chainsRegistry';
import {
  ChainToolCallOperation,
  MessageParam,
  OperationType,
} from './chainToolCallOperation';
import { ToolCallRegistry } from './ToolCallRegistry';

/**
 * EVM Tools Implementation
 *
 * This module provides a comprehensive set of EVM-compatible blockchain tools
 * that can be used by the AI assistant to interact with Ethereum and EVM-compatible chains.
 *
 * Key Features:
 * - Unified interface for all EVM operations
 * - Automatic wallet detection and connection
 * - Support for multiple EVM chains (Ethereum, Polygon, BSC, Kava EVM, etc.)
 * - Token balance and information queries
 * - Contract interaction capabilities
 * - Transaction signing and broadcasting
 *
 * Architecture:
 * - Uses viem for low-level EVM operations
 * - Implements ChainToolCallOperation interface for integration
 * - Supports dynamic tool registration/deregistration based on wallet state
 * - Provides proper error handling and validation
 */

// EVM tools namespace
const EVM_NAMESPACE = 'evm';

// Helper function to create tool names with proper namespace
const createToolName = (toolName: string): string =>
  `${EVM_NAMESPACE}-${toolName}`;

// Type for Ethereum provider
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

// Helper to get Ethereum provider
const getEthereumProvider = (): EthereumProvider => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error(
      'Ethereum provider not detected. Please install a compatible wallet extension and ensure it is connected.',
    );
  }
  return window.ethereum;
};

// Helper to get current account
const getCurrentAccount = async (): Promise<string> => {
  const provider = getEthereumProvider();
  const accounts = (await provider.request({
    method: 'eth_accounts',
  })) as string[];
  if (!accounts || accounts.length === 0) {
    throw new Error('No account connected. Please connect your wallet.');
  }
  return accounts[0];
};

// Helper to get chain ID
const getCurrentChainId = async (): Promise<number> => {
  const provider = getEthereumProvider();
  const chainId = (await provider.request({
    method: 'eth_chainId',
  })) as string;
  return parseInt(chainId, 16);
};

// Helper to get contract address for a token on current chain
const getContractAddress = async (
  tokenSymbol: string,
): Promise<string | null> => {
  const chainId = await getCurrentChainId();

  // Find the chain in the registry by chain ID
  const evmChains = chainRegistry[ChainType.EVM];
  for (const [_chainName, chainConfig] of Object.entries(evmChains)) {
    if (
      chainConfig.chainType === ChainType.EVM &&
      chainConfig.chainID === chainId.toString()
    ) {
      const contract = chainConfig.erc20Contracts[tokenSymbol];
      return contract?.contractAddress || null;
    }
  }

  return null;
};

// Helper to get chain config for current chain
const getCurrentChainConfig = async () => {
  const chainId = await getCurrentChainId();

  // Find the chain in the registry by chain ID
  const evmChains = chainRegistry[ChainType.EVM];
  for (const [_chainName, chainConfig] of Object.entries(evmChains)) {
    if (
      chainConfig.chainType === ChainType.EVM &&
      chainConfig.chainID === chainId.toString()
    ) {
      return {
        chainName: _chainName,
        chainConfig: chainConfig as EVMChainConfig,
      };
    }
  }

  throw new Error(`Chain with ID ${chainId} not found in registry`);
};

// Helper to convert BigInt values to strings for JSON serialization
const convertBigIntToString = (value: unknown): unknown => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(convertBigIntToString);
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = convertBigIntToString(val);
    }
    return result;
  }
  return value;
};

// Helper to convert Zod schema to MessageParam array
const zodSchemaToMessageParams = (schema: z.ZodSchema): MessageParam[] => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const def = (schema as any)._def;
  if (def?.typeName !== 'ZodObject') {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shape = (schema as z.ZodObject<any>)._def.shape;
  return Object.entries(shape).map(([key, value]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const def = (value as any)._def;
    return {
      name: key,
      type:
        def.typeName === 'ZodString'
          ? 'string'
          : def.typeName === 'ZodNumber'
            ? 'number'
            : def.typeName === 'ZodBoolean'
              ? 'boolean'
              : def.typeName === 'ZodArray'
                ? 'array'
                : 'string',
      description: def.description || '',
      required: !def.isOptional,
      enum: def.values,
    };
  });
};

// Base class for EVM tools
abstract class EvmToolOperation implements ChainToolCallOperation<unknown> {
  abstract name: string;
  abstract description: string;
  abstract zodSchema: z.ZodSchema;
  abstract execute(params: unknown): Promise<string>;

  chainType = ChainType.EVM;
  operationType = OperationType.WALLET;
  needsWallet = [WalletProvider.EIP6963];

  get parameters(): MessageParam[] {
    return zodSchemaToMessageParams(this.zodSchema);
  }

  async validate(params: unknown, walletStore: WalletStore): Promise<boolean> {
    try {
      // Validate parameters using Zod schema
      this.zodSchema.parse(params);

      // Ensure wallet is connected
      const walletInfo = walletStore.getSnapshot();
      return !!(walletInfo && walletInfo.isWalletConnected);
    } catch (error) {
      console.error('Validation failed:', error);
      return false;
    }
  }

  async executeRequest(params: unknown): Promise<string> {
    try {
      return await this.execute(params);
    } catch (error) {
      console.error(`Error executing ${this.name}:`, error);
      throw new Error(
        `Failed to execute ${this.name}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}

// Get Token Balance Tool (High-level)
class GetTokenBalanceTool extends EvmToolOperation {
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

  async execute(params: unknown): Promise<string> {
    const { symbol, address } = this.zodSchema.parse(params) as {
      symbol: string;
      address?: string;
    };

    let targetAddress = address;
    if (!targetAddress) {
      targetAddress = await getCurrentAccount();
    }

    // Check if symbol is a symbol or address
    let contractAddress: string;
    if (isAddress(symbol)) {
      contractAddress = getAddress(symbol);
    } else {
      // Try to get from registry
      const registryAddress = await getContractAddress(symbol.toUpperCase());
      if (!registryAddress) {
        throw new Error(
          `Token ${symbol} not found in registry. Please provide the contract address or search for it.`,
        );
      }
      contractAddress = registryAddress;
    }

    // Use viem directly for proper type handling
    const provider = getEthereumProvider();

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
      provider.request({
        method: 'eth_call',
        params: [{ to: contractAddress, data: balanceData }, 'latest'],
      }),
      provider.request({
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
class GetTokenInfoTool extends EvmToolOperation {
  name = createToolName('get-token-info');
  description =
    'Get token information (name, symbol, decimals) for a contract address or token symbol';
  zodSchema = z.object({
    symbol: z
      .string()
      .describe('Token symbol (e.g., USDT, USDC) or contract address'),
  });

  async execute(params: unknown): Promise<string> {
    const { symbol } = this.zodSchema.parse(params) as { symbol: string };

    let contractAddress: string;
    if (isAddress(symbol)) {
      contractAddress = getAddress(symbol);
    } else {
      const registryAddress = await getContractAddress(symbol.toUpperCase());
      if (!registryAddress) {
        throw new Error(
          `Token ${symbol} not found in registry. Please provide the contract address.`,
        );
      }
      contractAddress = registryAddress;
    }

    // Use viem directly for proper type handling
    const provider = getEthereumProvider();

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
      provider.request({
        method: 'eth_call',
        params: [{ to: contractAddress, data: nameData }, 'latest'],
      }),
      provider.request({
        method: 'eth_call',
        params: [{ to: contractAddress, data: symbolData }, 'latest'],
      }),
      provider.request({
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
class ListSupportedTokensTool extends EvmToolOperation {
  name = createToolName('list-supported-tokens');
  description =
    'List all supported tokens for the current network with their contract addresses';
  zodSchema = z.object({});

  async execute(): Promise<string> {
    const { chainName, chainConfig } = await getCurrentChainConfig();

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

// Switch Network Tool (Enhanced)
class SwitchNetworkTool extends EvmToolOperation {
  name = createToolName('switch-network');
  description =
    'Switch the connected wallet to a different EVM-compatible chain';
  zodSchema = z.object({
    chainName: z.string().describe('Name of the chain to switch to'),
  });

  async execute(params: unknown): Promise<string> {
    const { chainName } = this.zodSchema.parse(params) as { chainName: string };

    // Validate chain exists in registry
    const evmChains = chainRegistry[ChainType.EVM];
    if (!evmChains[chainName]) {
      throw new Error(`Chain ${chainName} not found in registry`);
    }

    const chainConfig = evmChains[chainName];

    // Use wallet_switchEthereumChain RPC method
    const provider = getEthereumProvider();

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [
          { chainId: `0x${parseInt(chainConfig.chainID).toString(16)}` },
        ],
      });

      return JSON.stringify({
        success: true,
        message: `Switched to ${chainName}`,
        chainId: chainConfig.chainID,
        chainName: chainConfig.name,
      });
    } catch (error) {
      // If chain is not added to wallet, add it
      if (
        error instanceof Error &&
        error.message.includes('Unrecognized chain ID')
      ) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${parseInt(chainConfig.chainID).toString(16)}`,
                chainName: chainConfig.name,
                nativeCurrency: {
                  name: chainConfig.nativeToken,
                  symbol: chainConfig.nativeToken,
                  decimals: chainConfig.nativeTokenDecimals,
                },
                rpcUrls: chainConfig.rpcUrls,
                blockExplorerUrls: chainConfig.blockExplorerUrls,
              },
            ],
          });

          return JSON.stringify({
            success: true,
            message: `Added and switched to ${chainName}`,
            chainId: chainConfig.chainID,
            chainName: chainConfig.name,
          });
        } catch (addError) {
          throw new Error(
            `Failed to add chain ${chainName}: ${addError instanceof Error ? addError.message : 'Unknown error'}`,
          );
        }
      }

      throw new Error(
        `Failed to switch to chain ${chainName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

// Call Contract Tool
class CallContractTool extends EvmToolOperation {
  name = createToolName('call-contract');
  description =
    'Call a contract function. Use this to run smart contract methods.';
  zodSchema = z.object({
    to: z.string().describe('The contract address or recipient'),
    data: z
      .string()
      .describe('A contract hashed method call with encoded args'),
    value: z
      .string()
      .optional()
      .describe('Value (in wei) sent with this transaction'),
  });

  async execute(params: unknown): Promise<string> {
    const { to, data, value } = this.zodSchema.parse(params) as {
      to: string;
      data: string;
      value?: string;
    };

    const provider = getEthereumProvider();
    const callParameters = {
      to,
      data,
      ...(value && { value }),
    };

    const result = (await provider.request({
      method: 'eth_call',
      params: [callParameters, 'latest'],
    })) as string;

    return result;
  }
}

// Encode Function Data Tool
class EncodeFunctionDataTool extends EvmToolOperation {
  name = createToolName('encode-function-data');
  description =
    'Encode function data for contract calls using ABI and parameters. Use this to prepare data for contract interactions.';
  zodSchema = z.object({
    abi: z.array(z.unknown()).describe('The contract ABI'),
    functionName: z.string().describe('The function name to encode'),
    args: z
      .array(z.unknown())
      .optional()
      .describe('Arguments to pass to the function'),
  });

  async execute(params: unknown): Promise<string> {
    const { abi, functionName, args } = this.zodSchema.parse(params) as {
      abi: unknown[];
      functionName: string;
      args?: unknown[];
    };

    try {
      const encodedData = encodeFunctionData({
        abi: abi as Abi,
        functionName,
        args: args || [],
      });

      return encodedData;
    } catch (error) {
      throw new Error(
        `Failed to encode function data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

// Estimate Gas Tool
class EstimateGasTool extends EvmToolOperation {
  name = createToolName('estimate-gas');
  description =
    'Estimate the gas necessary to complete a transaction without submitting it to the network. Use this before sending transactions to estimate costs.';
  zodSchema = z.object({
    to: z.string().describe('The transaction recipient or contract address'),
    data: z
      .string()
      .optional()
      .describe('A contract hashed method call with encoded args'),
    value: z
      .string()
      .optional()
      .describe('Value in wei sent with this transaction'),
    maxFeePerGas: z
      .string()
      .optional()
      .describe('Total fee per gas in wei, inclusive of maxPriorityFeePerGas'),
    maxPriorityFeePerGas: z
      .string()
      .optional()
      .describe('Max priority fee per gas in wei'),
    chainId: z
      .number()
      .optional()
      .describe('Chain ID to validate against before sending transaction'),
  });

  async execute(params: unknown): Promise<string> {
    const { to, data, value, maxFeePerGas, maxPriorityFeePerGas } =
      this.zodSchema.parse(params) as {
        to: string;
        data?: string;
        value?: string;
        maxFeePerGas?: string;
        maxPriorityFeePerGas?: string;
        chainId?: number;
      };

    const provider = getEthereumProvider();
    const estimateParameters = {
      to,
      ...(data && { data }),
      ...(value && { value }),
      ...(maxFeePerGas && { maxFeePerGas }),
      ...(maxPriorityFeePerGas && { maxPriorityFeePerGas }),
    };

    const gasEstimate = (await provider.request({
      method: 'eth_estimateGas',
      params: [estimateParameters],
    })) as string;

    return gasEstimate;
  }
}

// Format Ether Tool
class FormatEtherTool extends EvmToolOperation {
  name = createToolName('format-ether');
  description =
    'Convert wei to ether (human-readable format). Use this to display balances in a user-friendly way.';
  zodSchema = z.object({
    wei: z.string().describe('Amount in wei to convert'),
  });

  async execute(params: unknown): Promise<string> {
    const { wei } = this.zodSchema.parse(params) as { wei: string };

    try {
      const weiBigInt = BigInt(wei);
      const ether = formatEther(weiBigInt);
      return ether;
    } catch (error) {
      throw new Error(
        `Failed to format ether: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

// Get Account Tool
class GetAccountTool extends EvmToolOperation {
  name = createToolName('get-account');
  description = 'Get the current 0x account address from the connected wallet';
  zodSchema = z.object({});

  async execute(): Promise<string> {
    const account = await getCurrentAccount();
    return account;
  }
}

// Get Balance Tool
class GetBalanceTool extends EvmToolOperation {
  name = createToolName('get-balance');
  description =
    'Get the **native** currency balance of an address (not ERC20 tokens). Use this for ETH, MATIC, BNB, etc.';
  zodSchema = z.object({
    address: z
      .string()
      .optional()
      .describe('Address to get balance for. Defaults to current account.'),
  });

  async execute(params: unknown): Promise<string> {
    const { address } = this.zodSchema.parse(params) as { address?: string };

    let targetAddress = address;
    if (!targetAddress) {
      targetAddress = await getCurrentAccount();
    }

    const provider = getEthereumProvider();
    const balance = (await provider.request({
      method: 'eth_getBalance',
      params: [targetAddress, 'latest'],
    })) as string;

    const balanceBigInt = BigInt(balance);
    const balanceInEth = formatEther(balanceBigInt);
    return balanceInEth;
  }
}

// Get Block Tool
class GetBlockTool extends EvmToolOperation {
  name = createToolName('get-block');
  description =
    'Fetch information about a block at a block number, hash or tag. Use this to get block details or verify transaction confirmations.';
  zodSchema = z.object({
    blockNumber: z.string().optional().describe('Block number to fetch'),
    blockHash: z.string().optional().describe('Block hash to fetch'),
    blockTag: z
      .enum(['latest', 'earliest', 'pending', 'safe', 'finalized'])
      .optional()
      .default('latest')
      .describe('Block tag to fetch'),
  });

  async execute(params: unknown): Promise<string> {
    const { blockNumber, blockHash, blockTag } = this.zodSchema.parse(
      params,
    ) as {
      blockNumber?: string;
      blockHash?: string;
      blockTag?: string;
    };

    const provider = getEthereumProvider();
    let method = 'eth_getBlockByNumber';
    let methodParams: unknown[];

    if (blockHash) {
      method = 'eth_getBlockByHash';
      methodParams = [blockHash, false];
    } else if (blockNumber) {
      methodParams = [blockNumber, false];
    } else {
      methodParams = [blockTag || 'latest', false];
    }

    const block = await provider.request({
      method,
      params: methodParams,
    });

    return JSON.stringify(block);
  }
}

// Get Block Number Tool
class GetBlockNumberTool extends EvmToolOperation {
  name = createToolName('get-block-number');
  description =
    'Fetch the number of the most recent block seen. Use this to check network status or get current block height.';
  zodSchema = z.object({
    chainId: z
      .number()
      .optional()
      .describe('ID of chain to use when fetching data'),
  });

  async execute(params: unknown): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { chainId } = this.zodSchema.parse(params) as { chainId?: number };

    const provider = getEthereumProvider();
    const blockNumber = (await provider.request({
      method: 'eth_blockNumber',
    })) as string;

    return parseInt(blockNumber, 16).toString();
  }
}

// Get Chain ID Tool
class GetChainIdTool extends EvmToolOperation {
  name = createToolName('get-chain-id');
  description =
    'Get the current connected chain ID. Use this to determine which network the wallet is connected to.';
  zodSchema = z.object({});

  async execute(): Promise<string> {
    const chainId = await getCurrentChainId();
    return chainId.toString();
  }
}

// Hash Tool
class HashTool extends EvmToolOperation {
  name = createToolName('hash');
  description =
    'Generate Keccak-256 hash of input data. Use this for creating function selectors, message hashes, or data integrity checks.';
  zodSchema = z.object({
    data: z.string().describe('Data to hash (string, hex, or bytes)'),
    type: z
      .enum(['string', 'hex', 'bytes'])
      .optional()
      .default('string')
      .describe('Type of input data'),
  });

  async execute(params: unknown): Promise<string> {
    const { data, type } = this.zodSchema.parse(params) as {
      data: string;
      type?: 'string' | 'hex' | 'bytes';
    };

    try {
      let input: Hex;

      switch (type) {
        case 'hex':
          input = data as Hex;
          break;
        case 'bytes':
          input = toHex(data);
          break;
        case 'string':
        default:
          input = stringToHex(data);
          break;
      }

      const hash = keccak256(input);
      return hash;
    } catch (error) {
      throw new Error(
        `Failed to hash data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

// Parse Ether Tool
class ParseEtherTool extends EvmToolOperation {
  name = createToolName('parse-ether');
  description =
    'Convert ether to wei (smallest unit). Use this to prepare transaction values in the correct format.';
  zodSchema = z.object({
    ether: z.string().describe('Amount in ether to convert'),
  });

  async execute(params: unknown): Promise<string> {
    const { ether } = this.zodSchema.parse(params) as { ether: string };

    try {
      const wei = parseEther(ether);
      return wei.toString();
    } catch (error) {
      throw new Error(
        `Failed to parse ether: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

// Read Contract Tool
class ReadContractTool extends EvmToolOperation {
  name = createToolName('read-contract');
  description =
    'Call a read-only function on a contract, and return the response. Use this for reading any contract state with a specific ABI and function.';
  zodSchema = z.object({
    abi: z.array(z.unknown()).describe("The contract's ABI"),
    address: z.string().describe("The contract's address"),
    functionName: z.string().describe('Function to call on the contract'),
    args: z
      .array(z.unknown())
      .optional()
      .describe('Arguments to pass when calling the contract'),
    chainId: z
      .number()
      .optional()
      .describe('ID of chain to use when fetching data'),
  });

  async execute(params: unknown): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { abi, address, functionName, args, chainId } = this.zodSchema.parse(
      params,
    ) as {
      abi: unknown[];
      address: string;
      functionName: string;
      args?: unknown[];
      chainId?: number;
    };

    try {
      // Encode the function call
      const data = encodeFunctionData({
        abi: abi as Abi,
        functionName,
        args: args || [],
      });

      // Make the call
      const provider = getEthereumProvider();
      const result = (await provider.request({
        method: 'eth_call',
        params: [{ to: address, data }, 'latest'],
      })) as string;

      // Decode the result
      const decodedResult = decodeFunctionResult({
        abi: abi as Abi,
        functionName,
        data: result as Hex,
      });

      // Convert BigInt to string for JSON serialization
      const serializableResult = convertBigIntToString(decodedResult);
      return JSON.stringify(serializableResult);
    } catch (error) {
      throw new Error(
        `Failed to read contract: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

// Send Transaction Tool
class SendTransactionTool extends EvmToolOperation {
  name = createToolName('send-transaction');
  description =
    'Send a transaction to the connected network. Use this to transfer native tokens or interact with contracts.';
  zodSchema = z.object({
    to: z.string().describe('Destination address'),
    value: z.string().optional().describe('Amount to send in wei'),
    data: z.string().optional().describe('Transaction data'),
    gas: z.string().optional().describe('Gas limit'),
    gasPrice: z.string().optional().describe('Gas price in wei'),
    maxFeePerGas: z.string().optional().describe('Max fee per gas (EIP-1559)'),
    maxPriorityFeePerGas: z
      .string()
      .optional()
      .describe('Max priority fee per gas (EIP-1559)'),
  });

  async execute(params: unknown): Promise<string> {
    const {
      to,
      value,
      data,
      gas,
      gasPrice,
      maxFeePerGas,
      maxPriorityFeePerGas,
    } = this.zodSchema.parse(params) as {
      to: string;
      value?: string;
      data?: string;
      gas?: string;
      gasPrice?: string;
      maxFeePerGas?: string;
      maxPriorityFeePerGas?: string;
    };

    const from = await getCurrentAccount();
    const provider = getEthereumProvider();

    const transactionParameters = {
      from,
      to,
      ...(value && { value }),
      ...(data && { data }),
      ...(gas && { gas }),
      ...(gasPrice && { gasPrice }),
      ...(maxFeePerGas && { maxFeePerGas }),
      ...(maxPriorityFeePerGas && { maxPriorityFeePerGas }),
    };

    const txHash = (await provider.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
    })) as string;

    return txHash;
  }
}

// Sign Message Tool
class SignMessageTool extends EvmToolOperation {
  name = createToolName('sign-message');
  description =
    'Sign a message with the current account. Use this for authentication or creating signatures for off-chain operations.';
  zodSchema = z.object({
    message: z.string().describe('Message to sign'),
  });

  async execute(params: unknown): Promise<string> {
    const { message } = this.zodSchema.parse(params) as { message: string };
    const from = await getCurrentAccount();
    const provider = getEthereumProvider();

    const signature = (await provider.request({
      method: 'personal_sign',
      params: [message, from],
    })) as string;

    return signature;
  }
}

// Centralized list of EVM tools (maintaining alphabetical order)
const EVM_TOOLS = [
  new CallContractTool(),
  new EncodeFunctionDataTool(),
  new EstimateGasTool(),
  new FormatEtherTool(),
  new GetAccountTool(),
  new GetBalanceTool(),
  new GetBlockTool(),
  new GetBlockNumberTool(),
  new GetChainIdTool(),
  new GetTokenBalanceTool(),
  new GetTokenInfoTool(),
  new HashTool(),
  new ListSupportedTokensTool(),
  new ParseEtherTool(),
  new ReadContractTool(),
  new SendTransactionTool(),
  new SignMessageTool(),
  new SwitchNetworkTool(),
];

// Tool registry function
const registerEvmTools = (registry: ToolCallRegistry<unknown>): void => {
  EVM_TOOLS.forEach((tool) => registry.register(tool));
  console.log(`Registered ${EVM_TOOLS.length} EVM tools`);
};

// Integration functions
export const registerEvmToolsWithRegistry = (
  registry: ToolCallRegistry<unknown>,
): void => {
  try {
    registerEvmTools(registry);
    console.log('Registered EVM tools');
  } catch (error) {
    console.warn('Failed to register EVM tools with registry:', error);
  }
};

export const deregisterEvmToolsFromRegistry = (
  registry: ToolCallRegistry<unknown>,
): void => {
  // Only deregister tools that we actually registered
  EVM_TOOLS.forEach((tool) => {
    registry.deregister(tool);
  });

  console.log(`Deregistered ${EVM_TOOLS.length} EVM tools from registry`);
};

export default registerEvmTools;
