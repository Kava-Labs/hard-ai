/**
 * CoinGecko API Client
 * Provides functionality to search for coins, fetch native currency prices, and fetch token prices
 */

// Environment variable for API key
const COINGECKO_API_KEY = import.meta.env.VITE_COINGECKO_API_KEY;

// Base API URL
const BASE_URL = 'https://api.coingecko.com/api/v3';

// Types for API responses
export interface CoinGeckoCoin {
  id: string;
  name: string;
  api_symbol: string;
  symbol: string;
  market_cap_rank: number;
  thumb: string;
  large: string;
}

export interface CoinGeckoSearchResponse {
  coins: CoinGeckoCoin[];
  categories: Array<{ id: string; name: string }>;
  nfts: Array<{ id: string; name: string; symbol: string; thumb: string }>;
}

export interface PriceData {
  usd?: number;
  usd_market_cap?: number;
  usd_24h_vol?: number;
  usd_24h_change?: number;
  last_updated_at?: number;
}

export interface SimplePriceResponse {
  [coinId: string]: PriceData;
}

export interface TokenPriceResponse {
  [contractAddress: string]: PriceData;
}

export interface CoinGeckoError {
  error: string;
  message?: string;
}

// Client class
export class CoinGeckoClient {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = COINGECKO_API_KEY;
  }

  /**
   * Builds query parameters for API requests
   */
  private buildQueryParams(
    params: Record<string, string | number | boolean>,
  ): string {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }

    // Add API key if available
    if (this.apiKey) {
      searchParams.append('x_cg_demo_api_key', this.apiKey);
    }

    return searchParams.toString();
  }

  /**
   * Makes a safe fetch request with error handling
   */
  private async safeFetch<T>(
    url: string,
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      if (import.meta.env.DEV) {
        console.log('Making request to:', url);
      }
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage: string;

        try {
          const errorData = JSON.parse(errorText) as CoinGeckoError;
          errorMessage =
            errorData.message || errorData.error || `HTTP ${response.status}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${errorText}`;
        }

        if (import.meta.env.DEV) {
          console.error('CoinGecko API error:', {
            status: response.status,
            statusText: response.statusText,
            url,
            errorText,
            errorMessage,
          });
        }

        return { data: null, error: errorMessage };
      }

      const data = (await response.json()) as T;
      return { data, error: null };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('CoinGecko API request failed:', {
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      return {
        data: null,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Search for coins by query
   * @param query - Search query (e.g., "ethereum")
   * @param numResponses - Optional limit on number of coin results returned
   */
  async searchCoins(
    query: string,
    numResponses?: number,
  ): Promise<{
    data: CoinGeckoSearchResponse | null;
    error: string | null;
    coins: CoinGeckoCoin[];
  }> {
    const params = { query };
    const queryString = this.buildQueryParams(params);
    const url = `${BASE_URL}/search?${queryString}`;

    const result = await this.safeFetch<CoinGeckoSearchResponse>(url);

    if (result.error) {
      return { data: null, error: result.error, coins: [] };
    }

    const coins = result.data?.coins || [];
    const limitedCoins = numResponses ? coins.slice(0, numResponses) : coins;

    return {
      data: result.data,
      error: null,
      coins: limitedCoins,
    };
  }

  /**
   * Fetch simple price information for native currencies
   * @param coinIds - Comma-delimited list of coin IDs
   * @param vsCurrencies - Comma-delimited list of target currencies (default: "usd")
   * @param includeMarketCap - Include market cap data
   * @param include24hrVol - Include 24h volume data
   * @param include24hrChange - Include 24h change data
   * @param includeLastUpdatedAt - Include last updated timestamp
   */
  async getSimplePrice(
    coinIds: string[],
    vsCurrencies: string[] = ['usd'],
    includeMarketCap: boolean = true,
    include24hrVol: boolean = true,
    include24hrChange: boolean = true,
    includeLastUpdatedAt: boolean = true,
  ): Promise<{
    data: SimplePriceResponse | null;
    error: string | null;
    unknownCoinIds: string[];
  }> {
    const params = {
      ids: coinIds.join(','),
      vs_currencies: vsCurrencies.join(','),
      include_market_cap: includeMarketCap,
      include_24hr_vol: include24hrVol,
      include_24hr_change: include24hrChange,
      include_last_updated_at: includeLastUpdatedAt,
    };

    const queryString = this.buildQueryParams(params);
    const url = `${BASE_URL}/simple/price?${queryString}`;

    const result = await this.safeFetch<SimplePriceResponse>(url);

    if (result.error) {
      return { data: null, error: result.error, unknownCoinIds: [] };
    }

    // Track which requested coin IDs were not found in the response
    const receivedCoinIds = result.data ? Object.keys(result.data) : [];
    const unknownCoinIds = coinIds.filter(
      (id) => !receivedCoinIds.includes(id),
    );

    return {
      data: result.data,
      error: null,
      unknownCoinIds,
    };
  }

  /**
   * Fetch token prices for non-native tokens (e.g., ERC20s)
   * @param platformId - Platform ID (e.g., "ethereum", "binance-smart-chain")
   * @param contractAddresses - Array of contract addresses
   * @param vsCurrencies - Comma-delimited list of target currencies (default: "usd")
   * @param includeMarketCap - Include market cap data
   * @param include24hrVol - Include 24h volume data
   * @param include24hrChange - Include 24h change data
   * @param includeLastUpdatedAt - Include last updated timestamp
   */
  async getTokenPrice(
    platformId: string,
    contractAddresses: string[],
    vsCurrencies: string[] = ['usd'],
    includeMarketCap: boolean = true,
    include24hrVol: boolean = true,
    include24hrChange: boolean = true,
    includeLastUpdatedAt: boolean = true,
  ): Promise<{
    data: TokenPriceResponse | null;
    error: string | null;
    unknownContractAddresses: string[];
  }> {
    // CoinGecko free tier only allows 1 contract address per request
    const MAX_CONTRACT_ADDRESSES_PER_REQUEST = 1;

    if (contractAddresses.length > MAX_CONTRACT_ADDRESSES_PER_REQUEST) {
      // Work around CoinGecko free tier limitation
      if (import.meta.env.DEV) {
        console.warn(
          `CoinGecko free tier limitation: Only 1 contract address per request allowed. Batching ${contractAddresses.length} addresses.`,
        );
      }
      return this.getTokenPriceBatched(
        platformId,
        contractAddresses,
        vsCurrencies,
        includeMarketCap,
        include24hrVol,
        include24hrChange,
        includeLastUpdatedAt,
        MAX_CONTRACT_ADDRESSES_PER_REQUEST,
      );
    }

    const params = {
      contract_addresses: contractAddresses.join(','),
      vs_currencies: vsCurrencies.join(','),
      include_market_cap: includeMarketCap,
      include_24hr_vol: include24hrVol,
      include_24hr_change: include24hrChange,
      include_last_updated_at: includeLastUpdatedAt,
    };

    const queryString = this.buildQueryParams(params);
    const url = `${BASE_URL}/simple/token_price/${platformId}?${queryString}`;

    // Debug logging (only in development)
    if (import.meta.env.DEV) {
      console.log('CoinGecko API Request:', {
        platformId,
        contractAddresses: contractAddresses.length,
        urlLength: url.length,
        hasApiKey: !!this.apiKey,
      });
    }

    const result = await this.safeFetch<TokenPriceResponse>(url);

    if (result.error) {
      // Check if this is the CoinGecko free tier limitation error
      if (
        result.error.includes('exceeds the allowed limit') ||
        result.error.includes('10012')
      ) {
        if (import.meta.env.DEV) {
          console.warn(
            'CoinGecko free tier limitation detected, batching requests',
          );
        }
        return this.getTokenPriceBatched(
          platformId,
          contractAddresses,
          vsCurrencies,
          includeMarketCap,
          include24hrVol,
          include24hrChange,
          includeLastUpdatedAt,
          1, // Try one at a time
        );
      }

      return { data: null, error: result.error, unknownContractAddresses: [] };
    }

    // Track which requested contract addresses were not found in the response
    const receivedAddresses = result.data ? Object.keys(result.data) : [];
    const unknownContractAddresses = contractAddresses.filter(
      (address) => !receivedAddresses.includes(address.toLowerCase()),
    );

    return {
      data: result.data,
      error: null,
      unknownContractAddresses,
    };
  }

  /**
   * Fetch token prices in batches to handle large numbers of contract addresses
   */
  private async getTokenPriceBatched(
    platformId: string,
    contractAddresses: string[],
    vsCurrencies: string[],
    includeMarketCap: boolean,
    include24hrVol: boolean,
    include24hrChange: boolean,
    includeLastUpdatedAt: boolean,
    batchSize: number,
  ): Promise<{
    data: TokenPriceResponse | null;
    error: string | null;
    unknownContractAddresses: string[];
  }> {
    const batches: string[][] = [];
    for (let i = 0; i < contractAddresses.length; i += batchSize) {
      batches.push(contractAddresses.slice(i, i + batchSize));
    }

    const allData: TokenPriceResponse = {};
    const allUnknownAddresses: string[] = [];
    let lastError: string | null = null;

    for (const batch of batches) {
      const result = await this.getTokenPrice(
        platformId,
        batch,
        vsCurrencies,
        includeMarketCap,
        include24hrVol,
        include24hrChange,
        includeLastUpdatedAt,
      );

      if (result.error) {
        lastError = result.error;
        // Continue with other batches even if one fails
        allUnknownAddresses.push(...batch);
      } else {
        if (result.data) {
          Object.assign(allData, result.data);
        }
        if (result.unknownContractAddresses) {
          allUnknownAddresses.push(...result.unknownContractAddresses);
        }
      }
    }

    return {
      data: Object.keys(allData).length > 0 ? allData : null,
      error: lastError,
      unknownContractAddresses: allUnknownAddresses,
    };
  }
}

// Export a default instance
export const coinGeckoClient = new CoinGeckoClient();
