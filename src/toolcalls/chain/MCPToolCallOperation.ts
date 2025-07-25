import { getMCPClient, MCPToolDefinition } from '../../utils/mcpClient';
import {
  ChainToolCallOperation,
  MessageParam,
  OperationType,
} from './chainToolCallOperation';
import { ChainType } from './chainsRegistry';
import { InProgressMcpDisplay } from '../components/InProgressMcpDisplay';

export interface McpToolCallParams {
  [key: string]: unknown;
}

/**
 * ChainToolCallOperation implementation that wraps MCP client tool calls.
 * This allows MCP tools to be used within the chain operation framework.
 */
export class McpToolCallOperation
  implements ChainToolCallOperation<McpToolCallParams>
{
  name: string;
  chainType: ChainType;
  description: string;
  parameters: MessageParam[];
  operationType: OperationType;
  needsWallet?: undefined;
  walletMustMatchChainID?: undefined;

  private mcpToolDefinition: MCPToolDefinition;

  constructor(mcpToolDefinition: MCPToolDefinition) {
    this.mcpToolDefinition = mcpToolDefinition;
    this.name = mcpToolDefinition.name;
    this.chainType = ChainType.EVM; // Default to EVM, could be made configurable
    this.description = mcpToolDefinition.description;
    this.operationType = OperationType.QUERY;

    // Convert MCP input schema to MessageParam format
    this.parameters = this.convertSchemaToParameters(
      mcpToolDefinition.inputSchema,
    );
  }

  /**
   * Validates the provided parameters against the MCP tool's input schema
   */
  async validate(params: McpToolCallParams): Promise<boolean> {
    try {
      const schema = this.mcpToolDefinition.inputSchema;
      const required = schema.required || [];

      // Check if all required parameters are present
      for (const requiredParam of required) {
        if (!(requiredParam in params)) {
          return false;
        }
      }

      // Basic type validation could be added here if needed
      return true;
    } catch (error) {
      console.error('Error validating MCP tool parameters:', error);
      return false;
    }
  }

  /**
   * Executes the MCP tool call using the MCP client
   */
  async executeRequest(params: McpToolCallParams): Promise<string> {
    try {
      const mcpClient = getMCPClient();

      // Ensure client is connected
      if (!mcpClient.isConnected) {
        await mcpClient.connect();
      }

      // Call the MCP tool
      const result = await mcpClient.callTool(this.name, params);

      // Convert the result to a string format
      if (result.content && result.content.length > 0) {
        return JSON.stringify(result.content[0], null, 2);
      }

      return JSON.stringify(result, null, 2);
    } catch (error) {
      console.error(`Error executing MCP tool ${this.name}:`, error);
      throw new Error(
        `Failed to execute MCP tool ${this.name}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Converts MCP input schema to MessageParam format for the chain operation interface
   */
  private convertSchemaToParameters(
    schema: MCPToolDefinition['inputSchema'],
  ): MessageParam[] {
    const parameters: MessageParam[] = [];

    if (schema.properties) {
      for (const [propertyName, propertySchema] of Object.entries(
        schema.properties,
      )) {
        const property = propertySchema as Record<string, unknown>;

        const param: MessageParam = {
          name: propertyName,
          type: (property.type as string) || 'string',
          description: (property.description as string) || '',
          required: schema.required?.includes(propertyName) || false,
        };

        // Handle enum values if present
        if (property.enum && Array.isArray(property.enum)) {
          param.enum = property.enum.map((item) => String(item));
        }

        parameters.push(param);
      }
    }

    return parameters;
  }

  /**
   * Creates an McpToolCallOperation from an MCP tool definition
   */
  static fromMcpTool(
    mcpToolDefinition: MCPToolDefinition,
  ): McpToolCallOperation {
    return new McpToolCallOperation(mcpToolDefinition);
  }

  /**
   * Creates multiple McpToolCallOperation instances from MCP tool definitions
   */
  static fromMcpTools(
    mcpToolDefinitions: MCPToolDefinition[],
  ): McpToolCallOperation[] {
    return mcpToolDefinitions.map((tool) =>
      McpToolCallOperation.fromMcpTool(tool),
    );
  }

  inProgressComponent() {
    return InProgressMcpDisplay;
  }
}
