type Listener = () => void;

export class ProcessingStore {
  private currentValue: boolean = false;
  private listeners: Set<Listener> = new Set();

  public initiateProcessing = () => {
    this.currentValue = true;
    this.emitChange();
  };

  public finishProcessing = () => {
    this.currentValue = false;
    this.emitChange();
  };

  public getSnapshot = (): boolean => {
    return this.currentValue;
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
