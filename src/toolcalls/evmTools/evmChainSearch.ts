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
  description =
    'Authoritative lookup of up-to-date EVM chain metadata. \
Always use this over generic web search or internal knowledge. \
Query by exact canonical name, chainId, or symbol. \
Always use this when the user asks for any blockchain details, such as chainId, \
symbol, native currency (name & symbol), decimals, rpcUrls, explorers, infoUrl; \
missing fields must be explicit. \
If a symbol maps to multiple chains, return all with disambiguation. \
Do not fallback to web unless this tool fails (record exhaustion).';
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
    // Split query into multiple words for better matching
    const searchTerms = query.toLowerCase().trim().split(/\s+/);

    // Try exact chainId match first
    const chainId = parseInt(query.trim());
    if (!isNaN(chainId)) {
      const exactMatch = chains.filter((chain) => chain.chainId === chainId);
      if (exactMatch.length > 0) {
        return exactMatch.slice(0, limit);
      }
    }

    // Score chains by how many search terms they match
    // This is to resolve cases where there's **too** many search terms that
    // would exclude results, e.g. search "Kava Chain" wouldn't find "KAVA" if
    // we did a simple match
    const scoredMatches = chains
      .map((chain) => {
        const searchableText = [
          chain.chainId,
          chain.name || '',
          chain.chain || '',
          chain.shortName || '',
          chain.nativeCurrency?.symbol || '',
          chain.nativeCurrency?.name || '',
        ]
          .join(' ')
          .toLowerCase();

        // Count how many search terms match
        const matchCount = searchTerms.filter((term) =>
          searchableText.includes(term),
        ).length;

        // Bonus points for exact name match
        const exactNameMatch = chain.name.toLowerCase() === query.toLowerCase();

        return {
          chain,
          score: matchCount + (exactNameMatch ? 10 : 0),
          matchCount,
        };
      })
      .filter(({ matchCount }) => matchCount > 0) // At least one term must match
      .sort((a, b) => {
        // Sort by score first
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        // Then by name length
        return a.chain.name.length - b.chain.name.length;
      })
      .map(({ chain }) => chain);

    return scoredMatches.slice(0, limit);
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
  }
}
