/** Up to three services chosen for side-by-side comparison; kept only in this browser's localStorage. */
export const COMPARE_KEY = 'reestr-compare-services';
export const COMPARE_LIMIT = 3;

const EMPTY: number[] = [];
const listeners = new Set<() => void>();
let cache: number[] | null = null;

function sanitize(value: unknown, limit = COMPARE_LIMIT): number[] {
  if (!Array.isArray(value)) return EMPTY;
  const ids = value.filter((item): item is number => Number.isInteger(item) && (item as number) > 0);
  return Array.from(new Set(ids)).slice(0, limit);
}

function read(): number[] {
  try {
    const raw = window.localStorage.getItem(COMPARE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function getCompareIds(): number[] {
  if (cache === null) cache = read();
  return cache;
}

export function getCompareServerSnapshot(): number[] {
  return EMPTY;
}

export function writeCompareIds(ids: number[]): boolean {
  cache = sanitize(ids);
  notify();
  try {
    if (cache.length === 0) window.localStorage.removeItem(COMPARE_KEY);
    else window.localStorage.setItem(COMPARE_KEY, JSON.stringify(cache));
    return true;
  } catch {
    return false;
  }
}

export function subscribeCompare(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== COMPARE_KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/** Parses the shareable `?ids=1,2,3` form of a comparison; the page trims it to published services and the limit. */
export function parseCompareIds(value: string | null, limit = COMPARE_LIMIT): number[] {
  if (!value) return EMPTY;
  return sanitize(value.split(',').map((item) => Number(item.trim())), limit);
}
