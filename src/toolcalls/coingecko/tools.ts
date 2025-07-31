import { z } from 'zod';
import {
  ChainToolCallWalletAction,
  MessageParam,
  OperationType,
} from '../chain/chainToolCallOperation';
import { ChainType } from '../chain/constants';
import { zodSchemaToMessageParams } from '../helpers/zod';
import { coinGeckoClient } from './client';

// CoinGecko tools namespace
export const COINGECKO_NAMESPACE = 'coingecko';

// Helper to create tool names with proper namespace
export const createCoinGeckoToolName = (toolName: string): string =>
  `${COINGECKO_NAMESPACE}-${toolName}`;

// Base class for CoinGecko tools
export abstract class CoinGeckoToolOperation
  implements ChainToolCallWalletAction<unknown>
{
  abstract name: string;
  abstract description: string;
  abstract zodSchema: z.ZodSchema;
  abstract execute(params: unknown): Promise<string>;

  chainType = ChainType.EVM; // CoinGecko tools are EVM-compatible
  operationType = OperationType.QUERY;
  needsWallet = undefined; // CoinGecko tools don't require wallet connection

  get parameters(): MessageParam[] {
    return zodSchemaToMessageParams(this.zodSchema);
  }

  async validate(params: unknown): Promise<boolean> {
    const result = this.zodSchema.safeParse(params);
    if (!result.success) {
      throw new Error(
        `Invalid parameters passed to ${this.name}: ${result.error.message}`,
      );
    }
    return true;
  }

  async executeRequest(params: unknown): Promise<string> {
    return this.execute(params);
  }
}

/**
 * Search for coins by query string
 */
export class SearchCoinsTool extends CoinGeckoToolOperation {
  name = createCoinGeckoToolName('search-coins');
  description =
    'Search for cryptocurrencies by name or symbol. Returns a list of matching coins with their IDs, names, symbols, and market cap rankings. Use this to discover the correct coin ID for other CoinGecko operations.';
  zodSchema = z.object({
    query: z
      .string()
      .describe('Search query (e.g., "ethereum", "bitcoin", "USDT")'),
    numResponses: z
      .number()
      .optional()
      .describe('Optional limit on number of results returned (default: 3)'),
  });

  async execute(params: unknown): Promise<string> {
    const { query, numResponses = 3 } = this.zodSchema.parse(params) as {
      query: string;
      numResponses?: number;
    };

    const result = await coinGeckoClient.searchCoins(query, numResponses);

    if (result.error) {
      throw new Error(`Search failed: ${result.error}`);
    }

    if (result.coins.length === 0) {
      return JSON.stringify(
        {
          message: `No coins found matching "${query}"`,
          coins: [],
        },
        null,
        2,
      );
    }

    return JSON.stringify(
      {
        message: `Found ${result.coins.length} coins matching "${query}"`,
        coins: result.coins.map((coin) => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          marketCapRank: coin.market_cap_rank,
          thumb: coin.thumb,
        })),
      },
      null,
      2,
    );
  }
}

/**
 * Get simple price information for native currencies
 */
export class GetSimplePricesTool extends CoinGeckoToolOperation {
  name = createCoinGeckoToolName('get-simple-prices');
  description =
    'Get current price information for native cryptocurrencies (e.g., Bitcoin, Ethereum). Returns USD price, market cap, 24h volume, and 24h price change. **Note: a `coinIds` array, not `coinId` or `id`.**';
  zodSchema = z.object({
    coinIds: z
      .array(z.string())
      .describe('Array of coin IDs (e.g., ["bitcoin", "ethereum", "kava"]).'),
    vsCurrencies: z
      .array(z.string())
      .optional()
      .describe('Array of target currencies (default: ["usd"])'),
  });

  async execute(params: unknown): Promise<string> {
    const { coinIds, vsCurrencies = ['usd'] } = this.zodSchema.parse(
      params,
    ) as {
      coinIds: string[];
      vsCurrencies?: string[];
    };

    const result = await coinGeckoClient.getSimplePrice(coinIds, vsCurrencies);

    if (result.error) {
      throw new Error(`Price fetch failed: ${result.error}`);
    }

    const response: Record<string, unknown> = {
      message: `Retrieved price data for ${coinIds.length - result.unknownCoinIds.length} coins`,
      prices: result.data,
    };

    if (result.unknownCoinIds.length > 0) {
      response.unknownCoinIds = result.unknownCoinIds;
      response.warning = `Some requested coins were not found: ${result.unknownCoinIds.join(', ')}`;
    }

    return JSON.stringify(response, null, 2);
  }
}

/**
 * Get token prices for non-native tokens (e.g., ERC20s)
 */
export class GetTokenPricesTool extends CoinGeckoToolOperation {
  name = createCoinGeckoToolName('get-token-prices');
  description =
    'Get current price information for non-native tokens (e.g., ERC20s, BEP20s) by contract address. Returns USD price, market cap, 24h volume, and 24h price change. Note: Due to CoinGecko API limitations, multiple contract addresses will be processed individually.';
  zodSchema = z.object({
    networkId: z
      .string()
      .describe(
        'Coingecko network ID (e.g., "bitcoin", "ethereum", "binance-smart-chain", "polygon-pos")',
      ),
    contractAddresses: z
      .array(z.string())
      .describe(
        'Array of contract addresses (e.g., ["0xdAC17F958D2ee523a2206206994597C13D831ec7"] for USDT)',
      ),
    vsCurrencies: z
      .array(z.string())
      .optional()
      .describe('Array of target currencies (default: ["usd"])'),
  });

  async execute(params: unknown): Promise<string> {
    const {
      networkId,
      contractAddresses,
      vsCurrencies = ['usd'],
    } = this.zodSchema.parse(params) as {
      networkId: string;
      contractAddresses: string[];
      vsCurrencies?: string[];
    };

    const result = await coinGeckoClient.getTokenPrice(
      networkId,
      contractAddresses,
      vsCurrencies,
    );

    if (result.error) {
      throw new Error(`Token price fetch failed: ${result.error}`);
    }

    const response: Record<string, unknown> = {
      message: `Retrieved price data for ${contractAddresses.length - result.unknownContractAddresses.length} tokens on ${networkId}`,
      platformId: networkId,
      prices: result.data,
    };

    if (result.unknownContractAddresses.length > 0) {
      response.unknownContractAddresses = result.unknownContractAddresses;
      response.warning = `Some requested tokens were not found: ${result.unknownContractAddresses.join(', ')}`;
    }

    return JSON.stringify(response, null, 2);
  }
}

// Centralized list of CoinGecko tools (maintaining alphabetical order)
export const COINGECKO_TOOLS = [
  new GetSimplePricesTool(),
  new GetTokenPricesTool(),
  new SearchCoinsTool(),
];
