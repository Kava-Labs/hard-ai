import { z } from 'zod';
import { formatEther } from 'viem';
import { EvmToolOperation, createToolName } from './types';
import { getCurrentAccount, getEthereumProvider } from './helpers';

// Get Balance Tool
export class GetBalanceTool extends EvmToolOperation {
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
export class GetBlockTool extends EvmToolOperation {
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
export class GetBlockNumberTool extends EvmToolOperation {
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
