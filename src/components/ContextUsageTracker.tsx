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

  // Don't show on landing page when no tokens have been used
  if (!usage.promptTokens && !usage.completionTokens) {
    return null;
  }

  return (
    <>
      <span> • </span>
      <span>
        {usage.promptTokens.toLocaleString()} prompt tokens {'- '}
        {usage.completionTokens.toLocaleString()} completion tokens
      </span>
    </>
  );
};
