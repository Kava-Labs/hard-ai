import { z } from 'zod';
import { EvmToolOperation, createToolName, EthereumProvider } from './types';

type ChainInfo = {
  name: string;
  chain: string;
  chainId: number;
  networkId?: number;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpc: Array<string | { url: string }>;
  explorers?: Array<{
    name: string;
    url: string;
    standard?: string;
  }>;
  shortName?: string;
  infoURL?: string;
};

export class ChainSearchTool extends EvmToolOperation {
  name = createToolName('chain-search');
  description = 'Search for EVM chain details by name, chainId, or symbol';
  zodSchema = z.object({
    query: z.string().describe('Search query (chain name, chainId, or symbol)'),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe('Maximum number of results to return (default: 10)'),
  });

  // In-memory cache -- a single instance is created in EVM_TOOLS list and reused
  private cachedData: ChainInfo[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private async fetchChainData(): Promise<ChainInfo[]> {
    // Check cache first
    const now = Date.now();
    if (this.cachedData && now - this.cacheTimestamp < this.CACHE_DURATION) {
      return this.cachedData;
    }

    try {
      const response = await fetch('https://chainlist.org/rpcs.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch chain data: ${response.statusText}`);
      }

      const data = await response.json();

      // Update cache
      this.cachedData = data;
      this.cacheTimestamp = now;

      return data;
    } catch (error) {
      console.error('Error fetching chain data:', error);
      throw new Error('Failed to fetch chain data from chainlist.org');
    }
  }

  private searchChains(
    chains: ChainInfo[],
    query: string,
    limit: number,
  ): ChainInfo[] {
    const searchTerm = query.toLowerCase().trim();

    // Try exact chainId match first
    const chainId = parseInt(searchTerm);
    if (!isNaN(chainId)) {
      const exactMatch = chains.filter((chain) => chain.chainId === chainId);
      if (exactMatch.length > 0) {
        return exactMatch.slice(0, limit);
      }
    }

    // Search across multiple fields
    const matches = chains.filter((chain) => {
      const chainIdStr = chain.chainId.toString();
      const name = (chain.name || '').toLowerCase();
      const chainSymbol = (chain.chain || '').toLowerCase();
      const shortName = (chain.shortName || '').toLowerCase();
      const nativeSymbol = (chain.nativeCurrency?.symbol || '').toLowerCase();
      const nativeName = (chain.nativeCurrency?.name || '').toLowerCase();

      return (
        chainIdStr.includes(searchTerm) ||
        name.includes(searchTerm) ||
        chainSymbol.includes(searchTerm) ||
        shortName.includes(searchTerm) ||
        nativeSymbol.includes(searchTerm) ||
        nativeName.includes(searchTerm)
      );
    });

    // Sort by relevance (exact matches first, then by name length)
    matches.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      // Exact name matches first
      if (aName === searchTerm) {
        return -1;
      }
      if (bName === searchTerm) {
        return 1;
      }

      // Then by name length (shorter names are often more relevant)
      return aName.length - bName.length;
    });

    return matches.slice(0, limit);
  }

  private formatChainInfo(chain: ChainInfo): string {
    // Some chains have a lot of RPC URLs, so limit to 3 for display
    const rpcs = Array.isArray(chain.rpc)
      ? chain.rpc
          .slice(0, 3)
          .map((rpc) => (typeof rpc === 'string' ? rpc : rpc.url))
      : [];

    let infoStr = `
**${chain.name}**
- Chain ID: ${chain.chainId}
- Symbol: ${chain.chain || 'N/A'}
- Native Currency: ${chain.nativeCurrency.name} (${chain.nativeCurrency.symbol})
- Decimals: ${chain.nativeCurrency.decimals}
- RPC URLs:\n${rpcs.map((rpc) => `  - ${rpc}`).join('\n')}
`;

    if (chain.networkId) {
      infoStr += `- Network ID: ${chain.networkId}\n`;
    }

    if (chain.explorers && chain.explorers.length > 0) {
      infoStr += `- Explorers:\n`;
      chain.explorers.forEach((explorer) => {
        infoStr += `  - Explorer: [${explorer.name}](${explorer.url})\n`;
      });
    }

    if (chain.infoURL) {
      infoStr += `\n- Info: [More Info](${chain.infoURL})`;
    }

    return infoStr;
  }

  async execute(
    params: unknown,
    _provider?: EthereumProvider,
  ): Promise<string> {
    const { query, limit } = this.zodSchema.parse(params) as {
      query: string;
      limit: number;
    };

    try {
      const chains = await this.fetchChainData();
      const results = this.searchChains(chains, query, limit);

      if (results.length === 0) {
        return `No chains found matching "${query}"`;
      }

      const formatted = results
        .map((chain) => this.formatChainInfo(chain))
        .join('\n---\n');

      const plural = results.length > 1 ? 's' : '';
      const response = `Found ${results.length} chain${plural} matching "${query}":\n\n${formatted}`;

      return response;
    } catch (error) {
      console.error('Error executing chain search:', error);
      return `Error searching for chains: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}
