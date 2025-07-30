type Listener = () => void;

export interface UsageData {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  maxInputTokens: number | null;
}

export class UsageStore {
  private currentValue: UsageData = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    maxInputTokens: null,
  };
  private listeners: Set<Listener> = new Set();

  constructor(initValue?: Partial<UsageData>) {
    if (initValue) {
      this.currentValue = { ...this.currentValue, ...initValue };
    }
  }

  public setUsage(usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }) {
    this.currentValue = {
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      // Don't overwrite existing maxInputTokens
      maxInputTokens: this.currentValue.maxInputTokens,
    };

    this.emitChange();
  }

  public setMaxInputTokens(maxInputTokens: number | null) {
    this.currentValue.maxInputTokens = maxInputTokens;
    this.emitChange();
  }

  public getSnapshot = (): UsageData => {
    return this.currentValue;
  };

  public reset() {
    this.currentValue = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      maxInputTokens: null,
    };
    this.emitChange();
  }

  public subscribe = (callback: Listener): (() => void) => {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  };

  private emitChange() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
