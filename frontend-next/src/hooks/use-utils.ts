'use client';

import { useEffect, useRef, useState } from 'react';

// ── useDebounce ───────────────────────────────────────────────────────────────

/**
 * Debounces a value — useful for search inputs, API calls.
 *
 * @example
 * const debouncedQuery = useDebounce(searchQuery, 350);
 * useEffect(() => { fetchResults(debouncedQuery); }, [debouncedQuery]);
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

// ── useDebouncedCallback ──────────────────────────────────────────────────────

/**
 * Returns a debounced version of a callback function.
 *
 * @example
 * const handleSearch = useDebouncedCallback((q: string) => fetchEmployees(q), 350);
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delayMs = 300,
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (...args: Parameters<T>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => callbackRef.current(...args), delayMs);
  };
}

// ── useLocalStorage ───────────────────────────────────────────────────────────

/**
 * useState that persists to localStorage with JSON serialisation.
 * SSR-safe — initialises from localStorage only on client mount.
 *
 * @example
 * const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage('sidebar:collapsed', false);
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch { /* quota exceeded or private browsing */ }
      return next;
    });
  };

  return [storedValue, setValue];
}

// ── usePrevious ───────────────────────────────────────────────────────────────

/**
 * Returns the previous value of a state or prop.
 *
 * @example
 * const prevCount = usePrevious(count);
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => { ref.current = value; });
  return ref.current;
}

// ── useIntersectionObserver ───────────────────────────────────────────────────

/**
 * Returns a ref and a boolean indicating whether the element is visible.
 * Useful for lazy loading and "load more on scroll" patterns.
 *
 * @example
 * const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
 * return <div ref={ref}>{isVisible && <ExpensiveChart />}</div>;
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {},
): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setIsVisible(entry.isIntersecting);
    }, options);

    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.threshold, options.root, options.rootMargin]);

  return [ref, isVisible];
}

// ── useClickOutside ───────────────────────────────────────────────────────────

/**
 * Fires a callback when a click occurs outside the referenced element.
 * Useful for dropdowns, modals, context menus.
 *
 * @example
 * const ref = useClickOutside(() => setOpen(false));
 * return <div ref={ref}>...</div>;
 */
export function useClickOutside<T extends HTMLElement = HTMLDivElement>(
  callback: () => void,
): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [callback]);

  return ref;
}

// ── useMediaQuery ─────────────────────────────────────────────────────────────

/**
 * Returns true when the media query matches.
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// ── useIsMobile / useIsTablet convenience wrappers ───────────────────────────
export const useIsMobile  = () => useMediaQuery('(max-width: 767px)');
export const useIsTablet  = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
