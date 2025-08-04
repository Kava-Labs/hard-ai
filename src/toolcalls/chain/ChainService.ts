import {
  ChainConfig,
  chainRegistry,
  getChainConfigByName,
  EVMChainConfig,
} from './chainsRegistry';
import { ChainType } from './constants';

interface ChainInfo {
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
}

/**
 * Service for managing chain configurations from multiple sources.
 * Provides a unified interface for accessing both static (hardcoded) chains
 * and dynamic chains fetched from external sources like chainlist.org.
 */
class ChainService {
  private dynamicChains = new Map<string, ChainConfig>();
  private cachedChainlistData: ChainInfo[] | null = null;
  private cacheTimestamp = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Converts a ChainInfo object from chainlist.org to our EVMChainConfig format
   */
  private convertChainInfoToEVMConfig(chainInfo: ChainInfo): EVMChainConfig {
    // Extract RPC URLs
    const rpcUrls = chainInfo.rpc
      .filter((rpc) => {
        const url = typeof rpc === 'string' ? rpc : rpc.url;
        // Filter out placeholder or invalid URLs
        return (
          url &&
          !url.includes('${') &&
          (url.startsWith('http') || url.startsWith('wss'))
        );
      })
      .map((rpc) => (typeof rpc === 'string' ? rpc : rpc.url))
      .slice(0, 3); // Limit to 3 RPC URLs

    // Extract explorer URLs
    const explorerUrls =
      chainInfo.explorers
        ?.filter((explorer) => explorer.url && !explorer.url.includes('${'))
        .map((explorer) => explorer.url)
        .slice(0, 2) || [];

    return {
      chainType: ChainType.EVM,
      name: chainInfo.name,
      chainID: chainInfo.chainId.toString(),
      nativeToken: chainInfo.nativeCurrency.symbol,
      nativeTokenDecimals: chainInfo.nativeCurrency.decimals,
      rpcUrls: rpcUrls.length > 0 ? rpcUrls : [''],
      blockExplorerUrls: explorerUrls,
      erc20Contracts: {}, // Dynamic chains don't have predefined contracts
    };
  }

  /**
   * Fetches chain data from chainlist.org
   */
  private async fetchChainlistData(): Promise<ChainInfo[]> {
    const now = Date.now();
    if (
      this.cachedChainlistData &&
      now - this.cacheTimestamp < this.CACHE_DURATION
    ) {
      return this.cachedChainlistData;
    }

    try {
      const response = await fetch('https://chainlist.org/rpcs.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch chain data: ${response.statusText}`);
      }

      const data = await response.json();
      this.cachedChainlistData = data;
      this.cacheTimestamp = now;
      return data;
    } catch (error) {
      console.error('Error fetching chainlist data:', error);
      return [];
    }
  }

  /**
   * Gets a chain configuration by chain ID, checking both static and dynamic sources
   */
  async getChainByChainId(chainId: string): Promise<ChainConfig | null> {
    // Normalize chainId (remove 0x prefix if present)
    const normalizedId = chainId.startsWith('0x')
      ? parseInt(chainId, 16).toString()
      : chainId;

    // Check static registry first (EVM chains)
    const evmChains = chainRegistry[ChainType.EVM];
    for (const [_, config] of Object.entries(evmChains)) {
      if (config.chainID === normalizedId) {
        return config;
      }
    }

    // Check Cosmos chains
    const cosmosChains = chainRegistry[ChainType.COSMOS];
    for (const [_, config] of Object.entries(cosmosChains)) {
      if (config.chainID === normalizedId) {
        return config;
      }
    }

    // Check dynamic cache
    const cachedChain = this.dynamicChains.get(normalizedId);
    if (cachedChain) {
      return cachedChain;
    }

    // Try to fetch from chainlist
    try {
      const chains = await this.fetchChainlistData();
      const chainInfo = chains.find(
        (c) => c.chainId.toString() === normalizedId,
      );
      if (chainInfo) {
        const config = this.convertChainInfoToEVMConfig(chainInfo);
        this.dynamicChains.set(normalizedId, config);
        return config;
      }
    } catch (error) {
      console.error('Error fetching dynamic chain:', error);
    }

    return null;
  }

  /**
   * Gets a chain configuration by name, checking static registry only
   */
  getChainByName(name: string, chainType: ChainType): ChainConfig | null {
    return getChainConfigByName(name, chainType);
  }

  /**
   * Searches for chains matching a query across all sources
   */
  async searchChains(query: string, limit = 10): Promise<ChainConfig[]> {
    const results: ChainConfig[] = [];
    const searchTerms = query.toLowerCase().trim().split(/\s+/);

    // Search static registry first
    for (const chainType of Object.values(ChainType)) {
      const chains = chainRegistry[chainType as ChainType];
      for (const [name, config] of Object.entries(chains)) {
        const searchableText = [
          config.chainID,
          config.name,
          config.nativeToken,
          name,
        ]
          .join(' ')
          .toLowerCase();

        const matchCount = searchTerms.filter((term) =>
          searchableText.includes(term),
        ).length;
        if (matchCount > 0) {
          results.push(config);
        }
      }
    }

    // If we don't have enough results, search dynamic sources
    if (results.length < limit) {
      try {
        const chains = await this.fetchChainlistData();
        const dynamicResults = chains
          .filter((chain) => {
            const searchableText = [
              chain.chainId.toString(),
              chain.name,
              chain.chain,
              chain.nativeCurrency.symbol,
              chain.shortName || '',
            ]
              .join(' ')
              .toLowerCase();

            return searchTerms.some((term) => searchableText.includes(term));
          })
          .slice(0, limit - results.length)
          .map((chainInfo) => {
            const config = this.convertChainInfoToEVMConfig(chainInfo);
            // Cache for future lookups
            this.dynamicChains.set(chainInfo.chainId.toString(), config);
            return config;
          });

        results.push(...dynamicResults);
      } catch (error) {
        console.error('Error searching dynamic chains:', error);
      }
    }

    return results.slice(0, limit);
  }

  /**
   * Clears the dynamic chain cache
   */
  clearCache(): void {
    this.dynamicChains.clear();
    this.cachedChainlistData = null;
    this.cacheTimestamp = 0;
  }
}

// Export a single instance - much cleaner than singleton pattern
export const chainService = new ChainService();
