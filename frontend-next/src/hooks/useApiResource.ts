'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type UseApiResourceOptions<T> = {
  loader: () => Promise<T>;
  fallback: T;
  deps?: ReadonlyArray<unknown>;
};

type UseApiResourceResult<T> = {
  data: T;
  loading: boolean;
  error: string | null;
  isLive: boolean;
  refresh: () => Promise<void>;
};

export function useApiResource<T>({ loader, fallback, deps = [] }: UseApiResourceOptions<T>): UseApiResourceResult<T> {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const depsKey = useMemo(() => JSON.stringify(deps), [deps]);
  const loaderRef = useRef(loader);
  const fallbackRef = useRef(fallback);

  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  useEffect(() => {
    fallbackRef.current = fallback;
  }, [fallback]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await loaderRef.current();
      setData(response);
      setIsLive(true);
    } catch (caught) {
      setData(fallbackRef.current);
      setIsLive(false);
      setError(caught instanceof Error ? caught.message : 'Unable to load live data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, depsKey]);

  return {
    data,
    loading,
    error,
    isLive,
    refresh,
  };
}


