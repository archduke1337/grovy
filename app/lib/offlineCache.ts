/**
 * Local metadata cache and user library.
 *
 * Playlists, favorites and history live in `localStorage` via
 * {@link ./localStore}, so they survive reloads and work offline.
 * Song/search results are cached separately with size and age limits so a
 * long session cannot fill the origin's storage quota.
 */

import {
  readLibraryState,
  writeLibrarySection,
  subscribeLibrary,
  type HistoryRecord,
  type PlaylistRecord,
  type SongRecord,
  type StoredLibrary,
} from "./localStore";

export type { HistoryRecord, PlaylistRecord, SongRecord };

type SongRecordMap = Record<string, SongRecord & { _cachedAt?: number }>;
type SearchEntry = { results: unknown[]; timestamp: number };

const CACHE_KEYS = {
  songs: "grovy:cache-songs",
  searches: "grovy:cache-searches",
} as const;

const MAX_CACHED_SONGS = 200;
const MAX_CACHED_SEARCHES = 40;
const SEARCH_TTL_MS = 5 * 60 * 1000;

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readCache<T>(key: string, fallback: T): T {
  const storage = getStorage();
  if (!storage) return fallback;

  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeCache(key: string, value: unknown): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded — drop the cache rather than keep a stale copy.
    try {
      storage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

function normalizeQuery(query: string): string {
  return query.toLowerCase().trim();
}

// ─── Song metadata cache ────────────────────────────────────────

/** Cache a batch of songs, keeping the newest {@link MAX_CACHED_SONGS}. */
export async function cacheSongs(songs: SongRecord[]): Promise<void> {
  if (!Array.isArray(songs) || songs.length === 0) return;

  const store = readCache<SongRecordMap>(CACHE_KEYS.songs, {});
  const now = Date.now();
  let added = 0;

  for (const song of songs) {
    if (!song?.id) continue;
    store[song.id] = { ...song, _cachedAt: now };
    added += 1;
  }

  // Nothing in the batch was cacheable. Writing the (possibly empty) store back
  // would create a junk key for a batch that carried no usable data.
  if (added === 0) return;

  const entries = Object.entries(store).sort(
    (a, b) => (b[1]._cachedAt || 0) - (a[1]._cachedAt || 0)
  );

  writeCache(CACHE_KEYS.songs, Object.fromEntries(entries.slice(0, MAX_CACHED_SONGS)));
}

// ─── Search cache ───────────────────────────────────────────────

/** Cache results for a query string, dropping the oldest entries. */
export async function cacheSearchResults(query: string, results: unknown[]): Promise<void> {
  const normalized = normalizeQuery(query);
  if (!normalized) return;

  const store = readCache<Record<string, SearchEntry>>(CACHE_KEYS.searches, {});
  store[normalized] = { results: Array.isArray(results) ? results : [], timestamp: Date.now() };

  const entries = Object.entries(store).sort(
    (a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0)
  );

  writeCache(CACHE_KEYS.searches, Object.fromEntries(entries.slice(0, MAX_CACHED_SEARCHES)));
}

/** Return cached results when younger than `maxAge` (default 5 minutes). */
export async function getCachedSearch(
  query: string,
  maxAge = SEARCH_TTL_MS
): Promise<unknown[] | null> {
  const normalized = normalizeQuery(query);
  if (!normalized) return null;

  const store = readCache<Record<string, SearchEntry>>(CACHE_KEYS.searches, {});
  const entry = store[normalized];

  if (!entry) return null;
  if (Date.now() - (entry.timestamp || 0) > maxAge) return null;

  return Array.isArray(entry.results) ? entry.results : null;
}

// ─── User library ───────────────────────────────────────────────

/** Persist playlists. Song edits, renames and reorders are all written. */
export async function savePlaylists(playlists: PlaylistRecord[]): Promise<void> {
  writeLibrarySection("playlists", Array.isArray(playlists) ? playlists : []);
}

/** Persist favorites. */
export async function saveFavorites(favorites: SongRecord[]): Promise<void> {
  writeLibrarySection("favorites", Array.isArray(favorites) ? favorites : []);
}

/** Read favorites. */
export async function getFavorites(): Promise<SongRecord[]> {
  return readLibraryState().favorites;
}

/** Add a song to recently-played history (max 50 entries). */
export async function addToHistory(song: SongRecord): Promise<void> {
  if (!song?.id) return;

  const { history } = readLibraryState();
  const filtered = history.filter((entry) => entry?.id !== song.id);
  const updated: HistoryRecord[] = [
    { ...song, timestamp: Date.now() },
    ...filtered,
  ].slice(0, 50);

  writeLibrarySection("history", updated);
}

/** Recently played songs, most recent first. */
export async function getHistory(): Promise<HistoryRecord[]> {
  return [...readLibraryState().history].sort((a, b) => b.timestamp - a.timestamp);
}

/** Clear recently played history. */
export async function clearHistory(): Promise<void> {
  writeLibrarySection("history", []);
}

/**
 * Subscribe to library changes made in other tabs.
 * Returns an unsubscribe function.
 */
export async function subscribeLibraryRealtime(listener: () => void): Promise<() => void> {
  return subscribeLibrary(listener);
}
