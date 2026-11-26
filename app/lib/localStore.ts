/**
 * Browser-local persistence for Grovy.
 *
 * Everything the player needs to remember between visits — queue, volume,
 * EQ, playlists, favorites and history — lives here in `localStorage`.
 * There is no account system and no server round-trip, so playback state is
 * available immediately on load and works offline.
 *
 * Reads and writes never throw: private-mode browsers and full quota errors
 * degrade to in-memory state instead of breaking playback.
 */

import { PlaylistSchema, SongSchema } from "@/app/types/song";
import type { Playlist, Song } from "@/app/types/song";

const STORAGE_PREFIX = "grovy:";

export const STORAGE_KEYS = {
  library: "library",
  preferences: "preferences",
  searchHistory: "search-history",
  queue: "queue",
} as const;

/**
 * The persisted playback queue. Kept in its own key rather than inside
 * `preferences` because it is the only unbounded value the app stores: sharing
 * a key with theme/volume/EQ meant one oversized queue could exhaust the
 * origin quota and silently take the user's settings down with it.
 */
export interface PersistedQueue {
  songs: Song[];
  index: number;
}

export type PreferenceValue = string | number | boolean | null | object;

export type Preferences = Record<string, PreferenceValue>;

/** Shape of the persisted library. */
export interface StoredLibrary {
  playlists: PlaylistRecord[];
  favorites: SongRecord[];
  history: HistoryRecord[];
}

/** Songs in the library are exactly the `Song` shape the app plays. */
export type SongRecord = Song;

/** Playlists in the library are exactly the `Playlist` shape the app edits. */
export type PlaylistRecord = Playlist;

/** A history entry is a song plus when it was last played. */
export type HistoryRecord = Song & { timestamp: number };

const EMPTY_LIBRARY: StoredLibrary = {
  playlists: [],
  favorites: [],
  history: [],
};

/** Last known values, used when `localStorage` is unavailable. */
let memoryLibrary: StoredLibrary = clone(EMPTY_LIBRARY);
let memoryPreferences: Preferences = {};
let memorySearchHistory: string[] = [];
let memoryQueue: PersistedQueue | null = null;
let hydrated = false;

/** Keep recent searches short enough to stay useful in the dropdown. */
export const MAX_SEARCH_HISTORY = 10;

function clone<T>(value: T): T {
  // structuredClone is unavailable in a few older embedded browsers.
  try {
    return typeof structuredClone === "function"
      ? structuredClone(value)
      : (JSON.parse(JSON.stringify(value)) as T);
  } catch {
    return value;
  }
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    // Accessing localStorage can throw when cookies are blocked.
    return window.localStorage;
  } catch {
    return null;
  }
}

function readJson<T>(storage: Storage, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return clone(fallback);

    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? clone(fallback) : (parsed as T);
  } catch {
    return clone(fallback);
  }
}

function writeJson(storage: Storage | null, key: string, value: unknown): void {
  if (!storage) return;

  try {
    storage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled — memory copy stays authoritative.
  }
}

/** Read a value, honouring a caller-supplied validator for corrupt data. */
function readLibrary(storage: Storage): StoredLibrary {
  const raw = readJson<Partial<StoredLibrary>>(storage, STORAGE_KEYS.library, EMPTY_LIBRARY);

  return {
    playlists: sanitizePlaylists(raw?.playlists),
    favorites: sanitizeSongs(raw?.favorites),
    history: sanitizeHistory(raw?.history),
  };
}

/**
 * Validate persisted collections against their schemas.
 *
 * `localStorage` is user-editable and import files are arbitrary JSON, so an
 * array being an array proves nothing. Invalid entries are dropped rather than
 * failing the whole read: losing one bad song beats rendering an empty library
 * (or crashing the page) with no way for the user to recover.
 */
function sanitizeSongs(value: unknown): SongRecord[] {
  if (!Array.isArray(value)) return [];
  const valid: SongRecord[] = [];
  for (const entry of value) {
    const parsed = SongSchema.safeParse(entry);
    if (parsed.success) valid.push(parsed.data);
  }
  return valid;
}

function sanitizePlaylists(value: unknown): PlaylistRecord[] {
  if (!Array.isArray(value)) return [];
  const valid: PlaylistRecord[] = [];
  for (const entry of value) {
    const parsed = PlaylistSchema.safeParse(entry);
    if (parsed.success) valid.push(parsed.data);
  }
  return valid;
}

function sanitizeHistory(value: unknown): HistoryRecord[] {
  if (!Array.isArray(value)) return [];
  const valid: HistoryRecord[] = [];
  for (const entry of value) {
    const parsed = SongSchema.safeParse(entry);
    if (!parsed.success) continue;
    const timestamp =
      entry && typeof entry === "object" && typeof (entry as { timestamp?: unknown }).timestamp === "number"
        ? (entry as { timestamp: number }).timestamp
        : 0;
    valid.push({ ...parsed.data, timestamp });
  }
  return valid;
}

function ensureHydrated(): void {
  if (hydrated) return;
  hydrated = true;

  const storage = getStorage();
  if (!storage) return;

  memoryLibrary = readLibrary(storage);
  const storedPrefs = readJson<Preferences>(storage, STORAGE_KEYS.preferences, {});
  memoryPreferences = storedPrefs && typeof storedPrefs === "object" ? storedPrefs : {};

  const storedHistory = readJson<unknown>(storage, STORAGE_KEYS.searchHistory, []);
  memorySearchHistory = Array.isArray(storedHistory)
    ? storedHistory.filter((item): item is string => typeof item === "string").slice(0, MAX_SEARCH_HISTORY)
    : [];

  // Queue lives in its own key. Entries are validated like library songs so a
  // corrupt or hand-edited value cannot reach playback unvalidated.
  const storedQueue = readJson<PersistedQueue | null>(storage, STORAGE_KEYS.queue, null);
  if (storedQueue && Array.isArray(storedQueue.songs)) {
    const songs = sanitizeSongs(storedQueue.songs).slice(0, MAX_PERSISTED_QUEUE);
    if (songs.length > 0) {
      const rawIndex = Number(storedQueue.index);
      memoryQueue = {
        songs,
        index: Number.isFinite(rawIndex) ? Math.max(0, Math.min(rawIndex, songs.length - 1)) : 0,
      };
    }
  }
}

/**
 * Clear cached state so the next read hits `localStorage` again.
 * Only needed by tests, which swap in a fresh storage between cases.
 */
export function resetLocalStoreForTests(): void {
  hydrated = false;
  memoryLibrary = clone(EMPTY_LIBRARY);
  memoryPreferences = {};
  memorySearchHistory = [];
  memoryQueue = null;
}

// ─── Library ────────────────────────────────────────────────────

export function readLibraryState(): StoredLibrary {
  ensureHydrated();
  return clone(memoryLibrary);
}

/**
 * Commit the whole library and notify other tabs.
 *
 * Callers pass the complete collection they want stored, so there is no
 * dependency on a previous copy being identical — the earlier bug where
 * song edits inside an existing playlist were dropped came from comparing
 * only playlist IDs before deciding to save.
 */
export function writeLibraryState(next: StoredLibrary): StoredLibrary {
  ensureHydrated();

  memoryLibrary = {
    playlists: Array.isArray(next.playlists) ? next.playlists : [],
    favorites: Array.isArray(next.favorites) ? next.favorites : [],
    history: Array.isArray(next.history) ? next.history : [],
  };

  writeJson(getStorage(), STORAGE_KEYS.library, memoryLibrary);

  // The browser fires `storage` in other tabs automatically; no custom event
  // is dispatched, so an in-tab writer cannot re-enter its own listener.
  return clone(memoryLibrary);
}

/** Persist one collection (playlists / favorites / history). */
export function writeLibrarySection<K extends keyof StoredLibrary>(
  key: K,
  value: StoredLibrary[K]
): StoredLibrary {
  const current = readLibraryState();
  current[key] = value;
  return writeLibraryState(current);
}

// ─── Preferences ────────────────────────────────────────────────

export function readPreferences(): Preferences {
  ensureHydrated();
  return { ...memoryPreferences };
}

export function patchPreferences(patch: Preferences): Preferences {
  ensureHydrated();

  memoryPreferences = { ...memoryPreferences, ...patch };
  writeJson(getStorage(), STORAGE_KEYS.preferences, memoryPreferences);

  return { ...memoryPreferences };
}

export function readPreference<T>(key: string, fallback: T): T {
  ensureHydrated();
  return Object.prototype.hasOwnProperty.call(memoryPreferences, key)
    ? (memoryPreferences[key] as T)
    : fallback;
}

// ─── Queue ──────────────────────────────────────────────────────

/**
 * Upper bound on persisted queue length. A queue longer than this is still
 * playable in memory; only the persisted copy is trimmed. This keeps the
 * stored value bounded so it can never crowd out the rest of the origin quota.
 */
export const MAX_PERSISTED_QUEUE = 200;

export function readQueue(): PersistedQueue | null {
  ensureHydrated();
  return memoryQueue ? { songs: [...memoryQueue.songs], index: memoryQueue.index } : null;
}

export function writeQueue(queue: PersistedQueue): void {
  ensureHydrated();
  const songs = Array.isArray(queue.songs) ? queue.songs.slice(0, MAX_PERSISTED_QUEUE) : [];
  const index = Number.isFinite(queue.index) ? Math.max(0, Math.min(queue.index, Math.max(songs.length - 1, 0))) : 0;

  memoryQueue = { songs, index };
  writeJson(getStorage(), STORAGE_KEYS.queue, { songs, index });
}

// ─── Search history ─────────────────────────────────────────────

export function readSearchHistory(): string[] {
  ensureHydrated();
  return [...memorySearchHistory];
}

/**
 * Add a query to the front of the list, de-duplicate case-insensitively and
 * cap the length. Returns the new list so callers can update state in one step.
 */
export function addSearchHistoryEntry(rawQuery: string): string[] {
  ensureHydrated();

  const query = rawQuery.trim();
  if (query.length < 2) return [...memorySearchHistory];

  const lower = query.toLowerCase();
  memorySearchHistory = [
    query,
    ...memorySearchHistory.filter((item) => item.toLowerCase() !== lower),
  ].slice(0, MAX_SEARCH_HISTORY);

  writeJson(getStorage(), STORAGE_KEYS.searchHistory, memorySearchHistory);
  return [...memorySearchHistory];
}

export function removeSearchHistoryEntry(query: string): string[] {
  ensureHydrated();

  const lower = query.trim().toLowerCase();
  memorySearchHistory = memorySearchHistory.filter(
    (item) => item.toLowerCase() !== lower
  );

  writeJson(getStorage(), STORAGE_KEYS.searchHistory, memorySearchHistory);
  return [...memorySearchHistory];
}

export function clearSearchHistory(): string[] {
  ensureHydrated();
  memorySearchHistory = [];
  writeJson(getStorage(), STORAGE_KEYS.searchHistory, []);
  return [];
}

/**
 * Subscribe to library changes made in *other tabs*. Returns an unsubscribe fn.
 *
 * Only `storage` is observed, never the `grovy:library-change` event this module
 * dispatches itself: a same-tab subscriber would receive its own write, set
 * state to an equal-but-new array, trigger a save, and loop forever. In-tab
 * components already get fresh state from the React update that caused the
 * write.
 */
export function subscribeLibrary(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent) => {
    // `key === null` means the whole storage area was cleared.
    if (event.key !== null && event.key !== `${STORAGE_PREFIX}${STORAGE_KEYS.library}`) {
      return;
    }

    // Force the next read to come from storage rather than the memory copy.
    hydrated = false;
    onChange();
  };

  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}
