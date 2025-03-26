import { useEffect } from 'react';

export const useScrollToBottom = (
  onRendered?: () => void,
  ...rest: unknown[]
) => {
  useEffect(() => {
    if (onRendered) {
      onRendered();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRendered, ...rest]);
};
