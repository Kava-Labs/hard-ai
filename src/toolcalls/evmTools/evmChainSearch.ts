import { z } from 'zod';
import { EvmToolOperation, createToolName, EthereumProvider } from './types';
import { chainService } from '../chain/ChainService';
import { ChainConfig } from '../chain/chainsRegistry';

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

  private formatChainConfig(chain: ChainConfig): string {
    let infoStr = `
**${chain.name}**
- Chain ID: ${chain.chainID}
- Chain Type: ${chain.chainType}
- Native Currency: ${chain.nativeToken}
- Decimals: ${chain.nativeTokenDecimals}
- RPC URLs:\n${chain.rpcUrls
      .slice(0, 3)
      .map((rpc) => `  - ${rpc}`)
      .join('\n')}
`;

    if (chain.blockExplorerUrls && chain.blockExplorerUrls.length > 0) {
      infoStr += `- Explorers:\n`;
      chain.blockExplorerUrls.slice(0, 2).forEach((url) => {
        infoStr += `  - ${url}\n`;
      });
    }

    // Add token info for known chains
    if (
      chain.chainType === 'evm' &&
      Object.keys(chain.erc20Contracts).length > 0
    ) {
      infoStr += `- Known ERC20 Tokens: ${Object.keys(chain.erc20Contracts).slice(0, 5).join(', ')}`;
      if (Object.keys(chain.erc20Contracts).length > 5) {
        infoStr += ` (and ${Object.keys(chain.erc20Contracts).length - 5} more)`;
      }
      infoStr += '\n';
    }

    if (chain.chainType === 'cosmos' && 'bech32Prefix' in chain) {
      infoStr += `- Bech32 Prefix: ${chain.bech32Prefix}\n`;
      if (Object.keys(chain.denoms).length > 0) {
        infoStr += `- Known Denoms: ${Object.keys(chain.denoms).slice(0, 5).join(', ')}`;
        if (Object.keys(chain.denoms).length > 5) {
          infoStr += ` (and ${Object.keys(chain.denoms).length - 5} more)`;
        }
        infoStr += '\n';
      }
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

    // Try exact chain ID lookup first
    const chainId = parseInt(query.trim());
    if (!isNaN(chainId)) {
      const chain = await chainService.getChainByChainId(chainId.toString());
      if (chain) {
        return `Found chain with ID ${chainId}:\n\n${this.formatChainConfig(chain)}`;
      }
    }

    // Otherwise do a search
    const results = await chainService.searchChains(query, limit);

    if (results.length === 0) {
      return `No chains found matching "${query}"`;
    }

    const formatted = results
      .map((chain) => this.formatChainConfig(chain))
      .join('\n---\n');

    const plural = results.length > 1 ? 's' : '';
    const response = `Found ${results.length} chain${plural} matching "${query}":\n\n${formatted}`;

    return response;
  }
}
