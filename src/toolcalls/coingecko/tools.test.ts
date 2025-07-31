import { describe, expect, it, vi } from 'vitest';
import { coinGeckoClient } from './client';
import {
  GetSimplePricesTool,
  GetTokenPricesTool,
  SearchCoinsTool,
} from './tools';

// Mock the CoinGecko client
vi.mock('./client', () => ({
  coinGeckoClient: {
    searchCoins: vi.fn(),
    getSimplePrice: vi.fn(),
    getTokenPrice: vi.fn(),
  },
}));

describe('CoinGecko Tools', () => {
  const mockCoinGeckoClient = coinGeckoClient as ReturnType<
    typeof vi.mocked<typeof coinGeckoClient>
  >;

  describe('SearchCoinsTool', () => {
    it('should search for coins successfully', async () => {
      const mockResponse = {
        data: {
          coins: [
            {
              id: 'ethereum',
              name: 'Ethereum',
              symbol: 'ETH',
              market_cap_rank: 2,
              thumb: 'https://example.com/thumb.png',
            },
          ],
        },
        error: null,
        coins: [
          {
            id: 'ethereum',
            name: 'Ethereum',
            symbol: 'ETH',
            market_cap_rank: 2,
            thumb: 'https://example.com/thumb.png',
          },
        ],
      };

      mockCoinGeckoClient.searchCoins.mockResolvedValue(mockResponse as any);

      const tool = new SearchCoinsTool();
      const result = await tool.executeRequest({ query: 'ethereum' });

      const parsedResult = JSON.parse(result);
      expect(parsedResult.message).toContain(
        'Found 1 coins matching "ethereum"',
      );
      expect(parsedResult.coins).toHaveLength(1);
      expect(parsedResult.coins[0].id).toBe('ethereum');
    });

    it('should handle search errors', async () => {
      mockCoinGeckoClient.searchCoins.mockResolvedValue({
        data: null,
        error: 'API rate limit exceeded',
        coins: [],
      });

      const tool = new SearchCoinsTool();

      await expect(tool.executeRequest({ query: 'ethereum' })).rejects.toThrow(
        'Search failed: API rate limit exceeded',
      );
    });
  });

  describe('GetSimplePricesTool', () => {
    it('should get simple prices successfully', async () => {
      const mockResponse = {
        data: {
          bitcoin: { usd: 50000 },
          ethereum: { usd: 3000 },
        },
        error: null,
        unknownCoinIds: [],
      };

      mockCoinGeckoClient.getSimplePrice.mockResolvedValue(mockResponse);

      const tool = new GetSimplePricesTool();
      const result = await tool.executeRequest({
        coinIds: ['bitcoin', 'ethereum'],
      });

      const parsedResult = JSON.parse(result);
      expect(parsedResult.message).toContain(
        'Retrieved price data for 2 coins',
      );
      expect(parsedResult.prices).toEqual(mockResponse.data);
    });

    it('should handle unknown coin IDs', async () => {
      const mockResponse = {
        data: { bitcoin: { usd: 50000 } },
        error: null,
        unknownCoinIds: ['invalid-coin'],
      };

      mockCoinGeckoClient.getSimplePrice.mockResolvedValue(mockResponse);

      const tool = new GetSimplePricesTool();
      const result = await tool.executeRequest({
        coinIds: ['bitcoin', 'invalid-coin'],
      });

      const parsedResult = JSON.parse(result);
      expect(parsedResult.warning).toContain(
        'Some requested coins were not found',
      );
      expect(parsedResult.unknownCoinIds).toEqual(['invalid-coin']);
    });
  });

  describe('GetTokenPricesTool', () => {
    it('should get token prices successfully', async () => {
      const mockResponse = {
        data: {
          '0xdac17f958d2ee523a2206206994597c13d831ec7': { usd: 1.0 },
        },
        error: null,
        unknownContractAddresses: [],
      };

      mockCoinGeckoClient.getTokenPrice.mockResolvedValue(mockResponse);

      const tool = new GetTokenPricesTool();
      const result = await tool.executeRequest({
        networkId: 'ethereum',
        contractAddresses: ['0xdAC17F958D2ee523a2206206994597C13D831ec7'],
      });

      const parsedResult = JSON.parse(result);
      expect(parsedResult.message).toContain(
        'Retrieved price data for 1 tokens on ethereum',
      );
      expect(parsedResult.prices).toEqual(mockResponse.data);
    });
  });

  describe('Tool Validation', () => {
    it('should validate parameters correctly', async () => {
      const tool = new SearchCoinsTool();

      // Valid parameters
      const isValid = await tool.validate({ query: 'ethereum' });
      expect(isValid).toBe(true);

      // Invalid parameters (missing required field)
      await expect(tool.validate({})).rejects.toThrow();
    });
  });
});
