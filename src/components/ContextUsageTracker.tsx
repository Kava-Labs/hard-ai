import { useSyncExternalStore } from 'react';
import { UsageStore } from '../stores/usageStore';

interface ContextUsageTrackerProps {
  usageStore: UsageStore;
}

export const ContextUsageTracker = ({
  usageStore,
}: ContextUsageTrackerProps) => {
  const usage = useSyncExternalStore(
    usageStore.subscribe,
    usageStore.getSnapshot,
  );

  return (
    <>
      <span> • </span>
      <span>Context: {usage.promptTokens.toLocaleString()} tokens</span>
    </>
  );
};
