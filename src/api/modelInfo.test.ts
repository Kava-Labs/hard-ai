import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchModelInfo,
  getModelMaxInputTokens,
  clearModelInfoCache,
  type ModelInfo,
} from './modelInfo';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('modelInfo API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    clearModelInfoCache();
  });

  describe('fetchModelInfo', () => {
    it('should fetch model info successfully', async () => {
      const mockResponse = {
        data: [
          {
            model_name: 'gpt-4o',
            litellm_params: {
              tpm: 30000000,
              rpm: 10000,
              use_in_pass_through: false,
              use_litellm_proxy: false,
              merge_reasoning_content_in_choices: false,
              model: 'openai/gpt-4o',
            },
            model_info: {
              id: 'test-id',
              db_model: false,
              key: 'gpt-4o',
              max_tokens: 16384,
              max_input_tokens: 128000,
              max_output_tokens: 16384,
              input_cost_per_token: 0.0000025,
              cache_creation_input_token_cost: null,
              cache_read_input_token_cost: 0.00000125,
              input_cost_per_character: null,
              input_cost_per_token_above_128k_tokens: null,
              input_cost_per_token_above_200k_tokens: null,
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      import.meta.env.VITE_LITELLM_API_KEY = 'test-api-key';
      import.meta.env.VITE_LITELLM_BASE_URL = 'https://test.com';

      const result = await fetchModelInfo('test-api-key');

      expect(mockFetch).toHaveBeenCalledWith('https://test.com/v1/model/info', {
        method: 'GET',
        headers: {
          accept: 'application/json',
          authorization: 'Bearer test-api-key',
        },
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(fetchModelInfo('test-api-key')).rejects.toThrow(
        'Failed to fetch model info: 401 Unauthorized',
      );
    });

    it('should use default base URL when not specified', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      // Clear the base URL env var
      const originalBaseUrl = import.meta.env.VITE_LITELLM_BASE_URL;
      delete import.meta.env.VITE_LITELLM_BASE_URL;

      await fetchModelInfo('test-api-key');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://litellm.production.kava.io/v1/model/info',
        expect.any(Object),
      );

      // Restore the env var
      import.meta.env.VITE_LITELLM_BASE_URL = originalBaseUrl;
    });

    it('should return cached data on second call', async () => {
      const mockResponse = {
        data: [
          {
            model_name: 'gpt-4o',
            litellm_params: {
              tpm: 30000000,
              rpm: 10000,
              use_in_pass_through: false,
              use_litellm_proxy: false,
              merge_reasoning_content_in_choices: false,
              model: 'openai/gpt-4o',
            },
            model_info: {
              id: 'test-id',
              db_model: false,
              key: 'gpt-4o',
              max_tokens: 16384,
              max_input_tokens: 128000,
              max_output_tokens: 16384,
              input_cost_per_token: 0.0000025,
              cache_creation_input_token_cost: null,
              cache_read_input_token_cost: 0.00000125,
              input_cost_per_character: null,
              input_cost_per_token_above_128k_tokens: null,
              input_cost_per_token_above_200k_tokens: null,
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // First call - should hit the API
      const result1 = await fetchModelInfo('test-api-key');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(mockResponse);

      // Second call - should return cached data
      const result2 = await fetchModelInfo('test-api-key');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still only 1 call
      expect(result2).toEqual(mockResponse);
    });

    it('should refetch after cache expires', async () => {
      const mockResponse1 = {
        data: [
          {
            model_name: 'gpt-4o',
            litellm_params: {
              tpm: 30000000,
              rpm: 10000,
              use_in_pass_through: false,
              use_litellm_proxy: false,
              merge_reasoning_content_in_choices: false,
              model: 'openai/gpt-4o',
            },
            model_info: {
              id: 'test-id-1',
              db_model: false,
              key: 'gpt-4o',
              max_tokens: 16384,
              max_input_tokens: 128000,
              max_output_tokens: 16384,
              input_cost_per_token: 0.0000025,
              cache_creation_input_token_cost: null,
              cache_read_input_token_cost: 0.00000125,
              input_cost_per_character: null,
              input_cost_per_token_above_128k_tokens: null,
              input_cost_per_token_above_200k_tokens: null,
            },
          },
        ],
      };

      const mockResponse2 = {
        data: [
          {
            model_name: 'gpt-4o-mini',
            litellm_params: {
              tpm: 20000000,
              rpm: 5000,
              use_in_pass_through: false,
              use_litellm_proxy: false,
              merge_reasoning_content_in_choices: false,
              model: 'openai/gpt-4o-mini',
            },
            model_info: {
              id: 'test-id-2',
              db_model: false,
              key: 'gpt-4o-mini',
              max_tokens: 8192,
              max_input_tokens: 64000,
              max_output_tokens: 8192,
              input_cost_per_token: 0.0000015,
              cache_creation_input_token_cost: null,
              cache_read_input_token_cost: 0.00000075,
              input_cost_per_character: null,
              input_cost_per_token_above_128k_tokens: null,
              input_cost_per_token_above_200k_tokens: null,
            },
          },
        ],
      };

      // Mock Date.now to control time
      const originalDateNow = Date.now;
      let currentTime = 1000000;
      Date.now = vi.fn(() => currentTime);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse2,
        });

      // First call
      const result1 = await fetchModelInfo('test-api-key');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(mockResponse1);

      // Advance time by 6 minutes (cache should expire after 5 minutes)
      currentTime += 6 * 60 * 1000;

      // Second call - should refetch due to expired cache
      const result2 = await fetchModelInfo('test-api-key');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result2).toEqual(mockResponse2);

      // Restore Date.now
      Date.now = originalDateNow;
    });

    it('should cache separately for different base URLs', async () => {
      const mockResponse1 = { data: [] };
      const mockResponse2 = { data: [] };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse2,
        });

      // First call with custom base URL
      import.meta.env.VITE_LITELLM_BASE_URL = 'https://test1.com';
      await fetchModelInfo('test-api-key');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test1.com/v1/model/info',
        expect.any(Object),
      );

      // Second call with different base URL - should not use cache
      import.meta.env.VITE_LITELLM_BASE_URL = 'https://test2.com';
      await fetchModelInfo('test-api-key');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://test2.com/v1/model/info',
        expect.any(Object),
      );
    });
  });

  describe('getModelMaxInputTokens', () => {
    const mockModelInfo: ModelInfo[] = [
      {
        model_name: 'gpt-4o',
        litellm_params: {
          tpm: 30000000,
          rpm: 10000,
          use_in_pass_through: false,
          use_litellm_proxy: false,
          merge_reasoning_content_in_choices: false,
          model: 'openai/gpt-4o',
        },
        model_info: {
          id: 'test-id-1',
          db_model: false,
          key: 'gpt-4o',
          max_tokens: 16384,
          max_input_tokens: 128000,
          max_output_tokens: 16384,
          input_cost_per_token: 0.0000025,
          cache_creation_input_token_cost: null,
          cache_read_input_token_cost: 0.00000125,
          input_cost_per_character: null,
          input_cost_per_token_above_128k_tokens: null,
          input_cost_per_token_above_200k_tokens: null,
        },
      },
      {
        model_name: 'gpt-4o-mini',
        litellm_params: {
          tpm: 30000000,
          rpm: 10000,
          use_in_pass_through: false,
          use_litellm_proxy: false,
          merge_reasoning_content_in_choices: false,
          model: 'openai/gpt-4o-mini',
        },
        model_info: {
          id: 'test-id-2',
          db_model: false,
          key: 'gpt-4o-mini',
          max_tokens: 16384,
          max_input_tokens: null,
          max_output_tokens: 16384,
          input_cost_per_token: 0.0000025,
          cache_creation_input_token_cost: null,
          cache_read_input_token_cost: 0.00000125,
          input_cost_per_character: null,
          input_cost_per_token_above_128k_tokens: null,
          input_cost_per_token_above_200k_tokens: null,
        },
      },
    ];

    it('should return max_input_tokens for matching model name', () => {
      const result = getModelMaxInputTokens(mockModelInfo, 'gpt-4o');
      expect(result).toBe(128000);
    });

    it('should return max_input_tokens for matching model key', () => {
      const result = getModelMaxInputTokens(mockModelInfo, 'gpt-4o');
      expect(result).toBe(128000);
    });

    it('should return null for null max_input_tokens', () => {
      const result = getModelMaxInputTokens(mockModelInfo, 'gpt-4o-mini');
      expect(result).toBeNull();
    });

    it('should return null when model not found', () => {
      const result = getModelMaxInputTokens(
        mockModelInfo,
        'non-existent-model',
      );
      expect(result).toBeNull();
    });
  });
});
