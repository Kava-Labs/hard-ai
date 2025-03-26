import { useEffect, useSyncExternalStore } from 'react';
import { InProgressComponentProps } from '../../types/chain';

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

  useEffect(() => {
    if (onRendered) {
      requestAnimationFrame(onRendered);
    }
  }, [onRendered]);

  return null;
};
