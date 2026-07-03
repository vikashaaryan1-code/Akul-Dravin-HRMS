'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '../store/toast-store';

interface UseApiOptions {
 /** Show an error toast automatically on failure (default: true) */
 errorToast?: boolean;
 /** Custom error message prefix shown in toast */
 errorLabel?: string;
 /** Immediately execute on mount (default: true) */
 immediate?: boolean;
}

interface UseApiResult<T> {
 data: T | null;
 isLoading: boolean;
 error: string | null;
 execute: (...args: unknown[]) => Promise<T | null>;
 reset: () => void;
}

/**
 * useApi — thin hook wrapping any async API call with loading / error / toast.
 *
 * @example
 * const { data, isLoading, error, execute } = useApi(
 * () => platformApi.getEmployees(),
 * { errorLabel: 'Employees' }
 * );
 */
export function useApi<T>(
 fn: (...args: unknown[]) => Promise<T>,
 options: UseApiOptions = {},
): UseApiResult<T> {
 const { errorToast = true, errorLabel = 'Request', immediate = true } = options;

 const [data, setData] = useState<T | null>(null);
 const [isLoading, setIsLoading] = useState(immediate);
 const [error, setError] = useState<string | null>(null);
 const mountedRef = useRef(true);

 useEffect(() => {
 mountedRef.current = true;
 return () => { mountedRef.current = false; };
 }, []);

 const execute = useCallback(async (...args: unknown[]): Promise<T | null> => {
 if (!mountedRef.current) return null;
 setIsLoading(true);
 setError(null);

 try {
 const result = await fn(...args);
 if (mountedRef.current) {
 setData(result);
 setIsLoading(false);
 }
 return result;
 } catch (err: unknown) {
 const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
 if (mountedRef.current) {
 setError(msg);
 setIsLoading(false);
 }
 if (errorToast) {
 toast.error(`${errorLabel}: ${msg}`);
 }
 return null;
 }
 }, [fn, errorToast, errorLabel]);

 /* Auto-execute on mount if immediate */
 useEffect(() => {
 if (immediate) {
 execute();
 } else {
 setIsLoading(false);
 }
 /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

 const reset = useCallback(() => {
 setData(null);
 setError(null);
 setIsLoading(false);
 }, []);

 return { data, isLoading, error, execute, reset };
}
