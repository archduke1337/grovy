"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getGrovyPrefs, patchGrovyPrefs } from "@/app/lib/appwrite/prefsClient";

/**
 * Persists state in Appwrite user preferences with an in-memory fallback.
 */
export function usePreferenceState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialValue);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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
        // Keep initial value when preference fetch fails.
      }
    })();

    return () => {
      isActive = false;
    };
  }, [key]);

  const setPersistedState = useCallback(
    (value: T | ((prev: T) => T)) => {
      const nextValue = typeof value === "function"
        ? (value as (prev: T) => T)(stateRef.current)
        : value;
      setState(nextValue);
      void patchGrovyPrefs({ [key]: nextValue as unknown });
    },
    [key]
  );

  return [state, setPersistedState];
}
