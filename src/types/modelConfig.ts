import { ComponentType } from 'react';
import type { ChatCompletionTool } from 'openai/resources/index';

const supportedModels = ['o3-mini'];

export type SupportedModels = (typeof supportedModels)[number];

export interface ModelConfig {
  id: SupportedModels;
  name: string;
  icon: ComponentType;
  description: string;
  tools: ChatCompletionTool[];
  systemPrompt: string;
  introText: string;
  inputPlaceholderText: string;
  components: {
    transaction?: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inProgress: ComponentType<any>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      complete: ComponentType<any>;
    };
    query?: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inProgress: ComponentType<any>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      complete: ComponentType<any>;
    };
  };
  messageProcessors?: {
    preProcess?: (message: string) => string;
    postProcess?: (message: string) => string;
  };
}
