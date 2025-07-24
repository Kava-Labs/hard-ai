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
import { EvmBalancesQuery } from '../evmBalances';
import { EvmTransferMessage } from '../evmTransfer';
import { ERC20ConversionMessage } from '../erc20Conversion';
import { EvmChainSwitchMessage } from '../switchNetwork';
import { WalletInfo } from '../../types';
import { WalletStore } from '../../stores/walletStore';
import { getMCPClient, type MCPToolDefinition } from '../../utils/mcpClient';

/**
 * Central registry for all chain operations (messages and queries).
 * Manages the registration and retrieval of operations, and generates
 * OpenAI tool definitions based on registered operations.
 */
export class ToolCallRegistry<T> {
  /** Map of operation type to operation implementation */
  private operations: Map<string, ChainToolCallOperation<T>> = new Map();
  /** Cache of MCP tools to avoid repeated server calls */
  private mcpTools: MCPToolDefinition[] = [];
  /** Timestamp of last MCP tools fetch */
  private mcpToolsLastFetch = 0;
  /** Cache duration for MCP tools (5 minutes) */
  private readonly mcpToolsCacheDuration = 5 * 60 * 1000;

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
   * Loads MCP tools from the MCP server and caches them.
   * @returns Promise that resolves to array of MCP tool definitions
   */
  async loadMCPTools(): Promise<MCPToolDefinition[]> {
    const now = Date.now();

    // Return cached tools if they're still valid
    if (
      this.mcpTools.length > 0 &&
      now - this.mcpToolsLastFetch < this.mcpToolsCacheDuration
    ) {
      return this.mcpTools;
    }

    try {
      const mcpClient = getMCPClient();
      if (!mcpClient.isAvailable()) {
        return [];
      }

      await mcpClient.listTools();
      this.mcpTools = mcpClient.convertToToolDefinitions();
      this.mcpToolsLastFetch = now;

      console.log(`Loaded ${this.mcpTools.length} MCP tools`);
      return this.mcpTools;
    } catch (error) {
      console.warn(
        'Failed to load MCP tools, continuing with local tools only:',
        error,
      );

      // Clear cached tools on error to avoid stale data
      this.mcpTools = [];
      this.mcpToolsLastFetch = 0;
      return [];
    }
  }

  /**
   * Checks if a tool name corresponds to an MCP tool.
   * @param toolName - Name of the tool to check
   * @returns True if it's an MCP tool, false otherwise
   */
  isMCPTool(toolName: string): boolean {
    return this.mcpTools.some((tool) => tool.name === toolName);
  }

  /**
   * Gets cached MCP tools without fetching from server.
   * @returns Array of cached MCP tool definitions
   */
  getMCPTools(): MCPToolDefinition[] {
    return this.mcpTools;
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
   * Generates OpenAI tool definitions for all registered operations and MCP tools.
   * These definitions are used to create function-calling tools in the AI model.
   * @param webSearchEnabled - Whether to include web search related tools
   * @param includeMCPTools - Whether to include MCP tools
   * @returns Array of tool definitions in OpenAI format
   */
  async getToolDefinitions(
    webSearchEnabled = true,
    includeMCPTools = true,
  ): Promise<ChatCompletionTool[]> {
    // Filter local operations based on webSearchEnabled
    const operations = this.getAllOperations();

    // Convert local operations to OpenAI tool format
    const localTools = operations.map(
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

    // Add MCP tools if enabled
    if (includeMCPTools) {
      try {
        const mcpToolDefs = await this.loadMCPTools();

        // Filter MCP tools based on webSearchEnabled
        // If webSearchEnabled is false, filter out tools starting with 'exa_mcp'
        const filteredMcpToolDefs = webSearchEnabled
          ? mcpToolDefs
          : mcpToolDefs.filter((tool) => !tool.name.startsWith('exa_mcp'));

        // Debug logging for MCP tool filtering
        if (
          !webSearchEnabled &&
          mcpToolDefs.length > filteredMcpToolDefs.length
        ) {
          const filteredOutTools = mcpToolDefs.filter((tool) =>
            tool.name.startsWith('exa_mcp'),
          );
          console.log(
            `[MCP] Web search disabled - filtered out ${filteredOutTools.length} exa_mcp tools:`,
            filteredOutTools.map((t) => t.name),
          );
        }

        console.log(
          `[MCP] Loading ${filteredMcpToolDefs.length} MCP tools (webSearchEnabled: ${webSearchEnabled}):`,
          filteredMcpToolDefs.map((t) => t.name),
        );

        const mcpTools = filteredMcpToolDefs.map(
          (mcpTool): ChatCompletionTool => ({
            type: 'function',
            function: {
              name: mcpTool.name,
              description: mcpTool.description,
              parameters: {
                type: mcpTool.inputSchema.type,
                properties: mcpTool.inputSchema.properties || {},
                required: mcpTool.inputSchema.required || [],
                strict: true,
                additionalProperties: false,
              },
            },
          }),
        );

        return [...localTools, ...mcpTools];
      } catch (error) {
        console.error('Failed to load MCP tools for tool definitions:', error);
        return localTools;
      }
    }

    return localTools;
  }

  /**
   * Executes a tool call operation with the provided parameters and wallet info.
   * This method handles the execution of both transaction and query operations
   * without directly manipulating the wallet store state, as well as MCP tool calls.
   *
   * @param operationName - The name of the operation to execute
   * @param params - The parameters for the operation
   * @param walletInfo - Current wallet information
   * @param walletStore - The wallet store instance for operations that need it
   * @param webSearchEnabled - Whether web search is enabled (for MCP tool filtering)
   * @returns Promise<string> - The result of the operation
   */
  async executeToolCall(
    operationName: string,
    params: unknown,
    walletInfo: WalletInfo | null,
    walletStore: WalletStore,
    webSearchEnabled = true,
  ): Promise<string> {
    console.log(`Executing tool call: ${operationName} with params:`, params);

    // Check if this is an MCP tool first
    if (this.isMCPTool(operationName)) {
      // Check if this is a filtered exa_mcp tool when web search is disabled
      if (!webSearchEnabled && operationName.startsWith('exa_mcp')) {
        throw new Error(
          `Web search tool '${operationName}' is not available when web search is disabled`,
        );
      }

      try {
        const mcpClient = getMCPClient();
        const result = await mcpClient.callTool(operationName, params);

        // Handle different result content types
        if (result.content && Array.isArray(result.content)) {
          return result.content
            .map((content: any) => {
              if (content.type === 'text') {
                return content.text;
              }
              return JSON.stringify(content);
            })
            .join('\n');
        } else if (result.content) {
          return JSON.stringify(result.content);
        } else {
          return 'MCP tool executed successfully';
        }
      } catch (error) {
        console.error(`Failed to execute MCP tool ${operationName}:`, error);
        throw new Error(
          `MCP tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    // Handle local operations
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
  registry.register(new EvmTransferMessage());
  registry.register(new EvmBalancesQuery());
  registry.register(new ERC20ConversionMessage());
  registry.register(new EvmChainSwitchMessage());

  return registry;
}

export type ExecuteToolCall = (
  operationName: string,
  params: unknown,
) => Promise<string>;
