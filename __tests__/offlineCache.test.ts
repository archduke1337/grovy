/**
 * Unit tests for the local library store.
 * Run with: npm test
 *
 * These cover the persistence behaviour that used to be lost: song edits,
 * renames and reorders inside an existing playlist must be written.
 */

import { describe, it, expect, beforeEach } from "vitest";

import {
  readLibraryState,
  writeLibrarySection,
  writeLibraryState,
  readPreferences,
  patchPreferences,
  resetLocalStoreForTests,
} from "../app/lib/localStore";

import {
  savePlaylists,
  saveFavorites,
  getFavorites,
  addToHistory,
  getHistory,
  clearHistory,
  cacheSongs,
  cacheSearchResults,
  getCachedSearch,
} from "../app/lib/offlineCache";

const song = (id: string, title = `Song ${id}`) => ({
  id,
  title,
  url: `/api/stream?id=${id}`,
  artist: "Artist",
  genre: "Pop",
  duration: 120,
  source: "Saavn",
});

describe("localStore library", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetLocalStoreForTests();
  });

  it("starts empty", () => {
    const library = readLibraryState();
    expect(library.playlists).toEqual([]);
    expect(library.favorites).toEqual([]);
    expect(library.history).toEqual([]);
  });

  it("persists playlists across a fresh read", async () => {
    await savePlaylists([
      { id: "p1", name: "Road Trip", songs: [song("a")], createdAt: 1 },
    ]);

    resetLocalStoreForTests();
    const playlists = readLibraryState().playlists;
    expect(playlists).toHaveLength(1);
    expect(playlists[0].name).toBe("Road Trip");
  });

  it("saves songs added to an existing playlist", async () => {
    await savePlaylists([{ id: "p1", name: "Mix", songs: [song("a")], createdAt: 1 }]);

    // Same playlist ID, extra song — the old ID-only comparison dropped this.
    await savePlaylists([
      { id: "p1", name: "Mix", songs: [song("a"), song("b")], createdAt: 1 },
    ]);

    resetLocalStoreForTests();
    const playlists = readLibraryState().playlists;
    expect(playlists[0].songs.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("saves a playlist rename", async () => {
    await savePlaylists([{ id: "p1", name: "Old name", songs: [], createdAt: 1 }]);
    await savePlaylists([{ id: "p1", name: "New name", songs: [], createdAt: 1 }]);

    resetLocalStoreForTests();
    expect(readLibraryState().playlists[0].name).toBe("New name");
  });

  it("saves a reordered playlist", async () => {
    await savePlaylists([
      { id: "p1", name: "Mix", songs: [song("a"), song("b")], createdAt: 1 },
    ]);
    await savePlaylists([
      { id: "p1", name: "Mix", songs: [song("b"), song("a")], createdAt: 1 },
    ]);

    resetLocalStoreForTests();
    expect(readLibraryState().playlists[0].songs.map((s) => s.id)).toEqual(["b", "a"]);
  });

  it("keeps favorites and playlists independent", async () => {
    await saveFavorites([song("f1")]);
    await savePlaylists([{ id: "p1", name: "Mix", songs: [], createdAt: 1 }]);

    expect(await getFavorites()).toHaveLength(1);
    expect(readLibraryState().playlists).toHaveLength(1);
  });

  it("replaces history entries instead of duplicating them", async () => {
    await addToHistory(song("h1"));
    await addToHistory(song("h2"));
    await addToHistory(song("h1"));

    const history = await getHistory();
    expect(history.map((h) => h.id)).toEqual(["h1", "h2"]);
  });

  it("clears history only", async () => {
    await addToHistory(song("h1"));
    await saveFavorites([song("f1")]);
    await clearHistory();

    expect(await getHistory()).toEqual([]);
    expect(await getFavorites()).toHaveLength(1);
  });

  it("ignores writes for songs without an id", async () => {
    await addToHistory({ id: "", title: "Nameless", url: "/x", genre: "Pop" } as never);
    expect(await getHistory()).toEqual([]);
  });

  it("survives corrupt stored JSON", () => {
    window.localStorage.setItem("grovy:library", "{not json");
    resetLocalStoreForTests();

    expect(readLibraryState().playlists).toEqual([]);
  });

  it("re-reads storage after a change made in another tab", () => {
    writeLibrarySection("favorites", [song("f1")]);
    resetLocalStoreForTests();

    // Simulate another tab writing: the raw value changes behind our back.
    window.localStorage.setItem(
      "grovy:library",
      JSON.stringify({ playlists: [], favorites: [song("f2")], history: [] })
    );

    // The storage listener in `subscribeLibrary` clears the memory copy.
    window.dispatchEvent(new StorageEvent("storage", { key: "grovy:library" }));
    resetLocalStoreForTests();

    expect(readLibraryState().favorites.map((f) => f.id)).toEqual(["f2"]);
  });

  it("does not dispatch a same-tab event that would loop with its own writer", () => {
    let fired = 0;
    const listener = () => {
      fired += 1;
    };
    window.addEventListener("storage", listener);
    writeLibrarySection("favorites", [song("f3")]);
    window.removeEventListener("storage", listener);

    expect(fired).toBe(0);
  });
});

describe("localStore preferences", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetLocalStoreForTests();
  });

  it("merges patches", () => {
    patchPreferences({ volume: 0.5 });
    patchPreferences({ theme: "light" });

    expect(readPreferences()).toEqual({ volume: 0.5, theme: "light" });
  });

  it("persists across a fresh read", () => {
    patchPreferences({ playbackSpeed: 1.5 });
    resetLocalStoreForTests();

    expect(readPreferences().playbackSpeed).toBe(1.5);
  });
});

describe("song and search caches", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetLocalStoreForTests();
  });

  it("caches multiple songs", async () => {
    await cacheSongs([song("s1", "Song 1"), song("s2", "Song 2")]);

    const raw = window.localStorage.getItem("grovy:cache-songs");
    const cached = JSON.parse(raw || "{}");
    expect(cached["s1"].title).toBe("Song 1");
    expect(cached["s2"].title).toBe("Song 2");
  });

  it("drops cached songs without an id", async () => {
    await cacheSongs([{ title: "Nameless" } as never]);
    expect(window.localStorage.getItem("grovy:cache-songs")).toBeNull();
  });

  it("caches and retrieves search results", async () => {
    const results = [{ id: "r1", name: "Result 1" }];
    await cacheSearchResults("test query", results);
    expect(await getCachedSearch("test query")).toEqual(results);
  });

  it("normalizes the search query", async () => {
    await cacheSearchResults("  Hello World  ", [{ id: "1" }]);
    expect(await getCachedSearch("hello world")).toHaveLength(1);
  });

  it("expires stale search results", async () => {
    await cacheSearchResults("old query", [{ id: "1" }]);
    await new Promise((r) => setTimeout(r, 10));
    expect(await getCachedSearch("old query", 1)).toBeNull();
  });

  it("caps the number of cached searches", async () => {
    for (let i = 0; i < 45; i += 1) {
      await cacheSearchResults(`query ${i}`, [{ id: String(i) }]);
    }

    const raw = window.localStorage.getItem("grovy:cache-searches");
    expect(Object.keys(JSON.parse(raw || "{}")).length).toBeLessThanOrEqual(40);
  });
});

describe("writeLibraryState", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetLocalStoreForTests();
  });

  it("stores a complete library snapshot", () => {
    writeLibraryState({
      playlists: [{ id: "p1", name: "P", songs: [], createdAt: 1 }],
      favorites: [song("f1")],
      history: [{ ...song("h1"), timestamp: 1 }],
    });

    const library = readLibraryState();
    expect(library.playlists).toHaveLength(1);
    expect(library.favorites).toHaveLength(1);
    expect(library.history).toHaveLength(1);
  });
});
