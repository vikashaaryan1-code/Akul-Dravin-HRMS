'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from '../store/toast-store';

type UseApiResourceOptions<T> = {
 loader: () => Promise<T>;
 fallback: T;
 deps?: ReadonlyArray<unknown>;
 /** Label shown in the error toast — default: 'Data' */
 label?: string;
 /** Set false to suppress error toasts (default: true) */
 errorToast?: boolean;
};

type UseApiResourceResult<T> = {
 data: T;
 loading: boolean;
 error: string | null;
 isLive: boolean;
 refresh: () => Promise<void>;
};

export function useApiResource<T>({
 loader,
 fallback,
 deps = [],
 label = 'Data',
 errorToast = true,
}: UseApiResourceOptions<T>): UseApiResourceResult<T> {
 const [data, setData] = useState<T>(fallback);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [isLive, setIsLive] = useState(false);

 const depsKey = useMemo(() => JSON.stringify(deps), [deps]);
 const loaderRef = useRef(loader);
 const fallbackRef = useRef(fallback);
 const mountedRef = useRef(true);

 useEffect(() => { loaderRef.current = loader; }, [loader]);
 useEffect(() => { fallbackRef.current = fallback; }, [fallback]);
 useEffect(() => {
 mountedRef.current = true;
 return () => { mountedRef.current = false; };
 }, []);

 const refresh = useCallback(async () => {
 if (!mountedRef.current) return;
 setLoading(true);
 setError(null);

 try {
 const response = await loaderRef.current();
 if (mountedRef.current) {
 setData(response);
 setIsLive(true);
 }
 } catch (caught) {
 const msg = caught instanceof Error ? caught.message : 'Unable to load live data.';
 if (mountedRef.current) {
 setData(fallbackRef.current);
 setIsLive(false);
 setError(msg);
 }
 // Surface API failures as toasts — never fail silently.
 /* Exception: 404-style "Cannot GET" errors = backend just not running locally. */ if (errorToast && !/Cannot GET/i.test(msg)) {
 toast.error(`${label}: ${msg}`);
 }
 } finally {
 if (mountedRef.current) setLoading(false);
 }
 }, [label, errorToast]);

 useEffect(() => {
 void refresh();
 }, [refresh, depsKey]);

 return { data, loading, error, isLive, refresh };
}
