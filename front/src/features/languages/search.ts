import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchLanguages } from '../../services/referenceService';
import { languageKeys } from '../queryKeys';

export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export const useLanguageSearch = (query: string) =>
  useQuery({
    queryKey: [...languageKeys.all, 'search', query] as const,
    queryFn: () => searchLanguages(query),
    enabled: query.length > 0,
    staleTime: 60_000,
  });
