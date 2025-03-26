import { useEffect, useSyncExternalStore } from 'react';
import { InProgressComponentProps } from '../../types/chain';

export const InProgressQueryDisplay = ({
  onRendered,
  progressStore,
}: InProgressComponentProps) => {
  const progressText = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getSnapshot,
  );

  useEffect(() => {
    progressStore.setText('Query in Progress');
    return () => {
      progressStore.setText('');
    };
  }, [progressStore, progressText]);

  useEffect(() => {
    if (onRendered) {
      requestAnimationFrame(onRendered);
    }
  }, [onRendered]);

  return null;
};
