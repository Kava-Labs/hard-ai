import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoinGeckoClient } from './client';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('CoinGeckoClient', () => {
  let client: CoinGeckoClient;

  beforeEach(() => {
    client = new CoinGeckoClient();
    vi.clearAllMocks();
  });

  describe('searchCoins', () => {
    it('should search for coins successfully', async () => {
      const mockResponse = {
        coins: [
          {
            id: 'ethereum',
            name: 'Ethereum',
            api_symbol: 'ethereum',
            symbol: 'ETH',
            market_cap_rank: 2,
            thumb:
              'https://coin-images.coingecko.com/coins/images/279/thumb/ethereum.png',
            large:
              'https://coin-images.coingecko.com/coins/images/279/large/ethereum.png',
          },
        ],
        categories: [],
        nfts: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.searchCoins('ethereum');

      expect(result.error).toBeNull();
      expect(result.coins).toHaveLength(1);
      expect(result.coins[0].id).toBe('ethereum');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          'https://api.coingecko.com/api/v3/search?query=ethereum',
        ),
      );
    });

    it('should limit results when numResponses is provided', async () => {
      const mockResponse = {
        coins: [
          {
            id: 'ethereum',
            name: 'Ethereum',
            api_symbol: 'ethereum',
            symbol: 'ETH',
            market_cap_rank: 2,
            thumb: '',
            large: '',
          },
          {
            id: 'ethereum-classic',
            name: 'Ethereum Classic',
            api_symbol: 'ethereum-classic',
            symbol: 'ETC',
            market_cap_rank: 45,
            thumb: '',
            large: '',
          },
        ],
        categories: [],
        nfts: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.searchCoins('ethereum', 1);

      expect(result.coins).toHaveLength(1);
      expect(result.coins[0].id).toBe('ethereum');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limit exceeded'),
      });

      const result = await client.searchCoins('ethereum');

      expect(result.error).toBe('HTTP 429: Rate limit exceeded');
      expect(result.coins).toHaveLength(0);
    });
  });

  describe('getSimplePrice', () => {
    it('should fetch simple prices successfully', async () => {
      const mockResponse = {
        bitcoin: {
          usd: 50000,
          usd_market_cap: 1000000000000,
          usd_24h_vol: 50000000000,
          usd_24h_change: 2.5,
          last_updated_at: 1640995200,
        },
        ethereum: {
          usd: 3000,
          usd_market_cap: 400000000000,
          usd_24h_vol: 20000000000,
          usd_24h_change: 1.8,
          last_updated_at: 1640995200,
        },
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.getSimplePrice(['bitcoin', 'ethereum']);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockResponse);
      expect(result.unknownCoinIds).toHaveLength(0);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin%2Cethereum',
        ),
      );
    });

    it('should track unknown coin IDs', async () => {
      const mockResponse = {
        bitcoin: { usd: 50000 },
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.getSimplePrice(['bitcoin', 'invalid-coin']);

      expect(result.unknownCoinIds).toEqual(['invalid-coin']);
      expect(result.data?.bitcoin).toBeDefined();
    });
  });

  describe('getTokenPrice', () => {
    it('should fetch token prices successfully', async () => {
      const mockResponse = {
        '0xdac17f958d2ee523a2206206994597c13d831ec7': {
          usd: 1.0,
          usd_market_cap: 100000000000,
          usd_24h_vol: 50000000000,
          usd_24h_change: 0.1,
          last_updated_at: 1640995200,
        },
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.getTokenPrice('ethereum', [
        '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      ]);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockResponse);
      expect(result.unknownContractAddresses).toHaveLength(0);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          'https://api.coingecko.com/api/v3/simple/token_price/ethereum',
        ),
      );
    });

    it('should track unknown contract addresses', async () => {
      const mockResponse = {
        '0xdac17f958d2ee523a2206206994597c13d831ec7': { usd: 1.0 },
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.getTokenPrice('ethereum', [
        '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        '0x1234567890123456789012345678901234567890',
      ]);

      expect(result.unknownContractAddresses).toEqual([
        '0x1234567890123456789012345678901234567890',
      ]);
    });
  });
});
