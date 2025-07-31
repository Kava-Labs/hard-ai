export type Model = {
  id: string;
  displayName: string;
  description: string;
};

export const MODELS: Model[] = [
  {
    id: 'gpt-4o' as const,
    displayName: 'GPT-4o',
    description: "OpenAI's foundational model",
  },
  {
    id: 'gpt-4.1' as const,
    displayName: 'GPT-4.1',
    description: "OpenAI's model optimized for instruction following",
  },
  {
    id: 'qwen3-235b-a22b-07-25' as const,
    displayName: 'Qwen3 235B',
    description: "Qwen's updated non-thinking model",
  },
  {
    id: 'kimi-k2' as const,
    displayName: 'Kimi K2',
    description: 'State-of-the-art open source model from Moonshot AI',
  },
  {
    id: 'claude-sonnet-4' as const,
    displayName: 'Claude Sonnet 4',
    description: "Anthropic's foundational model",
  },
];

const _: Model[] = MODELS;

export type ModelId = (typeof MODELS)[number]['id'];
