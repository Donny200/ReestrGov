import { useCallback, useSyncExternalStore } from 'react';
import { COMPARE_LIMIT, getCompareIds, getCompareServerSnapshot, subscribeCompare, writeCompareIds } from './compareStore';

export function useCompare() {
  const ids = useSyncExternalStore(subscribeCompare, getCompareIds, getCompareServerSnapshot);
  const isSelected = useCallback((id: number) => ids.includes(id), [ids]);
  const add = useCallback((id: number) => {
    const current = getCompareIds();
    if (current.includes(id)) return true;
    if (current.length >= COMPARE_LIMIT) return false;
    return writeCompareIds([...current, id]);
  }, []);
  const remove = useCallback((id: number) => writeCompareIds(getCompareIds().filter((item) => item !== id)), []);
  const replace = useCallback((next: number[]) => writeCompareIds(next), []);
  const clear = useCallback(() => writeCompareIds([]), []);
  return { ids, isSelected, add, remove, replace, clear, full: ids.length >= COMPARE_LIMIT, limit: COMPARE_LIMIT };
}
