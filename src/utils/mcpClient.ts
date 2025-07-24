import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export class MCPClient {
  private client: Client | undefined = undefined;
  private isConnected = false;
  private tools: Tool[] = [];
  private readonly mcpUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.mcpUrl = import.meta.env.VITE_MCP_URL || '';
    this.apiKey = import.meta.env.VITE_LITELLM_API_KEY || '';

    if (!this.mcpUrl) {
      console.warn(
        'VITE_MCP_URL not configured, MCP client will not be available',
      );
    }
    if (!this.apiKey) {
      console.warn(
        'VITE_LITELLM_API_KEY not configured, MCP client authentication may fail',
      );
    }
  }

  async connect(): Promise<boolean> {
    if (this.isConnected || !this.mcpUrl) {
      return this.isConnected;
    }

    try {
      const baseUrl = new URL(this.mcpUrl);

      // Try Streamable HTTP transport first
      try {
        this.client = new Client({
          name: 'hard-ai-streamable-http-client',
          version: '1.0.0',
        });

        const transport = new StreamableHTTPClientTransport(baseUrl, {
          requestInit: {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
            },
          },
        });
        await this.client.connect(transport);
        console.log('Connected to MCP server using Streamable HTTP transport');
        this.isConnected = true;
        return true;
      } catch (error) {
        console.log(
          'Streamable HTTP connection failed, falling back to SSE transport',
          error,
        );

        // Fallback to SSE transport
        this.client = new Client({
          name: 'hard-ai-sse-client',
          version: '1.0.0',
        });

        const sseTransport = new SSEClientTransport(baseUrl, {
          requestInit: {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
            },
          },
        });
        await this.client.connect(sseTransport);
        console.log('Connected to MCP server using SSE transport');
        this.isConnected = true;
        return true;
      }
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
      } catch (error) {
        console.error('Error disconnecting from MCP server:', error);
      }
      this.client = undefined;
      this.isConnected = false;
      this.tools = [];
    }
  }

  async listTools(): Promise<Tool[]> {
    if (!this.isConnected || !this.client) {
      const connected = await this.connect();
      if (!connected) {
        return [];
      }
    }

    try {
      const response = await this.client!.listTools();
      this.tools = response.tools || [];
      return this.tools;
    } catch (error) {
      console.error('Failed to list MCP tools:', error);
      return [];
    }
  }

  async callTool(name: string, arguments_: unknown): Promise<CallToolResult> {
    if (!this.isConnected || !this.client) {
      throw new Error('MCP client not connected');
    }

    console.log(`Calling MCP tool: ${name} with arguments:`, arguments_);

    try {
      const result = await this.client.callTool({
        name,
        arguments: (arguments_ as Record<string, unknown>) || {},
      });
      return result as CallToolResult;
    } catch (error) {
      console.error(`Failed to call MCP tool ${name}:`, error);
      throw error;
    }
  }

  getTools(): Tool[] {
    return this.tools;
  }

  isAvailable(): boolean {
    return !!this.mcpUrl && !!this.apiKey;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Convert MCP tools to the format expected by the ToolCallRegistry
  convertToToolDefinitions(): MCPToolDefinition[] {
    return this.tools.map((tool) => ({
      name: tool.name,
      description: tool.description || '',
      inputSchema: (tool.inputSchema as MCPToolDefinition['inputSchema']) || {
        type: 'object',
        properties: {},
        required: [],
      },
    }));
  }
}

// Singleton instance, as it's expensive to create a new client each time
// and we want to maintain state across the application
let mcpClientInstance: MCPClient | null = null;

export function getMCPClient(): MCPClient {
  if (!mcpClientInstance) {
    mcpClientInstance = new MCPClient();
  }

  return mcpClientInstance;
}

export async function initializeMCPClient(): Promise<MCPClient> {
  const client = getMCPClient();
  if (client.isAvailable()) {
    try {
      await client.connect();
      await client.listTools();
      console.log('MCP client initialized successfully');
    } catch (error) {
      console.warn('MCP client initialization failed:', error);
      // Continue without MCP - graceful degradation
    }
  } else {
    console.info('MCP client not configured - running with local tools only');
  }
  return client;
}
