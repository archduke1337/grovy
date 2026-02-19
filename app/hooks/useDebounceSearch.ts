"use client";

import { useState, useCallback, useRef } from "react";

interface UseDebounceSearchOptions {
  delay?: number;
  minLength?: number;
}

/**
 * Hook that manages debounced search input.
 * Returns the search term, a setter, the debounced value, and a clear function.
 */
export function useDebounceSearch(options: UseDebounceSearchOptions = {}) {
  const { delay = 400, minLength = 2 } = options;
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setSearch = useCallback(
    (value: string) => {
      setSearchTerm(value);
      if (timerRef.current) clearTimeout(timerRef.current);

      if (value.trim().length < minLength) {
        setDebouncedTerm("");
        return;
      }

      timerRef.current = setTimeout(() => {
        setDebouncedTerm(value.trim());
      }, delay);
    },
    [delay, minLength]
  );

  const clear = useCallback(() => {
    setSearchTerm("");
    setDebouncedTerm("");
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { searchTerm, debouncedTerm, setSearch, clear } as const;
}
