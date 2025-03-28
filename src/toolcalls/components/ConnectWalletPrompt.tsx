import { useEffect, useSyncExternalStore } from 'react';
import { InProgressComponentProps } from '../chain';
import { useScrollToBottom } from '../../useScrollToBottom';

export const ConnectWalletPrompt = ({
  onRendered,
  progressStore,
}: InProgressComponentProps) => {
  const progressText = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getSnapshot,
  );

  useEffect(() => {
    progressStore.setText('Connect your wallet to continue');
    return () => {
      progressStore.setText('');
    };
  }, [progressStore, progressText]);

  useScrollToBottom(onRendered);

  return null;
};
