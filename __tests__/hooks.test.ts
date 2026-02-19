/**
 * Unit tests for custom hooks.
 * Run with: npx vitest run __tests__/hooks.test.ts
 *
 * Install: npm i -D vitest @testing-library/react
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorageState } from "../app/hooks/useLocalStorageState";
import { useDebounceSearch } from "../app/hooks/useDebounceSearch";

describe("useLocalStorageState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should return initial value when localStorage is empty", () => {
    const { result } = renderHook(() => useLocalStorageState("test-key", 42));
    expect(result.current[0]).toBe(42);
  });

  it("should persist value to localStorage on set", () => {
    const { result } = renderHook(() => useLocalStorageState("test-key", 0));
    act(() => {
      result.current[1](99);
    });
    expect(result.current[0]).toBe(99);
    expect(localStorage.getItem("test-key")).toBe("99");
  });

  it("should accept updater function", () => {
    const { result } = renderHook(() => useLocalStorageState("counter", 5));
    act(() => {
      result.current[1]((prev) => prev + 10);
    });
    expect(result.current[0]).toBe(15);
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
