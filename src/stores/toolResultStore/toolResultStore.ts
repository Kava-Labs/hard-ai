export interface ToolResult {
  toolCallId: string;
  toolName: string;
  result: string;
  timestamp: number;
}

type Listener = () => void;

export class ToolResultStore {
  private results: Map<string, ToolResult> = new Map();
  private listeners: Set<Listener> = new Set();

  setResult(toolCallId: string, toolName: string, result: string) {
    this.results.set(toolCallId, {
      toolCallId,
      toolName,
      result,
      timestamp: Date.now(),
    });
    this.emitChange();
  }

  getResult(toolCallId: string): ToolResult | undefined {
    return this.results.get(toolCallId);
  }

  clear() {
    this.results.clear();
    this.emitChange();
  }

  public getSnapshot = () => {
    return Array.from(this.results.values());
  };

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
