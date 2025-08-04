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
import { zodSchemaToMessageParams } from '../helpers/zod';

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
    const result = this.zodSchema.safeParse(params);
    if (!result.success) {
      throw new Error(
        `Invalid parameters passed to ${this.name}: ${result.error.message}`,
      );
    }
    // Ensure wallet is connected
    const walletInfo = walletStore.getSnapshot();
    if (!walletInfo || !walletInfo.isWalletConnected) {
      throw new Error('Wallet is not connected');
    }
    return true;
  }

  async executeRequest(params: unknown): Promise<string> {
    try {
      // Get the provider from the wallet store
      const walletConnection = walletStore.getSnapshot();
      const provider = walletConnection.provider;

      return await this.execute(params, provider);
    } catch (error) {
      console.error(`Error executing ${this.name}:`, error);
      const message = (error as { message: string }).message ?? 'Unknown error';
      throw new Error(`Failed to execute ${this.name}: ${message}`);
    }
  }
}
