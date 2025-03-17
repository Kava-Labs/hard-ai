import { useEffect, useState } from 'react';

export const useMediaQuery = (query: string) => {
  // Check if window exists (for server-side rendering or testing environments)
  const isClient = typeof window !== 'undefined';

  const [matches, setMatches] = useState<boolean>(() => {
    if (!isClient) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (!isClient) return;

    const matchQuery = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    matchQuery.addEventListener('change', onChange);
    return () => matchQuery.removeEventListener('change', onChange);
  }, [query, isClient]);

  return matches;
};
