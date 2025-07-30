import { z } from 'zod';
import {
  MessageParam,
  OperationType,
  ChainToolCallWalletAction,
} from '../chain/chainToolCallOperation';
import { ChainType } from '../chain/constants';
import { WalletStore } from '../../stores/walletStore';
import { walletStore } from '../../stores/walletStore';
import { WalletProvider } from '../../types/wallet';

// EVM tools namespace
export const EVM_NAMESPACE = 'evm';

// Type for Ethereum provider
export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

// Helper to create tool names with proper namespace
export const createToolName = (toolName: string): string =>
  `${EVM_NAMESPACE}-${toolName}`;

// Helper to convert BigInt values to strings for JSON serialization
export const convertBigIntToString = (value: unknown): unknown => {
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
export const zodSchemaToMessageParams = (
  schema: z.ZodSchema,
): MessageParam[] => {
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
export abstract class EvmToolOperation
  implements ChainToolCallWalletAction<unknown>
{
  abstract name: string;
  abstract description: string;
  abstract zodSchema: z.ZodSchema;
  abstract execute(
    params: unknown,
    provider?: EthereumProvider,
  ): Promise<string>;

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
      // Get the provider from the wallet store
      const walletConnection = walletStore.getSnapshot();
      const provider = walletConnection.provider;

      return await this.execute(params, provider);
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
