import { useEffect, useState } from "react";

type SetStateAction<T> = T | ((prev: T) => T);

function resolveValue<T>(action: SetStateAction<T>, prev: T): T {
  if (typeof action === "function") {
    return (action as (value: T) => T)(prev);
  }
  return action;
}

export function usePersistentState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return initialValue;
      }
      return JSON.parse(raw) as T;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Ignore storage errors (quota/private mode)
    }
  }, [key, state]);

  const updateState = (action: SetStateAction<T>) => {
    setState((prev) => resolveValue(action, prev));
  };

  const resetState = () => {
    setState(initialValue);
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
  };

  return [state, updateState, resetState] as const;
}
