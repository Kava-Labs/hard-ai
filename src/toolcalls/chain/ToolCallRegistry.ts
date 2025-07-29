import {
  ChainToolCallMessage,
  ChainToolCallOperation,
  ChainToolCallQuery,
  OperationType,
} from './chainToolCallOperation';
import type { ChatCompletionTool } from 'openai/resources/index';
import {
  defaultInputPlaceholderText,
  defaultIntroText,
  defaultSystemPrompt,
} from './prompts';
import { WalletInfo } from '../../types';
import { WalletStore } from '../../stores/walletStore';
import { chainRegistry } from './chainsRegistry';
import { ChainType } from './constants';

/**
 * Central registry for all chain operations (messages and queries).
 * Manages the registration and retrieval of operations, and generates
 * OpenAI tool definitions based on registered operations.
 */
export class ToolCallRegistry<T> {
  /** Map of operation type to operation implementation */
  private operations: Map<string, ChainToolCallOperation<T>> = new Map();

  /**
   * Registers a new operation in the registry.
   * @param operation - Operation to register
   */
  register(operation: ChainToolCallOperation<T>) {
    this.operations.set(operation.name, operation);
  }

  /**
   * Deregisters an operation from the registry.
   * @param operation - Operation to deregister
   */
  deregister(operation: ChainToolCallOperation<T>) {
    this.operations.delete(operation.name);
  }

  /**
   * Retrieves an operation by its type.
   * @param type - Operation type identifier
   * @returns The operation implementation or undefined if not found
   */
  get(type: string): ChainToolCallOperation<T> | undefined {
    return this.operations.get(type);
  }

  /**
   * Gets all registered operations.
   * @returns Array of all registered operations
   */
  getAllOperations(): ChainToolCallOperation<T>[] {
    return Array.from(this.operations.values());
  }

  /**
   * @returns String value for the system prompt
   */
  getSystemPrompt() {
    return defaultSystemPrompt;
  }

  /**
   * @returns String value for the intro text a user sees before interacting with the chat
   */
  getIntroText() {
    return defaultIntroText;
  }

  /**
   * @returns String value for the input placeholder
   */
  getInputPlaceholderText() {
    return defaultInputPlaceholderText;
  }

  /**
   * Gets all registered transaction message operations.
   * @returns Array of transaction operations
   */
  getMessages(): ChainToolCallMessage<T>[] {
    return this.getAllOperations().filter(
      (op): op is ChainToolCallMessage<T> =>
        'operationType' in op && op.operationType === OperationType.TRANSACTION,
    );
  }

  /**
   * Gets all registered query operations.
   * @returns Array of query operations
   */
  getQueries(): ChainToolCallQuery<T>[] {
    return this.getAllOperations().filter(
      (op): op is ChainToolCallQuery<T> =>
        'operationType' in op && op.operationType === OperationType.QUERY,
    );
  }

  /**
   * Generates OpenAI tool definitions for all registered operations.
   * These definitions are used to create function-calling tools in the AI model.
   * @returns Array of tool definitions in OpenAI format
   */
  getToolDefinitions(): ChatCompletionTool[] {
    const operations = this.getAllOperations();

    return operations.map(
      (operation): ChatCompletionTool => ({
        type: 'function',
        function: {
          name: operation.name,
          description: operation.description,
          parameters: {
            type: 'object',
            properties: Object.fromEntries(
              operation.parameters.map((param) => {
                const p = [
                  param.name,
                  {
                    type: param.type,
                    description: param.description,
                  },
                ];

                if (param.enum) {
                  // @ts-expect-error better types needed
                  p[1].enum = param.enum;
                }

                return p;
              }),
            ),
            required: operation.parameters
              .filter((param) => param.required)
              .map((param) => param.name),
            strict: true,
            additionalProperties: false,
          },
        },
      }),
    );
  }

  /**
   * Executes a tool call operation with the provided parameters and wallet info.
   * This method handles the execution of both transaction and query operations
   * without directly manipulating the wallet store state.
   *
   * @param operationName - The name of the operation to execute
   * @param params - The parameters for the operation
   * @param walletInfo - Current wallet information
   * @param walletStore - The wallet store instance for operations that need it
   * @returns Promise<string> - The result of the operation
   */
  async executeToolCall(
    operationName: string,
    params: unknown,
    walletInfo: WalletInfo | null,
    walletStore: WalletStore,
  ): Promise<string> {
    console.log(`Executing tool call: ${operationName} with params:`, params);

    const operation = this.get(operationName);
    if (!operation) {
      throw new Error(`Unknown operation type: ${operationName}`);
    }

    // Check if operation needs wallet and if wallet is connected
    if (operation.needsWallet && operation.needsWallet.length > 0) {
      if (!walletInfo || !walletInfo.isConnected) {
        throw new Error('Wallet is required but not connected');
      }
    }

    // Validate the operation parameters using type assertion
    const isValid = await (
      operation as ChainToolCallOperation<unknown>
    ).validate(params, walletStore);
    if (!isValid) {
      throw new Error('Invalid parameters for operation');
    }

    // Execute the operation based on its type
    if ('buildTransaction' in operation) {
      return (operation as ChainToolCallMessage<unknown>).buildTransaction(
        params,
        walletStore,
      );
    } else if ('executeQuery' in operation) {
      return (operation as ChainToolCallQuery<unknown>).executeQuery(
        params,
        walletStore,
      );
    } else if ('executeRequest' in operation) {
      return (
        operation as ChainToolCallOperation<unknown> & {
          executeRequest: (params: unknown) => Promise<string>;
        }
      ).executeRequest(params);
    }

    throw new Error('Invalid operation type');
  }
}

export function initializeToolCallRegistry(): ToolCallRegistry<unknown> {
  const registry = new ToolCallRegistry();

  // Note: EVM tools & chain-specific tools are registered dynamically in App.tsx
  // based on connected wallet state.

  return registry;
}

export type ExecuteToolCall = (
  operationName: string,
  params: unknown,
) => Promise<string>;

export const chainNameToolCallParam = {
  name: 'chainName',
  type: 'string',
  description:
    'name of the chain the user is interacting with, if not specified by the user assume Kava EVM',
  enum: [
    ...Object.keys(chainRegistry[ChainType.EVM]),
    ...Object.keys(chainRegistry[ChainType.COSMOS]),
  ],
  required: true,
};
