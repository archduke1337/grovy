/**
 * Unit tests for custom hooks.
 * Run with: npx vitest run __tests__/hooks.test.ts
 *
 * Install: npm i -D vitest @testing-library/react
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

const { prefStore, getGrovyPrefsMock, patchGrovyPrefsMock } = vi.hoisted(() => {
  const store: Record<string, unknown> = {};

  return {
    prefStore: store,
    getGrovyPrefsMock: vi.fn(async () => ({ ...store })),
    patchGrovyPrefsMock: vi.fn(async (patch: Record<string, unknown>) => {
      Object.assign(store, patch);
      return { ...store };
    }),
  };
});

vi.mock("../app/lib/appwrite/prefsClient", () => ({
  getGrovyPrefs: getGrovyPrefsMock,
  patchGrovyPrefs: patchGrovyPrefsMock,
}));

import { usePreferenceState } from "../app/hooks/usePreferenceState";
import { useDebounceSearch } from "../app/hooks/useDebounceSearch";

describe("usePreferenceState", () => {
  beforeEach(() => {
    Object.keys(prefStore).forEach((key) => {
      delete prefStore[key];
    });
    getGrovyPrefsMock.mockClear();
    patchGrovyPrefsMock.mockClear();
  });

  it("should return initial value when preferences are empty", () => {
    const { result } = renderHook(() => usePreferenceState("test-key", 42));
    expect(result.current[0]).toBe(42);
  });

  it("should hydrate from preferences when key exists", async () => {
    prefStore["test-key"] = 7;
    const { result } = renderHook(() => usePreferenceState("test-key", 42));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current[0]).toBe(7);
  });

  it("should persist value to preferences on set", async () => {
    const { result } = renderHook(() => usePreferenceState("test-key", 0));

    await act(async () => {
      result.current[1](99);
      await Promise.resolve();
    });

    expect(result.current[0]).toBe(99);
    expect(patchGrovyPrefsMock).toHaveBeenCalledWith({ "test-key": 99 });
  });

  it("should accept updater function", async () => {
    const { result } = renderHook(() => usePreferenceState("counter", 5));

    await act(async () => {
      result.current[1]((prev) => prev + 10);
      await Promise.resolve();
    });

    expect(result.current[0]).toBe(15);
    expect(patchGrovyPrefsMock).toHaveBeenCalledWith({ counter: 15 });
  });
});

describe("useDebounceSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should return empty debounced term initially", () => {
    const { result } = renderHook(() => useDebounceSearch());
    expect(result.current.debouncedTerm).toBe("");
    expect(result.current.searchTerm).toBe("");
  });

  it("should update searchTerm immediately", () => {
    const { result } = renderHook(() => useDebounceSearch());
    act(() => {
      result.current.setSearch("hello");
    });
    expect(result.current.searchTerm).toBe("hello");
    expect(result.current.debouncedTerm).toBe(""); // Not yet debounced
  });

  it("should update debouncedTerm after delay", () => {
    const { result } = renderHook(() => useDebounceSearch({ delay: 300 }));
    act(() => {
      result.current.setSearch("test");
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.debouncedTerm).toBe("test");
  });

  it("should not debounce short queries", () => {
    const { result } = renderHook(() => useDebounceSearch({ minLength: 3 }));
    act(() => {
      result.current.setSearch("ab");
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.debouncedTerm).toBe("");
  });

  it("should clear both terms", () => {
    const { result } = renderHook(() => useDebounceSearch({ delay: 100 }));
    act(() => {
      result.current.setSearch("hello");
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.debouncedTerm).toBe("hello");
    act(() => {
      result.current.clear();
    });
    expect(result.current.searchTerm).toBe("");
    expect(result.current.debouncedTerm).toBe("");
  });
});
