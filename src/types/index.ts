export * from './types';

export type Model = {
  id: string;
  displayName: string;
  description: string;
};

export const MODELS = [
  {
    id: 'gpt-4o' as const,
    displayName: 'GPT-4o',
    description: "OpenAI's foundational model",
  },
  {
    id: 'kimi-k2' as const,
    displayName: 'Kimi K2',
    description: 'State-of-the-art open source model from Moonshot AI.',
  },
  {
    id: 'claude-sonnet-4' as const,
    displayName: 'Claude Sonnet 4',
    description: "Anthropic's foundational model",
  },
];

const _: Model[] = MODELS;

export type ModelId = (typeof MODELS)[number]['id'];
