import {
  decodeFunctionResult,
  encodeFunctionData,
  parseAbi,
  type Abi,
  type Hex,
} from 'viem';
import { z } from 'zod';
import { getEthereumProvider } from './helpers';
import {
  convertBigIntToString,
  createToolName,
  EthereumProvider,
  EvmToolOperation,
} from './types';

// Call Contract Tool
export class CallContractTool extends EvmToolOperation {
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

  async execute(params: unknown, provider?: EthereumProvider): Promise<string> {
    const { to, data, value } = this.zodSchema.parse(params) as {
      to: string;
      data: string;
      value?: string;
    };

    const ethereumProvider = getEthereumProvider(provider);
    const callParameters = {
      to,
      data,
      ...(value && { value }),
    };

    const result = (await ethereumProvider.request({
      method: 'eth_call',
      params: [callParameters, 'latest'],
    })) as string;

    return result;
  }
}

// Encode Function Data Tool
export class EncodeFunctionDataTool extends EvmToolOperation {
  name = createToolName('encode-function-data');
  description =
    'Encode function data for contract calls using function signature and parameters. Use this to prepare data for contract interactions.';
  zodSchema = z.object({
    funcSignature: z
      .string()
      .describe(
        'The function signature (e.g., "function approve(address spender, uint256 amount)")',
      ),
    args: z
      .array(z.unknown())
      .optional()
      .describe('Arguments to pass to the function'),
  });

  async execute(params: unknown): Promise<string> {
    const { funcSignature, args } = this.zodSchema.parse(params) as {
      funcSignature: string;
      args?: unknown[];
    };

    try {
      // Parse the function signature into ABI format
      const abi = parseAbi([funcSignature]) as Abi;

      // Extract function name from the signature
      const functionName = (abi[0] as { name: string }).name;

      const encodedData = encodeFunctionData({
        abi,
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
export class EstimateGasTool extends EvmToolOperation {
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

  async execute(params: unknown, provider?: EthereumProvider): Promise<string> {
    const { to, data, value, maxFeePerGas, maxPriorityFeePerGas } =
      this.zodSchema.parse(params) as {
        to: string;
        data?: string;
        value?: string;
        maxFeePerGas?: string;
        maxPriorityFeePerGas?: string;
        chainId?: number;
      };

    const ethereumProvider = getEthereumProvider(provider);
    const estimateParameters = {
      to,
      ...(data && { data }),
      ...(value && { value }),
      ...(maxFeePerGas && { maxFeePerGas }),
      ...(maxPriorityFeePerGas && { maxPriorityFeePerGas }),
    };

    const gasEstimate = (await ethereumProvider.request({
      method: 'eth_estimateGas',
      params: [estimateParameters],
    })) as string;

    return gasEstimate;
  }
}

// Read Contract Tool
export class ReadContractTool extends EvmToolOperation {
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

  async execute(params: unknown, provider?: EthereumProvider): Promise<string> {
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
      const ethereumProvider = getEthereumProvider(provider);
      const result = (await ethereumProvider.request({
        method: 'eth_call',
        params: [{ to: address, data }, 'latest'],
      })) as string;

      // Decode the result
      const decodedResult = decodeFunctionResult({
        abi: abi as Abi,
        functionName,
        data: result as Hex,
      });

      // Convert BigInt values to strings for JSON serialization
      const serializedResult = convertBigIntToString(decodedResult);

      return JSON.stringify(serializedResult);
    } catch (error) {
      throw new Error(
        `Failed to read contract: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
