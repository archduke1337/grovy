"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * useState backed by localStorage. Hydrates on mount, persists on change.
 * Falls back to initialValue if localStorage is unavailable or parsing fails.
 */
export function useLocalStorageState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialValue);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        setState(JSON.parse(stored));
      }
    } catch {
      // noop — use initial value
    }
  }, [key]);

  // Persist to localStorage on change
  const setPersistedState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Storage full or unavailable
        }
        return next;
      });
    },
    [key]
  );

  return [state, setPersistedState];
}
