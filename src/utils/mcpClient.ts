import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
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
  private client: Client | null = null;
  public tools: Tool[] = [];
  public readonly isAvailable: boolean;

  constructor(
    private readonly mcpUrl: string = import.meta.env.VITE_MCP_URL || '',
    private readonly apiKey: string = import.meta.env.VITE_LITELLM_API_KEY ||
      '',
  ) {
    this.isAvailable = !!(this.mcpUrl && this.apiKey);

    if (!this.isAvailable) {
      console.warn('MCP client not configured - missing URL or API key');
    }
  }

  get isConnected(): boolean {
    return !!this.client;
  }

  async connect(): Promise<boolean> {
    if (this.isConnected || !this.isAvailable) {
      return this.isConnected;
    }

    try {
      this.client = new Client({
        name: 'hard-ai-client',
        version: '1.0.0',
      });

      const transport = new StreamableHTTPClientTransport(
        new URL(this.mcpUrl),
        {
          requestInit: {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
            },
          },
        },
      );

      await this.client.connect(transport);
      console.log('Connected to MCP server');
      return true;
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      this.client = null;
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
      this.client = null;
      this.tools = [];
    }
  }

  async listTools(): Promise<Tool[]> {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) return [];
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
    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }

    try {
      const result = await this.client!.callTool({
        name,
        arguments: (arguments_ as Record<string, unknown>) || {},
      });
      return result as CallToolResult;
    } catch (error) {
      console.error(`Failed to call MCP tool ${name}:`, error);
      throw error;
    }
  }

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

let mcpClientInstance: MCPClient | null = null;

export function getMCPClient(): MCPClient {
  if (!mcpClientInstance) {
    mcpClientInstance = new MCPClient();
  }

  return mcpClientInstance;
}

export async function initializeMCPClient(): Promise<MCPClient> {
  const client = getMCPClient();
  if (client.isAvailable) {
    try {
      await client.connect();
      await client.listTools();
      console.log('MCP client initialized successfully');
    } catch (error) {
      console.warn('MCP client initialization failed:', error);
    }
  } else {
    console.info('MCP client not configured - running with local tools only');
  }
  return client;
}
