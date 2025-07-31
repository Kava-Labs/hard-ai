export interface ModelInfo {
  model_name: string;
  litellm_params: {
    tpm: number;
    rpm: number;
    use_in_pass_through: boolean;
    use_litellm_proxy: boolean;
    merge_reasoning_content_in_choices: boolean;
    model: string;
  };
  model_info: {
    id: string;
    db_model: boolean;
    key: string;
    max_tokens: number;
    max_input_tokens: number | null;
    max_output_tokens: number;
    input_cost_per_token: number;
    cache_creation_input_token_cost: number | null;
    cache_read_input_token_cost: number | null;
    input_cost_per_character: number | null;
    input_cost_per_token_above_128k_tokens: number | null;
    input_cost_per_token_above_200k_tokens: number | null;
  };
}

export interface ModelInfoResponse {
  data: ModelInfo[];
}

interface CacheEntry {
  data: ModelInfoResponse;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let modelInfoCache: CacheEntry | null = null;

export const clearModelInfoCache = () => {
  modelInfoCache = null;
};

export const fetchModelInfo = async (
  apiKey: string,
): Promise<ModelInfoResponse> => {
  const baseUrl = import.meta.env.VITE_LITELLM_BASE_URL;
  if (!baseUrl) {
    console.warn('VITE_LITELLM_BASE_URL is not set. Cannot fetch model info.');
    return {
      data: [],
    };
  }

  const url = `${baseUrl}/v1/model/info`;

  // Check cache first
  if (modelInfoCache) {
    const now = Date.now();
    const age = now - modelInfoCache.timestamp;

    if (age < CACHE_TTL_MS) {
      // Return cached data if not expired
      return modelInfoCache.data;
    }

    // Clear expired cache
    modelInfoCache = null;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch model info: ${response.status} ${response.statusText}`,
    );
  }

  const data: ModelInfoResponse = await response.json();

  // Store in cache
  modelInfoCache = {
    data,
    timestamp: Date.now(),
  };

  return data;
};

export const getModelMaxInputTokens = (
  modelInfo: ModelInfo[],
  modelName: string,
): number | null => {
  // Find by model name, same as when using chat completion model
  const model = modelInfo.find((m) => m.model_name === modelName);

  // Potentially null for openrouter models, need to be defined in litellm config
  return model?.model_info.max_input_tokens ?? null;
};
