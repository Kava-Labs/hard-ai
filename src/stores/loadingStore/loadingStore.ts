type Listener = () => void;

export class LoadingStore {
  private currentValue: boolean = false;
  private listeners: Set<Listener> = new Set();

  public loadingBegins = () => {
    this.currentValue = true;
    this.emitChange();
  };

  public loadingCompletes = () => {
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
