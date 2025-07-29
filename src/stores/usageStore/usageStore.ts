type Listener = () => void;

export interface UsageData {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export class UsageStore {
  private currentValue: UsageData = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
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
    };
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
