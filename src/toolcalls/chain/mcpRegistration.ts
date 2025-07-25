import { initializeMCPClient } from '../../utils/mcpClient';
import { McpToolCallOperation } from './MCPToolCallOperation';
import { ToolCallRegistry } from './ToolCallRegistry';

/**
 * Helper function to register all available MCP tools with a ToolCallRegistry
 * @param registry - The ToolCallRegistry to register tools with
 * @param mcpClient - Optional MCP client instance, will use singleton if not provided
 */
export async function registerMcpToolsWithRegistry(
  registry: ToolCallRegistry<unknown>,
): Promise<void> {
  try {
    const client = await initializeMCPClient();

    // Ensure client is connected and get available tools
    if (!client.isConnected) {
      await client.connect();
    }

    const toolDefinitions = client.convertToToolDefinitions();

    // Create and register McpToolCallOperation instances, using WebSearchMcpOperation for web search tools
    const mcpOperations = toolDefinitions.map((toolDefinition) => {
      return McpToolCallOperation.fromMcpTool(toolDefinition);
    });

    for (const operation of mcpOperations) {
      registry.register(operation);
    }

    console.log(
      `Registered ${mcpOperations.length} MCP tools with ToolCallRegistry`,
    );
  } catch (error) {
    console.warn('Failed to register MCP tools with registry:', error);
    // Continue without MCP tools - graceful degradation
  }
}

export function deregisterMcpToolsFromRegistry(
  registry: ToolCallRegistry<unknown>,
): void {
  const allOperations = registry.getAllOperations();
  const mcpOperations = allOperations.filter(
    (op) => op instanceof McpToolCallOperation,
  );

  for (const op of mcpOperations) {
    registry.deregister(op);
  }

  console.log(`Deregistered ${mcpOperations.length} MCP tools from registry`);
}
