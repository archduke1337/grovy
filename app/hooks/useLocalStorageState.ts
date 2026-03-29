"use client";

import { useState, useEffect, useCallback } from "react";
import { getGrovyPrefs, patchGrovyPrefs } from "@/app/lib/appwrite/prefsClient";

/**
 * Legacy API name retained for compatibility.
 * Persists state in Appwrite user preferences with an in-memory fallback.
 */
export function useLocalStorageState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialValue);

  useEffect(() => {
    let isActive = true;

    void (async () => {
      try {
        const prefs = await getGrovyPrefs();
        if (!isActive) return;

        if (Object.prototype.hasOwnProperty.call(prefs, key)) {
          setState(prefs[key] as T);
        }
      } catch {
        // noop — keep initial value
      }

    })();

    return () => {
      isActive = false;
    };
  }, [key]);

  const setPersistedState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
        void patchGrovyPrefs({ [key]: next as unknown });
        return next;
      });
    },
    [key]
  );

  return [state, setPersistedState];
}
