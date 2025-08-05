import { z } from 'zod';
import {
  formatEther,
  keccak256,
  parseEther,
  stringToHex,
  toHex,
  type Hex,
  type Transaction,
} from 'viem';
import { EvmToolOperation, createToolName, EthereumProvider } from './types';
import { getCurrentAccount, getEthereumProvider } from './helpers';

// Send Transaction Tool
export class SendTransactionTool extends EvmToolOperation {
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

  async execute(params: unknown, provider?: EthereumProvider): Promise<string> {
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

    const from = await getCurrentAccount(provider);
    const ethereumProvider = getEthereumProvider(provider);

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

    const txHash = (await ethereumProvider.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
    })) as string;

    return txHash;
  }
}

// Sign Message Tool
export class SignMessageTool extends EvmToolOperation {
  name = createToolName('sign-message');
  description =
    'Sign a message with the current account. Use this for authentication or creating signatures for off-chain operations.';
  zodSchema = z.object({
    message: z.string().describe('Message to sign'),
  });

  async execute(params: unknown, provider?: EthereumProvider): Promise<string> {
    const { message } = this.zodSchema.parse(params) as { message: string };
    const from = await getCurrentAccount(provider);
    const ethereumProvider = getEthereumProvider(provider);

    const signature = (await ethereumProvider.request({
      method: 'personal_sign',
      params: [message, from],
    })) as string;

    return signature;
  }
}

// Format Ether Tool
export class FormatEtherTool extends EvmToolOperation {
  name = createToolName('format-ether');
  description =
    'Convert wei to ether (human-readable format). Use this to display balances in a user-friendly way by passing native token amount as `wei`.';
  zodSchema = z.object({
    wei: z.string().describe('Amount in wei to convert. (integer)'),
  });

  async execute(params: unknown): Promise<string> {
    const { wei } = this.zodSchema.parse(params) as { wei: string };
    const weiBigInt = BigInt(wei);
    const ether = formatEther(weiBigInt);
    return ether;
  }
}

// Parse Ether Tool
export class ParseEtherTool extends EvmToolOperation {
  name = createToolName('parse-ether');
  description =
    'Convert ether to wei (smallest unit). Use this to prepare transaction values in the correct format.';
  zodSchema = z.object({
    ether: z.string().describe('Amount in ether to convert'),
  });

  async execute(params: unknown): Promise<string> {
    const { ether } = this.zodSchema.parse(params) as { ether: string };
    const wei = parseEther(ether);
    return wei.toString();
  }
}

// Hash Tool
export class HashTool extends EvmToolOperation {
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
  }
}

// Get Transaction By Hash Tool
export class GetTransactionByHashTool extends EvmToolOperation {
  name = createToolName('get-transaction-by-hash');
  description =
    'Get transaction details by hash. Use this to check the status of submitted transactions, verify transaction parameters, and retrieve transaction information including block number, gas used, and transaction receipt. Errors if transaction is pending or not found.';
  zodSchema = z.object({
    hash: z.string().describe('Transaction hash to look up'),
  });

  async execute(params: unknown, provider?: EthereumProvider): Promise<string> {
    const { hash } = this.zodSchema.parse(params) as { hash: string };
    const ethereumProvider = getEthereumProvider(provider);

    const transaction = (await ethereumProvider.request({
      method: 'eth_getTransactionByHash',
      params: [hash],
    })) as Transaction | null;

    if (!transaction) {
      throw new Error(`Transaction not found or pending: hash = ${hash}`);
    }

    return JSON.stringify(transaction, null, 2);
  }
}
