import type { ChatMessage } from '../../types';

type Listener = () => void;

export class MessageHistoryStore {
  private currentValue: ChatMessage[] = [];
  private listeners: Set<Listener> = new Set();

  constructor(initValue?: ChatMessage[]) {
    if (initValue) {
      this.currentValue = [...initValue];
    }
  }

  public addMessage(msg: ChatMessage) {
    const newMessages = [...this.currentValue, msg];
    this.currentValue = newMessages;
    this.emitChange();
  }

  public setMessages(msgs: ChatMessage[]) {
    if (msgs !== this.currentValue) {
      this.currentValue = msgs;
      this.emitChange();
    }
  }

  public getSnapshot = () => {
    return this.currentValue;
  };

  public reset() {
    this.currentValue = [];
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
