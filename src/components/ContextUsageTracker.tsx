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

  const contextPercentage =
    usage.maxInputTokens && (usage.promptTokens / usage.maxInputTokens) * 100;

  if (contextPercentage) {
    // Show context usage as a percentage of max input tokens

    return (
      <>
        <span> • </span>
        <span>
          Context: {contextPercentage.toFixed(2)}% (
          {usage.promptTokens.toLocaleString()})
        </span>
      </>
    );
  }

  return (
    <>
      <span> • </span>
      <span>Context: {usage.promptTokens.toLocaleString()}</span>
    </>
  );
};
