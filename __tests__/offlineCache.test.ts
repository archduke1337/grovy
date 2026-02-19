/**
 * Unit tests for the offline cache (IndexedDB wrapper).
 * Run with: npx vitest run __tests__/offlineCache.test.ts
 *
 * Note: requires `fake-indexeddb` package for Node environment.
 * Install: npm i -D vitest fake-indexeddb
 */

import { describe, it, expect, beforeEach } from "vitest";

// Polyfill IndexedDB for Node
import "fake-indexeddb/auto";

import {
  cacheSong,
  cacheSongs,
  getCachedSong,
  cacheSearchResults,
  getCachedSearch,
  clearOfflineCache,
} from "../app/lib/offlineCache";

describe("offlineCache", () => {
  beforeEach(async () => {
    await clearOfflineCache();
  });

  it("should cache and retrieve a single song", async () => {
    const song = { id: "test-1", title: "Test Song", url: "/test.mp3" };
    await cacheSong(song);
    const result = await getCachedSong("test-1");
    expect(result).toBeTruthy();
    expect(result.title).toBe("Test Song");
    expect(result._cachedAt).toBeTypeOf("number");
  });

  it("should cache multiple songs", async () => {
    const songs = [
      { id: "s1", title: "Song 1", url: "/s1.mp3" },
      { id: "s2", title: "Song 2", url: "/s2.mp3" },
    ];
    await cacheSongs(songs);
    const r1 = await getCachedSong("s1");
    const r2 = await getCachedSong("s2");
    expect(r1?.title).toBe("Song 1");
    expect(r2?.title).toBe("Song 2");
  });

  it("should return null for non-existent song", async () => {
    const result = await getCachedSong("nonexistent");
    expect(result).toBeNull();
  });

  it("should cache and retrieve search results", async () => {
    const results = [{ id: "r1", name: "Result 1" }];
    await cacheSearchResults("test query", results);
    const cached = await getCachedSearch("test query");
    expect(cached).toEqual(results);
  });

  it("should normalize search query (lowercase + trim)", async () => {
    await cacheSearchResults("  Hello World  ", [{ id: "1" }]);
    const cached = await getCachedSearch("hello world");
    expect(cached).toBeTruthy();
    expect(cached).toHaveLength(1);
  });

  it("should return null for stale search results", async () => {
    await cacheSearchResults("old query", [{ id: "1" }]);
    // Wait a tiny bit so timestamp is in the past
    await new Promise((r) => setTimeout(r, 10));
    // Stale after 1ms
    const cached = await getCachedSearch("old query", 1);
    expect(cached).toBeNull();
  });

  it("should clear all caches", async () => {
    await cacheSong({ id: "c1", title: "Clear Me", url: "/c.mp3" });
    await cacheSearchResults("clear", [{ id: "c1" }]);
    await clearOfflineCache();
    expect(await getCachedSong("c1")).toBeNull();
    expect(await getCachedSearch("clear")).toBeNull();
  });
});
