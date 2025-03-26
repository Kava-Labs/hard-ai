import { useEffect, useSyncExternalStore } from 'react';
import { InProgressComponentProps } from '../chain';
import { useScrollToBottom } from '../../useScrollToBottom';

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

  useScrollToBottom(onRendered);

  return null;
};
