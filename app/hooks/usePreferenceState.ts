"use client";

import { useState, useEffect, useCallback, useRef } from "react";

import { getGrovyPrefs, patchGrovyPrefs } from "@/app/lib/preferences";

/**
 * Hook that manages a state value persisted in local preferences.
 * Hydrates from storage on mount using `initialValue` as fallback, and writes
 * changes back in the background.
 *
 * @param key - Preference key to read/write
 * @param initialValue - Default value when no stored preference exists
 * @returns Tuple of [state, setState] matching the useState API
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
        // Keep initial value when preference read fails.
      }
    })();

    return () => {
      isActive = false;
    };
  }, [key]);

  const setPersistedState = useCallback(
    (value: T | ((prev: T) => T)) => {
      const nextValue =
        typeof value === "function"
          ? (value as (prev: T) => T)(stateRef.current)
          : value;

      setState(nextValue);
      void patchGrovyPrefs({ [key]: nextValue as never });
    },
    [key]
  );

  return [state, setPersistedState];
}
