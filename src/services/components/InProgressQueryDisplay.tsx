import { useEffect, useSyncExternalStore } from 'react';
import { TextStreamStore } from '../../stores/textStreamStore';
import { ToolCallStream } from '../../stores/toolCallStreamStore';

export interface InProgressQueryProps {
  onRendered?: () => void;
  toolCall: ToolCallStream;
  progressStore: TextStreamStore;
}

export const InProgressQueryDisplay = ({
  onRendered,
  progressStore,
}: InProgressQueryProps) => {
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
