/**
 * Appwrite-backed metadata cache and user collections.
 * Falls back to in-memory state when preference sync is unavailable.
 */

import { getGrovyPrefs, patchGrovyPrefs } from "@/app/lib/appwrite/prefsClient";

type SongRecord = { id: string; [key: string]: any };
type SearchEntry = { results: any[]; timestamp: number };

type OfflineState = {
  songs: Record<string, SongRecord>;
  searches: Record<string, SearchEntry>;
  playlists: any[];
  favorites: any[];
  history: any[];
};

const PREF_KEYS = {
  songs: "cachedSongs",
  searches: "cachedSearches",
  playlists: "playlists",
  favorites: "favorites",
  history: "history",
} as const;

let memoryState: OfflineState = {
  songs: {},
  searches: {},
  playlists: [],
  favorites: [],
  history: [],
};

function normalizeQuery(query: string): string {
  return query.toLowerCase().trim();
}

function readObject(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function readArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function hasPref(prefs: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(prefs, key);
}

async function loadState(): Promise<OfflineState> {
  const prefs = await getGrovyPrefs();

  memoryState = {
    songs: hasPref(prefs, PREF_KEYS.songs)
      ? readObject(prefs[PREF_KEYS.songs])
      : memoryState.songs,
    searches: hasPref(prefs, PREF_KEYS.searches)
      ? readObject(prefs[PREF_KEYS.searches])
      : memoryState.searches,
    playlists: hasPref(prefs, PREF_KEYS.playlists)
      ? readArray(prefs[PREF_KEYS.playlists])
      : memoryState.playlists,
    favorites: hasPref(prefs, PREF_KEYS.favorites)
      ? readArray(prefs[PREF_KEYS.favorites])
      : memoryState.favorites,
    history: hasPref(prefs, PREF_KEYS.history)
      ? readArray(prefs[PREF_KEYS.history])
      : memoryState.history,
  };

  return {
    songs: { ...memoryState.songs },
    searches: { ...memoryState.searches },
    playlists: [...memoryState.playlists],
    favorites: [...memoryState.favorites],
    history: [...memoryState.history],
  };
}

async function savePartialState(partial: Partial<OfflineState>): Promise<void> {
  memoryState = {
    songs: partial.songs ?? memoryState.songs,
    searches: partial.searches ?? memoryState.searches,
    playlists: partial.playlists ?? memoryState.playlists,
    favorites: partial.favorites ?? memoryState.favorites,
    history: partial.history ?? memoryState.history,
  };

  const patch: Record<string, unknown> = {};
  if (partial.songs !== undefined) patch[PREF_KEYS.songs] = memoryState.songs;
  if (partial.searches !== undefined) patch[PREF_KEYS.searches] = memoryState.searches;
  if (partial.playlists !== undefined) patch[PREF_KEYS.playlists] = memoryState.playlists;
  if (partial.favorites !== undefined) patch[PREF_KEYS.favorites] = memoryState.favorites;
  if (partial.history !== undefined) patch[PREF_KEYS.history] = memoryState.history;

  if (Object.keys(patch).length === 0) {
    return;
  }

  await patchGrovyPrefs(patch).catch(() => {
    // Ignore sync failures and keep memory fallback.
  });
}

// Song metadata cache
export async function cacheSong(song: SongRecord): Promise<void> {
  if (!song?.id) return;

  const state = await loadState();
  await savePartialState({
    songs: {
      ...state.songs,
      [song.id]: { ...song, _cachedAt: Date.now() },
    },
  });
}

export async function cacheSongs(songs: SongRecord[]): Promise<void> {
  if (!Array.isArray(songs) || songs.length === 0) return;

  const state = await loadState();
  const nextSongs = { ...state.songs };

  songs.forEach((song) => {
    if (!song?.id) return;
    nextSongs[song.id] = { ...song, _cachedAt: Date.now() };
  });

  await savePartialState({ songs: nextSongs });
}

export async function getCachedSong(id: string): Promise<any | null> {
  const state = await loadState();
  return state.songs[id] ?? null;
}

// Search results cache
export async function cacheSearchResults(query: string, results: any[]): Promise<void> {
  const normalized = normalizeQuery(query);
  if (!normalized) return;

  const state = await loadState();
  await savePartialState({
    searches: {
      ...state.searches,
      [normalized]: {
        results: Array.isArray(results) ? results : [],
        timestamp: Date.now(),
      },
    },
  });
}

export async function getCachedSearch(query: string, maxAge = 5 * 60 * 1000): Promise<any[] | null> {
  const normalized = normalizeQuery(query);
  if (!normalized) return null;

  const state = await loadState();
  const entry = state.searches[normalized];

  if (!entry) return null;
  if (Date.now() - (entry.timestamp || 0) > maxAge) return null;

  return Array.isArray(entry.results) ? entry.results : null;
}

// User playlists
export async function savePlaylists(playlists: any[]): Promise<void> {
  await savePartialState({ playlists: Array.isArray(playlists) ? playlists : [] });
}

export async function getPlaylists(): Promise<any[]> {
  const state = await loadState();
  return Array.isArray(state.playlists) ? state.playlists : [];
}

// Favorites
export async function saveFavorites(favoriteSongs: any[]): Promise<void> {
  await savePartialState({ favorites: Array.isArray(favoriteSongs) ? favoriteSongs : [] });
}

export async function getFavorites(): Promise<any[]> {
  const state = await loadState();
  return Array.isArray(state.favorites) ? state.favorites : [];
}

// History
export async function addToHistory(song: any): Promise<void> {
  if (!song?.id) return;

  const state = await loadState();
  const filtered = state.history.filter((entry) => entry?.id !== song.id);
  const updated = [{ ...song, timestamp: Date.now() }, ...filtered].slice(0, 50);

  await savePartialState({ history: updated });
}

export async function getHistory(): Promise<any[]> {
  const state = await loadState();
  return [...state.history].sort((a, b) => (b?.timestamp || 0) - (a?.timestamp || 0));
}

export async function clearHistory(): Promise<void> {
  await savePartialState({ history: [] });
}

// Cleanup
export async function clearOfflineCache(): Promise<void> {
  await savePartialState({ songs: {}, searches: {} });
}

export async function evictStaleSearches(maxAge = 60 * 60 * 1000): Promise<void> {
  const state = await loadState();
  const cutoff = Date.now() - maxAge;
  const nextSearches: Record<string, SearchEntry> = {};

  Object.entries(state.searches).forEach(([key, value]) => {
    if ((value?.timestamp || 0) >= cutoff) {
      nextSearches[key] = value;
    }
  });

  await savePartialState({ searches: nextSearches });
}
