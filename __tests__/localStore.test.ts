/**
 * Persistence-boundary tests.
 *
 * `localStorage` is user-editable and import files are arbitrary JSON, so an
 * "array" arriving at the store proves nothing. These cover the sanitisation
 * that keeps malformed entries out of React state.
 */

import { beforeEach, describe, expect, it } from "vitest";

import {
  MAX_PERSISTED_QUEUE,
  readLibraryState,
  readQueue,
  resetLocalStoreForTests,
  writeLibraryState,
  writeQueue,
} from "../app/lib/localStore";

function seedLibrary(raw: unknown) {
  window.localStorage.setItem("grovy:library", JSON.stringify(raw));
  resetLocalStoreForTests();
}

function seedQueue(raw: unknown) {
  window.localStorage.setItem("grovy:queue", JSON.stringify(raw));
  resetLocalStoreForTests();
}

const validSong = {
  id: "yt-abc",
  title: "A Song",
  url: "/api/stream?id=abc",
  artist: "Someone",
  genre: "YouTube",
  duration: 200,
  source: "YouTube",
};

beforeEach(() => {
  window.localStorage.clear();
  resetLocalStoreForTests();
});

describe("library reads", () => {
  it("keeps well-formed entries", () => {
    seedLibrary({ playlists: [], favorites: [validSong], history: [] });
    expect(readLibraryState().favorites).toHaveLength(1);
  });

  it("drops a null song instead of returning it", () => {
    seedLibrary({ favorites: [validSong, null], playlists: [], history: [] });
    const favorites = readLibraryState().favorites;
    expect(favorites).toHaveLength(1);
    expect(favorites[0].id).toBe("yt-abc");
  });

  it("drops a song missing its url", () => {
    seedLibrary({
      favorites: [{ ...validSong, url: undefined }],
      playlists: [],
      history: [],
    });
    expect(readLibraryState().favorites).toHaveLength(0);
  });

  it("drops a playlist with a non-array songs field", () => {
    seedLibrary({
      playlists: [{ id: "p1", name: "Broken", songs: "nope", createdAt: 1 }],
      favorites: [],
      history: [],
    });
    expect(readLibraryState().playlists).toHaveLength(0);
  });

  it("keeps valid playlists alongside invalid ones", () => {
    seedLibrary({
      playlists: [
        { id: "p1", name: "Good", songs: [validSong], createdAt: 1 },
        { id: "p2", name: 42, songs: [], createdAt: 2 },
      ],
      favorites: [],
      history: [],
    });
    const playlists = readLibraryState().playlists;
    expect(playlists).toHaveLength(1);
    expect(playlists[0].name).toBe("Good");
  });

  it("restores history with its timestamp", () => {
    seedLibrary({ playlists: [], favorites: [], history: [{ ...validSong, timestamp: 1234 }] });
    const history = readLibraryState().history;
    expect(history).toHaveLength(1);
    expect(history[0].timestamp).toBe(1234);
  });

  it("defaults a missing timestamp to 0 rather than dropping the entry", () => {
    seedLibrary({ playlists: [], favorites: [], history: [validSong] });
    expect(readLibraryState().history[0].timestamp).toBe(0);
  });

  it("returns an empty library for corrupt JSON", () => {
    window.localStorage.setItem("grovy:library", "{not json");
    resetLocalStoreForTests();
    expect(readLibraryState()).toEqual({ playlists: [], favorites: [], history: [] });
  });

  it("survives a full round-trip through writeLibraryState", () => {
    writeLibraryState({ playlists: [], favorites: [validSong], history: [] });
    expect(readLibraryState().favorites[0].title).toBe("A Song");
  });
});

describe("queue persistence", () => {
  it("round-trips songs and index", () => {
    writeQueue({ songs: [validSong], index: 0 });
    const queue = readQueue();
    expect(queue?.songs).toHaveLength(1);
    expect(queue?.index).toBe(0);
  });

  it("clamps an out-of-range index", () => {
    seedQueue({ songs: [validSong], index: 99 });
    expect(readQueue()?.index).toBe(0);
  });

  it("caps an oversized queue", () => {
    const many = Array.from({ length: MAX_PERSISTED_QUEUE + 50 }, (_, i) => ({
      ...validSong,
      id: `yt-${i}`,
    }));
    seedQueue({ songs: many, index: 0 });
    expect(readQueue()?.songs).toHaveLength(MAX_PERSISTED_QUEUE);
  });

  it("returns null for an empty persisted queue", () => {
    seedQueue({ songs: [], index: 0 });
    expect(readQueue()).toBeNull();
  });

  it("returns null for corrupt queue JSON", () => {
    window.localStorage.setItem("grovy:queue", "###");
    resetLocalStoreForTests();
    expect(readQueue()).toBeNull();
  });

  it("does not let a broken queue take preferences with it", () => {
    // Regression: the queue used to share the preferences key, so an oversized
    // queue could exhaust the quota and silently lose theme/volume too.
    window.localStorage.setItem("grovy:queue", "###");
    window.localStorage.setItem("grovy:preferences", JSON.stringify({ theme: "light" }));
    resetLocalStoreForTests();
    expect(readQueue()).toBeNull();
    expect(window.localStorage.getItem("grovy:preferences")).toContain("light");
  });
});
