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
import { ChainType } from './chainsRegistry';
import {
  ChainToolCallOperation,
  MessageParam,
  OperationType,
} from './chainToolCallOperation';
import { ToolCallRegistry } from './ToolCallRegistry';

// EVM tools namespace
const EVM_NAMESPACE = 'evm';

// Helper function to create tool names with proper namespace
const createToolName = (toolName: string): string =>
  `${EVM_NAMESPACE}-${toolName}`;

// Contract Registry - Common token contracts by chain
// TODO: automatically collect token definitions from Metamask (or other wallet).
// TODO: someday, maybe expose this as a map in the UI that the user can manage for safety.
const CONTRACT_REGISTRY = {
  1: {
    // Ethereum Mainnet
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    USDC: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  },
  137: {
    // Polygon
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
  },
  56: {
    // BSC
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    WBNB: '0xbb4CdB9CBd36B01bD1cBaEF60aF814a3f6F8E2F9',
  },
  10: {
    // Optimism
    USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    USDC: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    WETH: '0x4200000000000000000000000000000000000006',
  },
  42161: {
    // Arbitrum
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    USDC: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  },
} as const;

// Token metadata for better descriptions
const TOKEN_METADATA = {
  USDT: { name: 'Tether USD', symbol: 'USDT', decimals: 6 },
  USDC: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
  DAI: { name: 'Dai Stablecoin', symbol: 'DAI', decimals: 18 },
  WETH: { name: 'Wrapped Ether', symbol: 'WETH', decimals: 18 },
  WMATIC: { name: 'Wrapped MATIC', symbol: 'WMATIC', decimals: 18 },
  BUSD: { name: 'Binance USD', symbol: 'BUSD', decimals: 18 },
  WBNB: { name: 'Wrapped BNB', symbol: 'WBNB', decimals: 18 },
} as const;

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
  const chainContracts =
    CONTRACT_REGISTRY[chainId as keyof typeof CONTRACT_REGISTRY];
  return chainContracts?.[tokenSymbol as keyof typeof chainContracts] || null;
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
          `Token ${symbol} not found in registry. Please provide the contract address or perform a web search for it.`,
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
    token: z
      .string()
      .describe('Token symbol (e.g., USDT, USDC) or contract address'),
  });

  async execute(params: unknown): Promise<string> {
    const { token } = this.zodSchema.parse(params) as { token: string };

    let contractAddress: string;
    if (isAddress(token)) {
      contractAddress = getAddress(token);
    } else {
      const registryAddress = await getContractAddress(token.toUpperCase());
      if (!registryAddress) {
        throw new Error(
          `Token ${token} not found in registry. Please provide the contract address.`,
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

    const symbol = decodeFunctionResult({
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
      symbol,
      decimals,
    });
  }
}

// List Supported Tokens Tool
// TODO: this will make the LLM think _only_ these exist. encourage search. we should explain "registered" tokens.
class ListSupportedTokensTool extends EvmToolOperation {
  name = createToolName('list-supported-tokens');
  description =
    'List tokens registered in the registry for the current network.';
  zodSchema = z.object({});

  async execute(): Promise<string> {
    const chainId = await getCurrentChainId();
    const chainContracts =
      CONTRACT_REGISTRY[chainId as keyof typeof CONTRACT_REGISTRY];

    if (!chainContracts) {
      return JSON.stringify({
        chainId,
        message: 'No supported tokens found for this network',
        tokens: [],
      });
    }

    const tokens = Object.entries(chainContracts).map(([symbol, address]) => ({
      symbol,
      address,
      metadata: TOKEN_METADATA[symbol as keyof typeof TOKEN_METADATA] || null,
    }));

    return JSON.stringify({
      chainId,
      network: getNetworkName(chainId),
      tokens,
    });
  }
}

// Helper to get network name
const getNetworkName = (chainId: number): string => {
  const networks: Record<number, string> = {
    1: 'Ethereum Mainnet',
    137: 'Polygon',
    56: 'Binance Smart Chain',
    2222: 'Kava EVM',
    42161: 'Arbitrum One',
    10: 'Optimism',
  };
  return networks[chainId] || `Chain ${chainId}`;
};

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
