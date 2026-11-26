"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * One search request, with the abort/staleness handling every surface needs.
 *
 * The home page and the command palette both search the same endpoint but had
 * drifted: the home page guarded against out-of-order responses with a run id,
 * the palette did not, so a slow earlier request could overwrite a fast later
 * one. Timing and debounce *are* legitimately different per surface, so those
 * stay as options rather than being homogenised.
 *
 * `debounceMs: 0` means "search only on `submit()`"; anything higher searches
 * automatically once typing pauses.
 */
export interface SearchRequestOptions<T> {
  fetcher: (query: string, signal: AbortSignal) => Promise<T[]>;
  /** Shortest query worth sending. Below this the results are cleared. */
  minLength?: number;
  /** Auto-search delay in ms. 0 disables auto-search. */
  debounceMs?: number;
  /** Called with results of a successful, non-stale search. */
  onResults?: (query: string, results: T[]) => void;
}

export interface SearchRequest<T> {
  query: string;
  setQuery: (next: string) => void;
  results: T[];
  isSearching: boolean;
  error: string;
  /** The query the current results belong to, for "no results for X" copy. */
  submittedQuery: string;
  /** Set a custom error message (e.g. a failed deep link). */
  setError: (message: string) => void;
  submit: (override?: string) => Promise<void>;
  clear: () => void;
}

export function useSearchRequest<T>({
  fetcher,
  minLength = 2,
  debounceMs = 0,
  onResults,
}: SearchRequestOptions<T>): SearchRequest<T> {
  const [query, setQueryState] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  // Monotonic id: a response is only applied if no newer request has started.
  // The abort covers the network; this covers the race where an already
  // resolved promise is still queued when the next request begins.
  const runIdRef = useRef(0);

  // Keep the latest values available to `submit` without making it change
  // identity on every keystroke (callers store it in effects/deps).
  const fetcherRef = useRef(fetcher);
  const onResultsRef = useRef(onResults);
  const minLengthRef = useRef(minLength);
  useEffect(() => {
    fetcherRef.current = fetcher;
    onResultsRef.current = onResults;
    minLengthRef.current = minLength;
  }, [fetcher, onResults, minLength]);

  const runQuery = useCallback(async (rawQuery: string) => {
    const normalized = rawQuery.trim();
    const runId = ++runIdRef.current;

    abortRef.current?.abort();

    if (normalized.length < minLengthRef.current) {
      setResults([]);
      setError("");
      setIsSearching(false);
      setSubmittedQuery("");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setSubmittedQuery(normalized);
    setIsSearching(true);
    setError("");

    try {
      const found = await fetcherRef.current(normalized, controller.signal);
      if (controller.signal.aborted || runId !== runIdRef.current) return;

      const safe = Array.isArray(found) ? found : [];
      setResults(safe);
      onResultsRef.current?.(normalized, safe);
    } catch (caught) {
      if (controller.signal.aborted || runId !== runIdRef.current) return;
      if (caught instanceof Error && caught.name === "AbortError") return;
      console.error("Search failed:", caught);
      setResults([]);
      setError("Search hit a snag. Worth trying again.");
    } finally {
      // Only the newest run may clear the spinner, or a stale response would
      // report "done" while a newer search is still in flight.
      if (runId === runIdRef.current && !controller.signal.aborted) {
        setIsSearching(false);
      }
    }
  }, []);

  const setQuery = useCallback(
    (next: string) => {
      setQueryState(next);
      // Clear immediately rather than showing the previous query's results
      // under a new query box.
      if (next.trim().length < minLengthRef.current) {
        abortRef.current?.abort();
        runIdRef.current += 1;
        setResults([]);
        setError("");
        setIsSearching(false);
        setSubmittedQuery("");
      }
    },
    []
  );

  const submit = useCallback(
    async (override?: string) => {
      await runQuery(override ?? query);
    },
    [query, runQuery]
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    runIdRef.current += 1;
    setQueryState("");
    setResults([]);
    setError("");
    setIsSearching(false);
    setSubmittedQuery("");
  }, []);

  // Auto-search after typing pauses. `submit` is stable across keystrokes but
  // reads `query` from its closure, so the debounce is keyed on `query`.
  useEffect(() => {
    if (debounceMs <= 0) return;

    const trimmed = query.trim();
    if (trimmed.length < minLength) {
      abortRef.current?.abort();
      runIdRef.current += 1;
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      void runQuery(trimmed);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, minLength, runQuery]);

  // Abort in-flight work on unmount so a late response cannot set state on a
  // component that no longer exists.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return { query, setQuery, results, isSearching, error, submittedQuery, setError, submit, clear };
}
