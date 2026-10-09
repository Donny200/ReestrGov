import { useCallback, useEffect, useRef, useState } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: unknown;
}

/**
 * Small data-fetching helper: keeps loading/error/data in one place so every
 * screen can render skeletons, error states and empty states consistently.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []): AsyncState<T> & {
  reload: () => void;
  setData: (value: T) => void;
} {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });
  const mounted = useRef(true);
  const [tick, setTick] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    loaderRef.
    current().
    then((data) => {
      if (mounted.current) setState({ data, loading: false, error: null });
    }).
    catch((error: unknown) => {
      if (mounted.current) setState({ data: null, loading: false, error });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  const reload = useCallback(() => setTick((value) => value + 1), []);
  const setData = useCallback((value: T) => setState({ data: value, loading: false, error: null }), []);

  return { ...state, reload, setData };
}